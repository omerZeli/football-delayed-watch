// Ordered list of selectable teams. Add more names here; the dropdown
// renders them in array order.
export const TEAMS = [
  "Real Madrid",
  "Arsenal",
  "Manchester United",
  "AC Milan",
  "Bayern Munich",
  "Barcelona",
  "Manchester City",
  "Liverpool",
  "Paris Saint-Germain",
  "Inter Milan",
  "Borussia Dortmund",
  "Atletico Madrid",
  "Chelsea",
  "Juventus",
  "Napoli",
  "Tottenham Hotspur",
  "Crystal Palace",
  "West Ham United",
  "Elche",
  "Ajax"
];

// Suggested players per team for the player-events feature. These populate the
// player dropdown once a team is picked; the dropdown also accepts free text,
// so a player who isn't listed here can still be searched by typing their name.
// Names are matched against ESPN commentary as-is, so keep them in the form
// ESPN uses (e.g. "Bukayo Saka", "Vinicius Junior").
export const PLAYERS_BY_TEAM = {
  "Crystal Palace": [
    "Anan Khalaili",
  ],
  "West Ham United": [
    "Manor Solomon",
  ],
  "Elche": [
    "Roy Revivo",
  ],
  "Ajax": [
    "Oscar Gloukh",
  ],
};

/**
 * Suggested player names for a given team, or an empty array when the team has
 * no preset list (e.g. a free-text team). The dropdown still allows typing any
 * name regardless of what this returns.
 */
export function playersForTeam(team) {
  return PLAYERS_BY_TEAM[team] || [];
}
