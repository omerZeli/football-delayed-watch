import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchMinutes, fetchPlayerEvents } from "../lib/api.js";
import {
  loadStored,
  saveStored,
  loadWatched,
  saveWatched,
  STORAGE_KEY,
  TEAM_KEY,
  ESSENTIAL_KEY,
  PLAYER_KEY,
  PLAYER_MODE_KEY,
} from "../lib/storage.js";
import { TEAMS } from "../constants.js";

/**
 * Owns all match-search state and side effects:
 * - selected team (persisted)
 * - last result (persisted)
 * - loading / error
 * - `searched`: whether a search ran for the current selection. Used to decide
 *   whether toggling essential-only should auto-refetch; changing the team
 *   resets it until the next successful Send.
 */
export function useMatchSearch() {
  const [selectedTeam, setSelectedTeam] = useState(
    () => loadStored(TEAM_KEY) || TEAMS[0]
  );
  const [result, setResult] = useState(() => loadStored(STORAGE_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [essentialOnly, setEssentialOnly] = useState(
    () => loadStored(ESSENTIAL_KEY) === true
  );
  // Whether extra-time minutes (base minute > 90) are shown. Defaults to
  // hidden and resets to hidden on every Send.
  const [showExtraTime, setShowExtraTime] = useState(false);

  // --- Player-events feature state -----------------------------------------
  // Selected player (persisted). A player search reuses the SAME `result`,
  // `loading` and `error` state as the team search, so player moments render
  // through the identical "Key moments" UI (chips, watched tracking, TV-sync,
  // extra-time toggle). `searchMode` just records which kind of search
  // produced the current result, for labelling.
  const [selectedPlayer, setSelectedPlayer] = useState(
    () => loadStored(PLAYER_KEY) || ""
  );
  const [searchMode, setSearchMode] = useState("team"); // "team" | "player"
  // Whether the user has switched the controls into "search by player" mode
  // (checkbox on). When on, the player field replaces the highlight toggle and
  // Send performs a player search instead of a team search.
  const [playerMode, setPlayerMode] = useState(
    () => Boolean(loadStored(PLAYER_MODE_KEY))
  );

  // Bumped only when a Send targets a different team than the previous Send, so
  // the TV-sync inputs remount and clear. Sending the same team again keeps the
  // user's entered game minute / TV time.
  const [syncResetKey, setSyncResetKey] = useState(0);
  // Team of the last Send, used to decide whether to reset the TV-sync fields.
  const lastSyncedTeamRef = useRef(null);

  const eventId = result?.match?.eventId || null;

  // Watched minutes for the currently loaded match, loaded from storage
  // whenever the match changes so progress persists across refreshes.
  const [watched, setWatched] = useState(() => loadWatched(eventId));

  useEffect(() => {
    setWatched(loadWatched(eventId));
  }, [eventId]);

  useEffect(() => {
    saveStored(TEAM_KEY, selectedTeam);
  }, [selectedTeam]);

  useEffect(() => {
    saveStored(ESSENTIAL_KEY, essentialOnly);
  }, [essentialOnly]);

  useEffect(() => {
    if (result) saveStored(STORAGE_KEY, result);
  }, [result]);

  useEffect(() => {
    saveStored(PLAYER_KEY, selectedPlayer);
  }, [selectedPlayer]);

  useEffect(() => {
    saveStored(PLAYER_MODE_KEY, playerMode);
  }, [playerMode]);

  const watchedSet = useMemo(() => new Set(watched), [watched]);

  // The smallest unwatched minute, used by the TV-sync feature to point the
  // user at the next moment they still need to watch. Stoppage time is added
  // to the base (e.g. "90+3" counts as 93 minutes), so extra-time minutes are
  // distinct playback points rather than collapsing onto their base minute.
  // Returns { label, value } — the display label (e.g. "90+3") and its total
  // minute value — or null when everything is watched or the list is empty.
  const nextUnwatchedMinute = useMemo(() => {
    const minutes = result?.minutes || [];
    let best = null;
    for (const m of minutes) {
      if (watchedSet.has(m)) continue;
      const [basePart, extraPart] = String(m).split("+");
      const base = parseInt(basePart, 10);
      if (!Number.isFinite(base)) continue;
      const extra = extraPart ? parseInt(extraPart, 10) || 0 : 0;
      const value = base + extra;
      if (best == null || value < best.value) {
        best = { label: String(m), value };
      }
    }
    return best;
  }, [result, watchedSet]);

  // Toggle watched state for the clicked minute. If it isn't watched yet, mark
  // it and every earlier minute (by position in the current chronological list)
  // as watched. If it's already watched, unmark only that single minute.
  // Persists immediately, keyed by eventId.
  const markWatchedUpTo = useCallback(
    (index) => {
      if (!eventId) return;
      const minutes = result?.minutes || [];
      const clicked = minutes[index];
      if (clicked == null) return;
      setWatched((prev) => {
        let next;
        if (prev.includes(clicked)) {
          // Already watched: unmark just this one.
          next = prev.filter((m) => m !== clicked);
        } else {
          // Not watched: mark it and everything before it.
          const upto = minutes.slice(0, index + 1);
          next = Array.from(new Set([...prev, ...upto]));
        }
        saveWatched(eventId, next);
        return next;
      });
    },
    [eventId, result]
  );

  const load = useCallback(async (team, essential) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMinutes(team, { essential });
      setResult(data);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset the TV-sync inputs (by remounting) whenever a Send targets a
  // different "subject" than the previous one — a different team, or switching
  // between team and player search — so stale game-minute/TV-time inputs clear.
  const maybeResetSync = useCallback((subject) => {
    if (lastSyncedTeamRef.current !== subject) {
      setSyncResetKey((k) => k + 1);
      lastSyncedTeamRef.current = subject;
    }
  }, []);

  const runTeamSearch = useCallback(async () => {
    setShowExtraTime(false);
    maybeResetSync(`team:${selectedTeam}`);
    setSearchMode("team");
    const ok = await load(selectedTeam, essentialOnly);
    if (ok) setSearched(true);
  }, [load, selectedTeam, essentialOnly, maybeResetSync]);

  // Changing the team clears the "already searched" flag so the essential-only
  // toggle won't auto-refetch until the next successful Send. It also clears
  // the selected player, since suggested players are team-specific.
  const selectTeam = useCallback((team) => {
    setSelectedTeam(team);
    setSearched(false);
    setSelectedPlayer("");
  }, []);

  // Select a player (from the dropdown or free text).
  const selectPlayer = useCallback((player) => {
    setSelectedPlayer(player);
  }, []);

  // Toggle "search by player" mode (the checkbox). Turning it off doesn't
  // clear the current result — the user can flip back and re-send.
  const togglePlayerMode = useCallback((next) => {
    setPlayerMode(Boolean(next));
  }, []);

  // Search a player: fetch the minutes the player was involved in and store
  // them in the SAME `result` state a team search uses, so they render through
  // the identical "Key moments" UI with all its features. Shares loading/error
  // with the team search.
  const runPlayerSearch = useCallback(async () => {
    const team = selectedTeam?.trim();
    const player = selectedPlayer?.trim();
    if (!team || !player) return;
    setShowExtraTime(false);
    maybeResetSync(`player:${team}:${player}`);
    setSearchMode("player");
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlayerEvents(team, player);
      setResult(data);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedPlayer, maybeResetSync]);

  // The single Send action. In player mode it runs a player search; otherwise
  // a team search. This lets one button serve both flows (the checkbox decides
  // which), so there's no separate "Find player" button.
  const send = useCallback(() => {
    if (playerMode) return runPlayerSearch();
    return runTeamSearch();
  }, [playerMode, runPlayerSearch, runTeamSearch]);

  // Flip the essential-only mode. Essential-only only applies to team
  // searches; if a team search has already run, immediately re-fetch with the
  // new mode so the visible minutes update in place. For a player search the
  // toggle just records the preference for the next team search.
  const toggleEssential = useCallback(
    (next) => {
      setEssentialOnly(next);
      if (searched && searchMode === "team") {
        load(selectedTeam, next);
      }
    },
    [searched, searchMode, load, selectedTeam]
  );

  return {
    selectedTeam,
    result,
    loading,
    error,
    essentialOnly,
    watchedSet,
    showExtraTime,
    nextUnwatchedMinute,
    syncResetKey,
    searchMode,
    toggleExtraTime: () => setShowExtraTime((v) => !v),
    markWatchedUpTo,
    send,
    selectTeam,
    toggleEssential,
    // Player-events feature.
    selectedPlayer,
    selectPlayer,
    playerMode,
    togglePlayerMode,
  };
}
