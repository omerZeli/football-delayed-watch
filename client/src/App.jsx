import { useState, useEffect, useCallback, useRef } from "react";

// Ordered list of selectable teams. Add more names here; the dropdown
// renders them in array order.
const TEAMS = ["Real Madrid", "Arsenal"];

const STORAGE_KEY = "fdw:lastResult";
const TEAM_KEY = "fdw:lastTeam";

// Custom dropdown so the open menu is fully themed (native <select> menus
// can't be styled and show the OS blue highlight).
function TeamDropdown({ id, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`dropdown${open ? " open" : ""}`} ref={ref}>
      <button
        type="button"
        id={id}
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{value}</span>
        <svg
          className="chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="dropdown-menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`dropdown-option${opt === value ? " selected" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
          <TeamDropdown
            id="team"
            value={selectedTeam}
            options={TEAMS}
            onChange={setSelectedTeam}
          />
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
          </div>
          <span className="vs">vs</span>
          <div className="team away">
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
