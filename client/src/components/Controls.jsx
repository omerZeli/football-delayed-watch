import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import TeamDropdown from "./TeamDropdown.jsx";
import PlayerDropdown from "./PlayerDropdown.jsx";
import { colors } from "../theme.js";

export default function Controls({
  selectedTeam,
  teams,
  loading,
  essentialOnly,
  onSelectTeam,
  onSend,
  onToggleEssential,
  // Player-events feature.
  selectedPlayer,
  players = [],
  onSelectPlayer,
  playerMode,
  onTogglePlayerMode,
}) {
  // In player mode, Send needs a player; otherwise just a team.
  const sendDisabled =
    loading || !selectedTeam || (playerMode && !selectedPlayer);
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 2,
        p: 2.5,
        bgcolor: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: 4,
        backdropFilter: "blur(8px)",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: "1 1 140px" }}>
        <InputLabel
          htmlFor="team"
          sx={{
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "text.secondary",
          }}
        >
          Team
        </InputLabel>
        <TeamDropdown
          id="team"
          value={selectedTeam}
          options={teams}
          onChange={onSelectTeam}
        />
      </Box>

      {/* Match the field's column layout (an empty label-height row above the
          controls) so the buttons align to the dropdown pill, not the whole
          column. Then center the button row against the pill. */}
      <Box sx={{ alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
        <Box
          aria-hidden="true"
          sx={{
            fontSize: "0.8rem",
            lineHeight: 1.4375,
            mb: 0.5,
            visibility: "hidden",
          }}
        >
          &nbsp;
        </Box>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "center", flex: 1 }}
        >
        <Button
          variant="contained"
          color="primary"
          onClick={onSend}
          disabled={sendDisabled}
          sx={{ borderRadius: 2.5, fontWeight: 600, px: 2.6, py: 1.2 }}
        >
          {loading ? "Loading…" : "Send"}
        </Button>
        </Stack>
      </Box>

      {/* "Search by player" checkbox. When on, the player field below replaces
          the highlight-depth toggle and Send performs a player search. */}
      <Box sx={{ flex: "1 1 100%" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={playerMode}
              onChange={(e) => onTogglePlayerMode?.(e.target.checked)}
              sx={{
                color: colors.line,
                "&.Mui-checked": { color: colors.accent },
              }}
            />
          }
          label="Search by player"
          sx={{
            m: 0,
            "& .MuiFormControlLabel-label": {
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "text.secondary",
            },
          }}
        />
      </Box>

      {/* Player mode: the player picker takes over this row. Otherwise: the
          highlight-depth toggle (full timeline vs. decisive moments only). */}
      {playerMode ? (
        <Box
          sx={{
            flex: "1 1 100%",
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <InputLabel
            htmlFor="player"
            sx={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "text.secondary",
            }}
          >
            Player
          </InputLabel>
          <PlayerDropdown
            id="player"
            value={selectedPlayer}
            options={players}
            onChange={onSelectPlayer}
            disabled={!selectedTeam}
            placeholder={
              selectedTeam ? "Select a player" : "Pick a team first"
            }
          />
        </Box>
      ) : (
        <Box
          sx={{
            flex: "1 1 100%",
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          <InputLabel
            sx={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "text.secondary",
            }}
          >
            Highlights
          </InputLabel>
          <ToggleButtonGroup
            exclusive
            value={essentialOnly ? "essential" : "all"}
            onChange={(_e, val) => {
              // Ignore clicks on the already-selected button (val === null).
              if (val === null) return;
              onToggleEssential?.(val === "essential");
            }}
            disabled={loading}
            aria-label="Highlight depth"
            sx={{
              "& .MuiToggleButton-root": {
                flex: 1,
                gap: 0.75,
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
                borderColor: colors.line,
                py: 1,
                "&.Mui-selected": {
                  color: "#10331f",
                  bgcolor: colors.accent,
                  "&:hover": { bgcolor: colors.accentDark },
                },
              },
            }}
          >
            <ToggleButton value="all" aria-label="All highlights">
              <FormatListBulletedRoundedIcon fontSize="small" />
              All highlights
            </ToggleButton>
            <ToggleButton value="essential" aria-label="Essential highlights only">
              <StarRoundedIcon fontSize="small" />
              Essential only
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </Paper>
  );
}
