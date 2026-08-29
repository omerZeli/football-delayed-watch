// API client for the matches endpoints.

/**
 * Shift a server-provided minute display value back by one minute.
 * For stoppage-time minutes ("45+2"), the stoppage part is decremented
 * ("45+2" -> "45+1"); for plain minutes ("45" -> "44") the base minute is
 * decremented. Trailing formatting (e.g. "90'") is preserved. Numbers never
 * drop below 0. Values without a leading number are returned unchanged.
 */
export function shiftMinuteBackByOne(minute) {
  if (minute == null) return minute;
  const str = String(minute);

  // Stoppage time, e.g. "45+2" -> "45+1" (reduce the added minutes).
  const stoppage = str.match(/^(\d+)\+(\d+)(.*)$/);
  if (stoppage) {
    const added = Math.max(0, parseInt(stoppage[2], 10) - 1);
    return `${stoppage[1]}+${added}${stoppage[3]}`;
  }

  // Plain minute, e.g. "45" -> "44" (or "90'" -> "89'").
  const plain = str.match(/^(\d+)(.*)$/);
  if (!plain) return minute;
  const base = Math.max(0, parseInt(plain[1], 10) - 1);
  return `${base}${plain[2]}`;
}

/**
 * Fetch the highlight minutes for a team's most recent match.
 * @param {string} team
 * @param {object} [options]
 * @param {boolean} [options.essential=false] when true, hit the curated
 *   endpoint that returns only the most decisive moments (goals, shots on
 *   target/woodwork, red cards, VAR).
 */
export async function fetchMinutes(team, { essential = false } = {}) {
  const path = essential
    ? "/api/matches/last/minutes/essential"
    : "/api/matches/last/minutes";
  const res = await fetch(`${path}?team=${encodeURIComponent(team)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (Array.isArray(body.minutes)) {
    body.minutes = body.minutes.map(shiftMinuteBackByOne);
  }
  return body;
}
