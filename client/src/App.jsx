import { useState, useEffect, useCallback } from "react";

// Ordered list of selectable teams. Add more names here; the dropdown
// renders them in array order.
const TEAMS = ["Real Madrid"];

const STORAGE_KEY = "fdw:lastResult";
const TEAM_KEY = "fdw:lastTeam";

function loadStored(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function fetchMinutes(team) {
  const res = await fetch(
    `/api/matches/last/minutes?team=${encodeURIComponent(team)}`
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export default function App() {
  const [selectedTeam, setSelectedTeam] = useState(
    () => loadStored(TEAM_KEY) || TEAMS[0]
  );
  const [result, setResult] = useState(() => loadStored(STORAGE_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Persist selection and last result.
  useEffect(() => {
    localStorage.setItem(TEAM_KEY, JSON.stringify(selectedTeam));
  }, [selectedTeam]);

  useEffect(() => {
    if (result) localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }, [result]);

  const load = useCallback(async (team) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMinutes(team);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSend = () => load(selectedTeam);

  // Refresh re-fetches using the team from the last successful result if
  // available, otherwise the current selection.
  const handleRefresh = () => load(result?.query || selectedTeam);

  const minutes = result?.minutes || [];
  const match = result?.match;

  return (
    <div className="page">
      <div className="pitch-lines" aria-hidden="true" />

      <header className="header">
        <span className="ball" aria-hidden="true">⚽</span>
        <div>
          <h1>Delayed Watch</h1>
          <p className="tagline">Know exactly when the action happened.</p>
        </div>
      </header>

      <section className="controls">
        <div className="field">
          <label htmlFor="team">Team</label>
          <select
            id="team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="buttons">
          <button className="btn primary" onClick={handleSend} disabled={loading}>
            {loading ? "Loading…" : "Send"}
          </button>
          <button
            className="btn ghost"
            onClick={handleRefresh}
            disabled={loading || !result}
            title="Re-fetch the latest data for the last team"
          >
            ↻ Refresh
          </button>
        </div>
      </section>

      {error && <div className="alert error">⚠ {error}</div>}

      {match && !error && (
        <section className="scoreboard">
          <div className="team home">
            <span className="team-name">{match.home?.team || "Home"}</span>
            <span className="score">{match.home?.score ?? "–"}</span>
          </div>
          <span className="vs">vs</span>
          <div className="team away">
            <span className="score">{match.away?.score ?? "–"}</span>
            <span className="team-name">{match.away?.team || "Away"}</span>
          </div>
        </section>
      )}

      {result && !error && (
        <section className="results">
          <h2>
            Key moments
            <span className="count">{minutes.length}</span>
          </h2>
          {minutes.length > 0 ? (
            <ul className="minutes">
              {minutes.map((m, i) => (
                <li key={`${m}-${i}`} className="minute-chip">
                  {m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No highlight minutes found for this match.</p>
          )}
        </section>
      )}

      {!result && !error && !loading && (
        <p className="empty hint">
          Pick a team and press <strong>Send</strong> to see when the highlights
          happened.
        </p>
      )}
    </div>
  );
}
