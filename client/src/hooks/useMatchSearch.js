import { useState, useEffect, useCallback } from "react";
import { fetchMinutes } from "../lib/api.js";
import {
  loadStored,
  saveStored,
  STORAGE_KEY,
  TEAM_KEY,
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

  useEffect(() => {
    saveStored(TEAM_KEY, selectedTeam);
  }, [selectedTeam]);

  useEffect(() => {
    if (result) saveStored(STORAGE_KEY, result);
  }, [result]);

  const load = useCallback(async (team) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMinutes(team);
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
    const ok = await load(selectedTeam);
    if (ok) setSearched(true);
  }, [load, selectedTeam]);

  // Re-fetch using the team from the last successful result if available,
  // otherwise the current selection.
  const refresh = useCallback(
    () => load(result?.query || selectedTeam),
    [load, result, selectedTeam]
  );

  // Changing the team hides Refresh until the next successful Send.
  const selectTeam = useCallback((team) => {
    setSelectedTeam(team);
    setSearched(false);
  }, []);

  return {
    selectedTeam,
    result,
    loading,
    error,
    searched,
    send,
    refresh,
    selectTeam,
  };
}
