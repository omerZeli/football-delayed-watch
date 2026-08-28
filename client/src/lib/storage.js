// Small localStorage helpers with JSON (de)serialization and safe fallback.
export const STORAGE_KEY = "fdw:lastResult";
export const TEAM_KEY = "fdw:lastTeam";
// Watched minutes, keyed per match: { [eventId]: ["1'", "15'", ...] }.
export const WATCHED_KEY = "fdw:watched";

export function loadStored(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / serialization errors.
  }
}

// --- Watched minutes, persisted per match --------------------------------
// Stored as { [eventId]: [minuteString, ...] }. We key by the match's stable
// ESPN eventId so a team's watched progress survives refreshes even as new
// live events (and thus new minutes) come in.

export function loadWatched(eventId) {
  if (!eventId) return [];
  const all = loadStored(WATCHED_KEY) || {};
  const list = all[eventId];
  return Array.isArray(list) ? list : [];
}

export function saveWatched(eventId, minutes) {
  if (!eventId) return;
  const all = loadStored(WATCHED_KEY) || {};
  all[eventId] = Array.from(new Set(minutes));
  saveStored(WATCHED_KEY, all);
}
