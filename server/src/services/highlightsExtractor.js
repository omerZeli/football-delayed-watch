/**
 * Filters raw ESPN minute-by-minute commentary down to the "highlights":
 * the moments that actually matter in a match. The category keywords below
 * were derived by studying real ESPN commentary text across several matches.
 *
 * Categories requested:
 *   goals, subs, corners, cards, shots, blocks/saves, misses (missing),
 *   var, attempts, and free kicks in the offensive (attacking) half.
 *
 * ESPN commentary is free text with very consistent leading phrases, e.g.:
 *   "Goal! Fulham 1, Chelsea 2. Morgan Rogers (Chelsea) right footed shot..."
 *   "Attempt saved. Cole Palmer (Chelsea) right footed shot ... is saved..."
 *   "Attempt blocked. Reece James (Chelsea) ... is blocked."
 *   "Attempt missed. João Pedro (Chelsea) ... misses to the right."
 *   "Corner, Chelsea. Conceded by Antonee Robinson."
 *   "Substitution, Chelsea. Enzo Fernández replaces Roméo Lavia."
 *   "Levi Colwill (Chelsea) is shown the yellow card for a bad foul."
 *   "João Pedro (Chelsea) wins a free kick in the attacking half."
 *   "Timothy Castagne (Fulham) wins a free kick on the right wing."
 *   "Maxim De Cuyper (...) hits the right post with a right footed shot..."
 *   "VAR Decision: Card upgraded João Gomes (Aston Villa)."
 */

/**
 * Ordered list of highlight classifiers. Order matters: the first matching
 * rule wins, so more specific categories (e.g. goal) must come before more
 * general ones (e.g. shot), because a "Goal!" line also mentions a "shot".
 *
 * Each rule: { type, test } where test is a RegExp run against the raw text.
 */
const HIGHLIGHT_RULES = [
  // Goals (including own goals and penalties). Checked first so goal lines
  // aren't swallowed by the generic "shot" rule.
  { type: "goal", test: /^Goal!|^Own Goal|Penalty (scored|missed)/i },

  // Woodwork counts as a notable miss/attempt: "hits the bar/left post/right post".
  { type: "woodwork", test: /\bhits the (bar|crossbar|left post|right post|post)\b/i },

  // Attempts: ESPN prefixes these with "Attempt saved/blocked/missed".
  { type: "save", test: /^Attempt saved\b/i },
  { type: "block", test: /^Attempt blocked\b/i },
  { type: "miss", test: /^Attempt missed\b/i },

  // Any other shot phrasing not already caught above (defensive fallback so
  // we never drop a genuine shot/header/attempt on goal).
  { type: "shot", test: /\b(footed shot|header from|shot from)\b/i },

  // Cards.
  { type: "card", test: /is shown the (yellow|red|second yellow) card/i },

  // Substitutions.
  { type: "substitution", test: /^Substitution\b/i },

  // Corners.
  { type: "corner", test: /^Corner,/i },

  // Free kicks won in the offensive half only:
  //   - "wins a free kick in the attacking half"
  //   - "wins a free kick on the right wing" / "on the left wing"
  // Defensive-half free kicks are intentionally excluded (not a highlight).
  {
    type: "freeKickOffensive",
    test: /wins a free kick (in the attacking half|on the (right|left) wing)\b/i,
  },

  // VAR decisions / reviews.
  { type: "var", test: /\bVAR\b/i },
];

/**
 * Classify a single commentary line into a highlight type, or null if it's
 * not a highlight (e.g. "Foul by ...", "First Half begins", lineups, delays,
 * defensive-half free kicks, offside, etc.).
 * @param {string} text
 * @returns {string|null} highlight type
 */
export function classifyHighlight(text) {
  if (!text) return null;
  for (const rule of HIGHLIGHT_RULES) {
    if (rule.test.test(text)) return rule.type;
  }
  return null;
}

/**
 * Reduce full commentary to highlights only, preserving chronological order.
 * @param {Array<{sequence:number|null, minute:string|null, text:string}>} commentary
 *   already-normalized, chronological commentary (see eventsExtractor).
 * @returns {Array<{sequence, minute, text, type}>} highlight entries with a type tag.
 */
export function extractHighlights(commentary = []) {
  const highlights = [];
  for (const c of commentary) {
    const type = classifyHighlight(c.text);
    if (type) {
      highlights.push({ ...c, type });
    }
  }
  return highlights;
}
