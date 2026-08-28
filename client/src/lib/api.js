// API client for the matches endpoints.
export async function fetchMinutes(team) {
  const res = await fetch(
    `/api/matches/last/minutes?team=${encodeURIComponent(team)}`
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}
