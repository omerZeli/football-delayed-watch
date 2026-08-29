/**
 * Thin wrapper around ESPN's public (unofficial) soccer APIs.
 * No API key required. All endpoints return JSON.
 */

const SITE_API = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const SEARCH_API = "https://site.web.api.espn.com/apis/common/v3/search";

// ESPN's WAF fingerprints requests and blocks anything that doesn't look like a
// real browser hitting espn.com. A bare User-Agent is enough from a residential
// IP, but from a datacenter (e.g. Render) ESPN is far stricter and 403s unless
// the request also carries the headers a browser sends: Origin/Referer of
// espn.com, Accept-Language, and the modern Client Hints / Fetch Metadata
// headers. We mirror those here.
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.espn.com",
  Referer: "https://www.espn.com/",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch JSON from ESPN with retry/backoff. ESPN's WAF blocks (403) and rate
 * limits (429) are often intermittent from datacenter IPs, so a couple of
 * retries with a short backoff meaningfully improve success. Other statuses
 * (e.g. 404) fail immediately since retrying won't help.
 */
async function getJson(url, { retries = 3, backoffMs = 400 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: DEFAULT_HEADERS });
    } catch (err) {
      // Network-level failure (DNS, reset, timeout): retry.
      lastErr = err;
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1));
        continue;
      }
      throw new Error(`ESPN request failed (network error) for ${url}: ${err.message}`);
    }

    if (res.ok) return res.json();

    // Retry only on blocks / rate limits / transient upstream errors.
    if ([403, 429, 500, 502, 503].includes(res.status) && attempt < retries) {
      lastErr = new Error(`ESPN request failed (${res.status}) for ${url}`);
      await sleep(backoffMs * (attempt + 1));
      continue;
    }

    throw new Error(`ESPN request failed (${res.status}) for ${url}`);
  }
  throw lastErr;
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
