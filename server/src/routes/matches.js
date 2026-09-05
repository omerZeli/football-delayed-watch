import { Router } from "express";
import {
  getLastMatchEventsByTeamName,
  getPlayerEventsByTeamName,
} from "../services/matchService.js";

const router = Router();

const ERROR_STATUS = {
  TEAM_NOT_FOUND: 404,
  NO_MATCHES: 404,
};

/**
 * GET /api/matches/last?team=Arsenal
 * Returns the main events from the team's most recent completed match.
 */
router.get("/last", async (req, res) => {
  const team = (req.query.team || "").toString().trim();

  if (!team) {
    return res.status(400).json({
      error: "Missing required query parameter: team",
    });
  }

  try {
    const result = await getLastMatchEventsByTeamName(team);
    return res.status(200).json(result);
  } catch (err) {
    const status = ERROR_STATUS[err.code] || 502;
    return res.status(status).json({
      error: err.message || "Failed to fetch match events",
      code: err.code || "UPSTREAM_ERROR",
    });
  }
});

/**
 * Run the full pipeline and reduce the resulting highlights to the distinct
 * minutes at which they occurred (chronological, de-duplicated). Minutes
 * without a known display value are omitted. Shared by the /minutes routes.
 */
async function respondWithMinutes(res, team, { essential = false } = {}) {
  const result = await getLastMatchEventsByTeamName(team, { essential });

  const seen = new Set();
  const minutes = [];
  for (const h of result.match.highlights) {
    if (h.minute && !seen.has(h.minute)) {
      seen.add(h.minute);
      minutes.push(h.minute);
    }
  }

  return res.status(200).json({
    query: result.query,
    team: result.team,
    match: {
      eventId: result.match.eventId,
      date: result.match.date,
      home: result.match.home,
      away: result.match.away,
    },
    minutes,
  });
}

function handleUpstreamError(res, err) {
  const status = ERROR_STATUS[err.code] || 502;
  return res.status(status).json({
    error: err.message || "Failed to fetch match events",
    code: err.code || "UPSTREAM_ERROR",
  });
}

/**
 * GET /api/matches/last/minutes?team=Arsenal
 * Same pipeline as /last, but returns only the minutes at which highlights
 * occurred (chronological, de-duplicated). Useful for a quick timeline of
 * when to watch. Minutes without a known display value are omitted.
 */
router.get("/last/minutes", async (req, res) => {
  const team = (req.query.team || "").toString().trim();

  if (!team) {
    return res.status(400).json({
      error: "Missing required query parameter: team",
    });
  }

  try {
    return await respondWithMinutes(res, team);
  } catch (err) {
    return handleUpstreamError(res, err);
  }
});

/**
 * GET /api/matches/last/minutes/essential?team=Arsenal
 * Like /last/minutes, but curated down to the most decisive moments only:
 * goals, shots on target (saved on goal) or off the woodwork, red cards /
 * sendings-off, and VAR decisions. Off-target/blocked shots, yellow cards,
 * substitutions, corners and free kicks are excluded.
 */
router.get("/last/minutes/essential", async (req, res) => {
  const team = (req.query.team || "").toString().trim();

  if (!team) {
    return res.status(400).json({
      error: "Missing required query parameter: team",
    });
  }

  try {
    return await respondWithMinutes(res, team, { essential: true });
  } catch (err) {
    return handleUpstreamError(res, err);
  }
});

/**
 * GET /api/matches/last/player-events?team=Arsenal&player=Bukayo%20Saka
 * Returns every commentary line from the team's most recent match that
 * mentions the given player, matched purely by name (case-insensitive
 * substring) — not filtered by highlight keywords. Each event includes its
 * minute, text, and highlight type (or null when it isn't a highlight).
 */
router.get("/last/player-events", async (req, res) => {
  const team = (req.query.team || "").toString().trim();
  const player = (req.query.player || "").toString().trim();

  if (!team) {
    return res.status(400).json({
      error: "Missing required query parameter: team",
    });
  }

  if (!player) {
    return res.status(400).json({
      error: "Missing required query parameter: player",
    });
  }

  try {
    const result = await getPlayerEventsByTeamName(team, player);

    // Reduce the player's events to the distinct minutes they occurred at
    // (chronological, de-duplicated), exactly like /last/minutes does for a
    // team. This lets the client render player moments through the same
    // "Key moments" UI (watched tracking, TV-sync, extra-time toggle).
    const seen = new Set();
    const minutes = [];
    for (const ev of result.events) {
      if (ev.minute && !seen.has(ev.minute)) {
        seen.add(ev.minute);
        minutes.push(ev.minute);
      }
    }

    return res.status(200).json({
      query: result.query,
      team: result.team,
      player: result.player,
      match: result.match,
      minutes,
      events: result.events,
    });
  } catch (err) {
    return handleUpstreamError(res, err);
  }
});

export default router;
