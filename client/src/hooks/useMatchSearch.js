import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchMinutes } from "../lib/api.js";
import {
  loadStored,
  saveStored,
  loadWatched,
  saveWatched,
  STORAGE_KEY,
  TEAM_KEY,
  ESSENTIAL_KEY,
} from "../lib/storage.js";
import { TEAMS } from "../constants.js";

/**
 * Owns all match-search state and side effects:
 * - selected team (persisted)
 * - last result (persisted)
 * - loading / error
 * - `searched`: whether a search ran for the current selection. Refresh is
 *   only meaningful once Send has succeeded; changing the team resets it.
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

  const watchedSet = useMemo(() => new Set(watched), [watched]);

  // Mark the clicked minute and every earlier minute (by position in the
  // current chronological list) as watched, merging with anything already
  // stored for this match. Persists immediately, keyed by eventId.
  const markWatchedUpTo = useCallback(
    (index) => {
      if (!eventId) return;
      const minutes = result?.minutes || [];
      const upto = minutes.slice(0, index + 1);
      setWatched((prev) => {
        const next = Array.from(new Set([...prev, ...upto]));
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

  const send = useCallback(async () => {
    const ok = await load(selectedTeam, essentialOnly);
    if (ok) setSearched(true);
  }, [load, selectedTeam, essentialOnly]);

  // Re-fetch using the team from the last successful result if available,
  // otherwise the current selection.
  const refresh = useCallback(
    () => load(result?.query || selectedTeam, essentialOnly),
    [load, result, selectedTeam, essentialOnly]
  );

  // Changing the team hides Refresh until the next successful Send.
  const selectTeam = useCallback((team) => {
    setSelectedTeam(team);
    setSearched(false);
  }, []);

  // Flip the essential-only mode. If a search has already run, immediately
  // re-fetch with the new mode so the visible minutes update in place.
  const toggleEssential = useCallback(
    (next) => {
      setEssentialOnly(next);
      if (searched) load(result?.query || selectedTeam, next);
    },
    [searched, load, result, selectedTeam]
  );

  return {
    selectedTeam,
    result,
    loading,
    error,
    searched,
    essentialOnly,
    watchedSet,
    markWatchedUpTo,
    send,
    refresh,
    selectTeam,
    toggleEssential,
  };
}
