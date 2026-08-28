import { Box, Button, InputLabel, Paper, Stack } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TeamDropdown from "./TeamDropdown.jsx";
import { colors } from "../theme.js";

export default function Controls({
  selectedTeam,
  teams,
  loading,
  searched,
  onSelectTeam,
  onSend,
  onRefresh,
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
        {searched && (
          <Button
            variant="outlined"
            onClick={onRefresh}
            disabled={loading}
            startIcon={<RefreshRoundedIcon />}
            title="Re-fetch the latest data for the last team"
            sx={{
              borderRadius: 2.5,
              fontWeight: 600,
              px: 2.6,
              py: 1.2,
              color: "text.primary",
              borderColor: colors.line,
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.16)",
                borderColor: colors.line,
              },
            }}
          >
            Refresh
          </Button>
        )}
        </Stack>
      </Box>
    </Paper>
  );
}
