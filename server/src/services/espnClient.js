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
 * `maxDays` and returns the most recent completed match involving the team.
 * Returns { eventId, date, shortName } or null.
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

    for (const ev of events) {
      const comp = ev.competitions?.[0];
      if (!comp?.status?.type?.completed) continue;
      const involvesTeam = (comp.competitors || []).some(
        (c) => String(c.team?.id) === id
      );
      if (involvesTeam) {
        return {
          eventId: String(ev.id),
          date: ev.date,
          shortName: ev.shortName,
        };
      }
    }
  }
  return null;
}
