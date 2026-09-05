/**
 * Transforms a raw ESPN match summary into a clean, client-friendly shape:
 * match metadata, score, the match highlights, and team stats.
 */

import { extractHighlights, classifyHighlight } from "./highlightsExtractor.js";

// Which stats from the boxscore we surface alongside the commentary.
const STAT_KEYS = [
  "totalShots",
  "shotsOnTarget",
  "possessionPct",
  "wonCorners",
  "foulsCommitted",
  "yellowCards",
  "redCards",
  "offsides",
  "saves",
];

/**
 * Extract the full minute-by-minute commentary, in chronological order.
 * ESPN sometimes returns it newest-first, so we sort ascending by sequence.
 */
function extractCommentary(commentary = []) {
  return [...commentary]
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((c) => ({
      sequence: c.sequence ?? null,
      minute: c.time?.displayValue || null,
      text: c.text || "",
    }));
}

function extractTeamStats(boxscoreTeams = []) {
  return boxscoreTeams.map((entry) => {
    const stats = {};
    for (const s of entry.statistics || []) {
      if (STAT_KEYS.includes(s.name)) {
        stats[s.name] = s.displayValue;
      }
    }
    return {
      team: entry.team?.displayName || null,
      teamId: entry.team?.id ? String(entry.team.id) : null,
      stats,
    };
  });
}

function extractHeader(summary) {
  const competition = summary.header?.competitions?.[0];
  const competitors = competition?.competitors || [];

  const side = (homeAway) => {
    const c = competitors.find((x) => x.homeAway === homeAway);
    if (!c) return null;
    return {
      team: c.team?.displayName || null,
      teamId: c.team?.id ? String(c.team.id) : null,
      score: c.score != null ? Number(c.score) : null,
      winner: Boolean(c.winner),
    };
  };

  return {
    eventId: summary.header?.id ? String(summary.header.id) : null,
    date: competition?.date || null,
    venue: competition?.venue?.fullName || summary.gameInfo?.venue?.fullName || null,
    status: competition?.status?.type?.description || null,
    completed: Boolean(competition?.status?.type?.completed),
    home: side("home"),
    away: side("away"),
  };
}

/**
 * @param {object} summary - raw ESPN match summary
 * @returns normalized match object with:
 *   - highlights: the curated key moments (goals, subs, corners, cards, shots,
 *     blocks/saves, misses, VAR, attempts, and offensive-half free kicks),
 *     chronological. Derived by filtering the full commentary.
 *   - commentary: the full minute-by-minute commentary in chronological order,
 *     each line tagged with its highlight `type` (or null if it isn't a
 *     highlight). Unlike `highlights`, nothing is dropped — this is what the
 *     player-events feature matches player names against.
 *   - teamStats: aggregate stats (shots on target, corners, possession, etc.)
 */
export function normalizeMatch(summary, { essential = false } = {}) {
  const header = extractHeader(summary);
  const commentary = extractCommentary(summary.commentary);
  return {
    ...header,
    highlights: extractHighlights(commentary, { essential }),
    commentary: commentary.map((c) => ({
      ...c,
      type: classifyHighlight(c.text),
    })),
    teamStats: extractTeamStats(summary.boxscore?.teams),
  };
}

/**
 * Find every commentary line that mentions a given player, matched purely by
 * name (case-insensitive substring) rather than by any highlight keyword. This
 * returns everything the player was involved in — goals, fouls, offsides,
 * subs, cards, and plain mentions — in chronological order.
 *
 * @param {Array<{sequence, minute, text, type}>} commentary - normalized,
 *   chronological commentary (see normalizeMatch).
 * @param {string} playerName - the player's name to look for.
 * @returns {Array<{sequence, minute, text, type}>} matching commentary lines.
 */
export function extractPlayerEvents(commentary = [], playerName = "") {
  const needle = playerName.trim().toLowerCase();
  if (!needle) return [];
  return commentary.filter((c) => c.text.toLowerCase().includes(needle));
}
