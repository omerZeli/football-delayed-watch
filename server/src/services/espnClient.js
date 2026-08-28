/**
 * Thin wrapper around ESPN's public (unofficial) soccer APIs.
 * No API key required. All endpoints return JSON.
 */

const SITE_API = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const SEARCH_API = "https://site.web.api.espn.com/apis/common/v3/search";

const DEFAULT_HEADERS = {
  // ESPN's WAF rejects non-browser-like User-Agents (custom UAs return 403),
  // so we present a standard browser UA string.
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function getJson(url) {
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`ESPN request failed (${res.status}) for ${url}`);
  }
  return res.json();
}

/**
 * Search for soccer teams by name.
 * Returns an array of normalized team matches: { id, league, displayName, abbreviation, logo }.
 */
export async function searchTeams(query, limit = 10) {
  const url = `${SEARCH_API}?query=${encodeURIComponent(
    query
  )}&limit=${limit}&sport=soccer`;
  const data = await getJson(url);
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .filter((item) => item.type === "team" && item.league)
    .map((item) => ({
      id: String(item.id),
      league: item.league, // slug, e.g. "eng.1"
      displayName: item.displayName || item.name,
      abbreviation: item.abbreviation || null,
      logo: item.logos?.[0]?.href || null,
      relevance: Number(item.relevance) || 0,
    }));
}

/**
 * Get a team's schedule (fixtures + results) for a given league.
 * Returns the raw events[] array.
 */
export async function getTeamSchedule(league, teamId) {
  const url = `${SITE_API}/${encodeURIComponent(
    league
  )}/teams/${encodeURIComponent(teamId)}/schedule`;
  const data = await getJson(url);
  return Array.isArray(data.events) ? data.events : [];
}

/**
 * Get full match summary (header, keyEvents, boxscore) for an event.
 */
export async function getMatchSummary(league, eventId) {
  const url = `${SITE_API}/${encodeURIComponent(
    league
  )}/summary?event=${encodeURIComponent(eventId)}`;
  return getJson(url);
}

function toYmd(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Fetch the league scoreboard for a specific day (YYYYMMDD).
 * Returns the raw events[] array.
 */
export async function getScoreboardForDate(league, ymd) {
  const url = `${SITE_API}/${encodeURIComponent(
    league
  )}/scoreboard?dates=${ymd}`;
  const data = await getJson(url);
  return Array.isArray(data.events) ? data.events : [];
}

/**
 * Fallback used when a team's league schedule is empty (common at season
 * boundaries). Scans the league scoreboard backwards day-by-day for up to
 * `maxDays` and returns the most recent match involving the team that has
 * already kicked off (live or completed).
 *
 * ESPN's `status.type.state` is "pre" (not started), "in" (live), or "post"
 * (finished). Within a given day we prefer a live match over a completed one;
 * because we scan from today backwards, the first started match we find is
 * also the most recent.
 *
 * Returns { eventId, date, shortName, live } or null.
 */
export async function findLastMatchViaScoreboard(league, teamId, maxDays = 120) {
  const id = String(teamId);
  for (let i = 0; i <= maxDays; i++) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - i);
    const ymd = toYmd(day);

    let events;
    try {
      events = await getScoreboardForDate(league, ymd);
    } catch {
      continue; // transient day failure shouldn't abort the whole scan
    }

    const started = [];
    for (const ev of events) {
      const comp = ev.competitions?.[0];
      const state = comp?.status?.type?.state;
      if (!state || state === "pre") continue; // not kicked off yet
      const involvesTeam = (comp.competitors || []).some(
        (c) => String(c.team?.id) === id
      );
      if (involvesTeam) {
        started.push({
          eventId: String(ev.id),
          date: ev.date,
          shortName: ev.shortName,
          live: state === "in",
        });
      }
    }

    if (started.length === 0) continue;

    // Prefer a live match on this day; otherwise the most recent by kickoff.
    const live = started
      .filter((m) => m.live)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (live.length > 0) return live[0];

    return started.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }
  return null;
}
