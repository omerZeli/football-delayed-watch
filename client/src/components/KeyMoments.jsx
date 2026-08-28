import { Box, Chip, Stack, Typography } from "@mui/material";
import { colors } from "../theme.js";

export default function KeyMoments({ minutes }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Typography variant="h2">Key moments</Typography>
        <Box
          component="span"
          sx={{
            bgcolor: colors.accent,
            color: "#10331f",
            fontSize: "0.85rem",
            fontWeight: 700,
            px: 1.2,
            py: 0.2,
            borderRadius: 999,
          }}
        >
          {minutes.length}
        </Box>
      </Stack>

      {minutes.length > 0 ? (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          {minutes.map((m, i) => (
            <Chip
              key={`${m}-${i}`}
              label={m}
              sx={{
                px: 1,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                bgcolor: "rgba(255,255,255,0.08)",
                border: `1px solid ${colors.line}`,
                borderRadius: 999,
                transition: "transform .1s ease, background .2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  bgcolor: "rgba(232,255,58,0.18)",
                  borderColor: colors.accent,
                },
              }}
            />
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No highlight minutes found for this match.
        </Typography>
      )}
    </Box>
  );
}
