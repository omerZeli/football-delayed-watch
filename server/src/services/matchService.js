import {
  searchTeams,
  getTeamSchedule,
  getMatchSummary,
  findLastMatchViaScoreboard,
} from "./espnClient.js";
import { normalizeMatch } from "./eventsExtractor.js";

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
 * Find the most recent completed match for a team from its schedule.
 * Returns { eventId, date, shortName } or null.
 */
export function findLastCompletedMatch(events) {
  const completed = events
    .filter((ev) => ev.competitions?.[0]?.status?.type?.completed)
    .map((ev) => ({
      eventId: String(ev.id),
      date: ev.date,
      shortName: ev.shortName,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return completed[0] || null;
}

/**
 * Full pipeline: team name -> resolved team -> last completed match -> normalized events.
 * Throws typed errors (with .code) so the route can map them to HTTP status codes.
 */
export async function getLastMatchEventsByTeamName(teamName) {
  const team = await resolveTeam(teamName);
  if (!team) {
    const err = new Error(`No soccer team found matching "${teamName}".`);
    err.code = "TEAM_NOT_FOUND";
    throw err;
  }

  const schedule = await getTeamSchedule(team.league, team.id);
  let lastMatch = findLastCompletedMatch(schedule);

  // The league schedule only covers the current season and can be empty at
  // season boundaries. Fall back to scanning the league scoreboard backwards.
  if (!lastMatch) {
    lastMatch = await findLastMatchViaScoreboard(team.league, team.id);
  }

  if (!lastMatch) {
    const err = new Error(
      `No completed matches found for ${team.displayName}.`
    );
    err.code = "NO_MATCHES";
    throw err;
  }

  const summary = await getMatchSummary(team.league, lastMatch.eventId);
  const match = normalizeMatch(summary);

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
