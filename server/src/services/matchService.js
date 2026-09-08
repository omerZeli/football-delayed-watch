import {
  searchTeams,
  getTeamSchedule,
  getMatchSummary,
  findLastMatchViaScoreboard,
} from "./espnClient.js";
import { normalizeMatch, extractPlayerEvents } from "./eventsExtractor.js";

/**
 * Resolve the best-matching team for a free-text name.
 * Prefers exact / case-insensitive name matches, then falls back to
 * the highest-relevance result from ESPN.
 */
export async function resolveTeam(name) {
  const teams = await searchTeams(name, 15);
  if (teams.length === 0) return null;

  const normalized = name.trim().toLowerCase();

  const exact = teams.find(
    (t) => t.displayName && t.displayName.toLowerCase() === normalized
  );
  if (exact) return exact;

  const startsWith = teams.find(
    (t) => t.displayName && t.displayName.toLowerCase().startsWith(normalized)
  );
  if (startsWith) return startsWith;

  // Otherwise trust ESPN's relevance ordering.
  return teams.sort((a, b) => b.relevance - a.relevance)[0];
}

/**
 * Find the most recent match that has already kicked off (live or completed)
 * for a team, from its schedule.
 *
 * ESPN exposes `status.type.state`: "pre" (not started), "in" (live), or
 * "post" (finished). We consider any match that is NOT "pre" as started.
 * A live match ("in") is always preferred over a completed one, regardless
 * of kickoff time; otherwise we fall back to the most recent by date.
 *
 * Returns { eventId, date, shortName, live } or null.
 */
export function findLastStartedMatch(events) {
  const started = events
    .map((ev) => ev.competitions?.[0] ? { ev, status: ev.competitions[0].status?.type } : null)
    .filter((x) => x && x.status && x.status.state !== "pre")
    .map(({ ev, status }) => ({
      eventId: String(ev.id),
      date: ev.date,
      shortName: ev.shortName,
      live: status.state === "in",
    }));

  if (started.length === 0) return null;

  // Prefer any live match; among ties, the most recent by kickoff.
  const live = started
    .filter((m) => m.live)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (live.length > 0) return live[0];

  return started.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

// Continental club competitions that a team's domestic-league schedule/
// scoreboard won't surface (ESPN scopes both by competition slug). Big clubs
// regularly have their most recent - or currently live - match be one of
// these rather than a domestic league fixture, so we scan them too.
const CONTINENTAL_CUP_LEAGUES = [
  "uefa.champions",
  "uefa.europa",
  "uefa.europa.conf",
];

/**
 * Pick the best of two candidate matches (possibly null), each optionally
 * tagged with the league it was found in. A live match always wins; between
 * two non-live (or two live) candidates, the most recent kickoff wins.
 */
function pickBetterMatch(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.live !== b.live) return a.live ? a : b;
  return new Date(a.date) >= new Date(b.date) ? a : b;
}

/**
 * Full pipeline: team name -> resolved team -> last completed match -> normalized events.
 * Throws typed errors (with .code) so the route can map them to HTTP status codes.
 * Pass { essential: true } to curate highlights down to the decisive moments
 * only (goals, shots on target/woodwork, red cards, VAR).
 */
export async function getLastMatchEventsByTeamName(teamName, { essential = false } = {}) {
  const team = await resolveTeam(teamName);
  if (!team) {
    const err = new Error(`No soccer team found matching "${teamName}".`);
    err.code = "TEAM_NOT_FOUND";
    throw err;
  }

  const schedule = await getTeamSchedule(team.league, team.id);
  let lastMatch = findLastStartedMatch(schedule);
  if (lastMatch) lastMatch = { ...lastMatch, league: team.league };

  // The team schedule feed lags: an in-progress match often isn't listed
  // there yet (or the feed is empty at season boundaries), so on its own it
  // can point at a stale, already-completed game while a newer one is live.
  // The league scoreboard, by contrast, reflects live matches immediately.
  //
  // Scan the scoreboard (today first, then backwards) and prefer its result
  // whenever it finds a live match, or whenever the schedule gave us nothing.
  // Only fall back to the schedule's completed match when the scoreboard has
  // no live game to offer.
  if (!lastMatch || !lastMatch.live) {
    const scoreboardMatch = await findLastMatchViaScoreboard(
      team.league,
      team.id
    );
    if (scoreboardMatch && (scoreboardMatch.live || !lastMatch)) {
      lastMatch = { ...scoreboardMatch, league: team.league };
    }
  }

  // A team's domestic league/schedule never includes continental cup
  // fixtures (Champions League, Europa League, Conference League): ESPN
  // scopes those under their own league slugs entirely. Scan them too, so a
  // currently-live or more recent cup match isn't shadowed by a stale
  // domestic result (e.g. last weekend's league game).
  const cupMatches = await Promise.all(
    CONTINENTAL_CUP_LEAGUES.map(async (league) => {
      try {
        const match = await findLastMatchViaScoreboard(league, team.id, 30);
        return match ? { ...match, league } : null;
      } catch {
        return null; // a cup the team isn't in, or a transient failure
      }
    })
  );
  for (const cupMatch of cupMatches) {
    lastMatch = pickBetterMatch(lastMatch, cupMatch);
  }

  if (!lastMatch) {
    const err = new Error(
      `No completed matches found for ${team.displayName}.`
    );
    err.code = "NO_MATCHES";
    throw err;
  }

  const summary = await getMatchSummary(lastMatch.league, lastMatch.eventId);
  const match = normalizeMatch(summary, { essential });

  return {
    query: teamName,
    team: {
      id: team.id,
      name: team.displayName,
      league: team.league,
      logo: team.logo,
    },
    match,
  };
}

/**
 * Full pipeline for the player-events feature: team name -> resolved team ->
 * last started match -> every commentary line that mentions the given player,
 * matched by name only (not by highlight keyword). Reuses the same match
 * resolution as getLastMatchEventsByTeamName so a team's most recent live or
 * completed game is used.
 *
 * @param {string} teamName - free-text team name (dropdown value or typed).
 * @param {string} playerName - free-text player name to search commentary for.
 * @returns {Promise<{ query, team, player, match }>} where match contains the
 *   match metadata plus `events`: the chronological commentary lines naming
 *   the player, each tagged with its highlight `type` (or null).
 * @throws typed errors (.code) mapped to HTTP status by the route.
 */
export async function getPlayerEventsByTeamName(teamName, playerName) {
  const result = await getLastMatchEventsByTeamName(teamName);
  const events = extractPlayerEvents(result.match.commentary, playerName);

  return {
    query: { team: teamName, player: playerName },
    team: result.team,
    player: playerName,
    match: {
      eventId: result.match.eventId,
      date: result.match.date,
      home: result.match.home,
      away: result.match.away,
    },
    events,
  };
}
