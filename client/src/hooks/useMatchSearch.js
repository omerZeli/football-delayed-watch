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

  // Bumped on every Send so the TV-sync inputs remount and clear their values.
  const [syncResetKey, setSyncResetKey] = useState(0);

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

  // The smallest unwatched minute (by base minute number, ignoring any "+"
  // stoppage suffix), used by the TV-sync feature to point the user at the next
  // moment they still need to watch. Null when everything is watched or the
  // list is empty.
  const nextUnwatchedMinute = useMemo(() => {
    const minutes = result?.minutes || [];
    const bases = minutes
      .filter((m) => !watchedSet.has(m))
      .map((m) => parseInt(String(m).split("+")[0], 10))
      .filter((n) => Number.isFinite(n));
    return bases.length ? Math.min(...bases) : null;
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

  const send = useCallback(async () => {
    setShowExtraTime(false);
    // Clear the TV-sync fields on a fresh fetch by remounting the input.
    setSyncResetKey((k) => k + 1);
    const ok = await load(selectedTeam, essentialOnly);
    if (ok) setSearched(true);
  }, [load, selectedTeam, essentialOnly]);

  // Changing the team clears the "already searched" flag so the essential-only
  // toggle won't auto-refetch until the next successful Send.
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
    essentialOnly,
    watchedSet,
    showExtraTime,
    nextUnwatchedMinute,
    syncResetKey,
    toggleExtraTime: () => setShowExtraTime((v) => !v),
    markWatchedUpTo,
    send,
    selectTeam,
    toggleEssential,
  };
}
