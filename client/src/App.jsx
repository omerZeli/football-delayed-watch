import { Alert, Box } from "@mui/material";
import PitchBackground from "./components/PitchBackground.jsx";
import Header from "./components/Header.jsx";
import Controls from "./components/Controls.jsx";
import Scoreboard from "./components/Scoreboard.jsx";
import KeyMoments from "./components/KeyMoments.jsx";
import EmptyHint from "./components/EmptyHint.jsx";
import { useMatchSearch } from "./hooks/useMatchSearch.js";
import { TEAMS } from "./constants.js";

export default function App() {
  const {
    selectedTeam,
    result,
    loading,
    error,
    searched,
    essentialOnly,
    watchedSet,
    markWatchedUpTo,
    send,
    refresh,
    selectTeam,
    toggleEssential,
  } = useMatchSearch();

  const minutes = result?.minutes || [];
  const match = result?.match;

  return (
    <Box sx={{ position: "relative", maxWidth: 720, mx: "auto", px: 2.5, pt: 5, pb: 8 }}>
      <PitchBackground />

      <Header />

      <Controls
        selectedTeam={selectedTeam}
        teams={TEAMS}
        loading={loading}
        searched={searched}
        essentialOnly={essentialOnly}
        onSelectTeam={selectTeam}
        onSend={send}
        onRefresh={refresh}
        onToggleEssential={toggleEssential}
      />

      {error && (
        <Alert severity="error" variant="outlined" sx={{ mt: 2.5 }}>
          {error}
        </Alert>
      )}

      {match && !error && <Scoreboard match={match} />}

      {result && !error && (
        <KeyMoments
          minutes={minutes}
          watched={watchedSet}
          onMarkWatched={markWatchedUpTo}
        />
      )}

      {!result && !error && !loading && <EmptyHint />}
    </Box>
  );
}
