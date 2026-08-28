// Small localStorage helpers with JSON (de)serialization and safe fallback.
export const STORAGE_KEY = "fdw:lastResult";
export const TEAM_KEY = "fdw:lastTeam";

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
