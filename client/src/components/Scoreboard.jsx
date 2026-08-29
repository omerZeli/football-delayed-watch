import { Box, Paper, Typography } from "@mui/material";
import { colors } from "../theme.js";

/**
 * Format an ISO kickoff timestamp as a readable date + time in the user's
 * local (browser) timezone. `toLocaleString` uses the runtime's timezone by
 * default, so no explicit timeZone option is needed. Returns null on a
 * missing or unparseable date so the caller can skip rendering it.
 */
function formatKickoff(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Scoreboard({ match }) {
  const kickoff = formatKickoff(match.date);

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        mt: 3,
        px: 2.5,
        py: 2,
        bgcolor: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, sm: 2.5 },
          width: "100%",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1rem", sm: "1.15rem" },
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {match.home?.team || "Home"}
        </Typography>
        <Typography
          component="span"
          color="text.secondary"
          sx={{
            flexShrink: 0,
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          vs
        </Typography>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1rem", sm: "1.15rem" },
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {match.away?.team || "Away"}
        </Typography>
      </Box>

      {kickoff && (
        <Typography
          color="text.secondary"
          sx={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}
        >
          {kickoff}
        </Typography>
      )}
    </Paper>
  );
}
