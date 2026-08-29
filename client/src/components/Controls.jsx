import {
  Box,
  Button,
  InputLabel,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import TeamDropdown from "./TeamDropdown.jsx";
import { colors } from "../theme.js";

export default function Controls({
  selectedTeam,
  teams,
  loading,
  essentialOnly,
  onSelectTeam,
  onSend,
  onToggleEssential,
}) {
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: "1 1 220px" }}>
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
          alignItems="center"
          sx={{ flex: 1 }}
        >
        <Button
          variant="contained"
          color="primary"
          onClick={onSend}
          disabled={loading}
          sx={{ borderRadius: 2.5, fontWeight: 600, px: 2.6, py: 1.2 }}
        >
          {loading ? "Loading…" : "Send"}
        </Button>
        </Stack>
      </Box>

      {/* Highlight-depth toggle: full timeline vs. only the decisive moments
          (goals, shots on target/woodwork, red cards, VAR). Full-width so it
          sits on its own row beneath the team/buttons row. */}
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
    </Paper>
  );
}
