import { Alert, Box } from "@mui/material";
import PitchBackground from "./components/PitchBackground.jsx";
import Header from "./components/Header.jsx";
import Controls from "./components/Controls.jsx";
import Scoreboard from "./components/Scoreboard.jsx";
import KeyMoments from "./components/KeyMoments.jsx";
import TvSync from "./components/TvSync.jsx";
import EmptyHint from "./components/EmptyHint.jsx";
import ServerWakingLoader from "./components/ServerWakingLoader.jsx";
import { useMatchSearch } from "./hooks/useMatchSearch.js";
import { useServerStatus } from "./hooks/useServerStatus.js";
import { TEAMS, playersForTeam } from "./constants.js";

export default function App() {
  const {
    selectedTeam,
    result,
    loading,
    error,
    essentialOnly,
    watchedSet,
    showExtraTime,
    nextUnwatchedMinute,
    syncResetKey,
    searchMode,
    toggleExtraTime,
    markWatchedUpTo,
    send,
    selectTeam,
    toggleEssential,
    selectedPlayer,
    selectPlayer,
    playerMode,
    togglePlayerMode,
  } = useMatchSearch();

  const { status: serverStatus } = useServerStatus();

  const minutes = result?.minutes || [];
  const match = result?.match;

  // When the current result came from a player search, label the moments list
  // for that player and adjust the empty-state copy accordingly.
  const isPlayerResult = searchMode === "player";
  const momentsTitle = isPlayerResult
    ? `${result?.player || "Player"} moments`
    : "Key moments";
  const momentsEmptyText = isPlayerResult
    ? `No moments found for ${result?.player || "this player"} in this match.`
    : "No highlight minutes found for this match.";

  return (
    <Box sx={{ position: "relative", maxWidth: 720, mx: "auto", px: 2.5, pt: 5, pb: 8 }}>
      <PitchBackground />

      <ServerWakingLoader status={serverStatus} />

      <Header />

      <Controls
        selectedTeam={selectedTeam}
        teams={TEAMS}
        loading={loading}
        essentialOnly={essentialOnly}
        onSelectTeam={selectTeam}
        onSend={send}
        onToggleEssential={toggleEssential}
        selectedPlayer={selectedPlayer}
        players={playersForTeam(selectedTeam)}
        onSelectPlayer={selectPlayer}
        playerMode={playerMode}
        onTogglePlayerMode={togglePlayerMode}
      />

      {error && (
        <Alert severity="error" variant="outlined" sx={{ mt: 2.5 }}>
          {error}
        </Alert>
      )}

      {match && !error && <Scoreboard match={match} />}

      {result && !error && (
        <>
          <KeyMoments
            title={momentsTitle}
            emptyText={momentsEmptyText}
            minutes={minutes}
            watched={watchedSet}
            onMarkWatched={markWatchedUpTo}
            showExtraTime={showExtraTime}
            onToggleExtraTime={toggleExtraTime}
          />
          <TvSync key={syncResetKey} nextMinute={nextUnwatchedMinute} />
        </>
      )}

      {!result && !error && !loading && <EmptyHint />}
    </Box>
  );
}
