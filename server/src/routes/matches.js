import { Router } from "express";
import { getLastMatchEventsByTeamName } from "../services/matchService.js";

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
    const result = await getLastMatchEventsByTeamName(team);

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
        home: result.match.home,
        away: result.match.away,
      },
      minutes,
    });
  } catch (err) {
    const status = ERROR_STATUS[err.code] || 502;
    return res.status(status).json({
      error: err.message || "Failed to fetch match events",
      code: err.code || "UPSTREAM_ERROR",
    });
  }
});

export default router;
