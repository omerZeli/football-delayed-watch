import { Box, Paper, Typography } from "@mui/material";
import { colors } from "../theme.js";

export default function Scoreboard({ match }) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
        mt: 3,
        px: 2.5,
        py: 2,
        bgcolor: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: 4,
      }}
    >
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
          {match.home?.team || "Home"}
        </Typography>
      </Box>
      <Typography
        component="span"
        color="text.secondary"
        sx={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}
      >
        vs
      </Typography>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1.15rem" }}>
          {match.away?.team || "Away"}
        </Typography>
      </Box>
    </Paper>
  );
}
