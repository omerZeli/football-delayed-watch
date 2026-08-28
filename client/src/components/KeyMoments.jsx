import { Box, Chip, Stack, Typography } from "@mui/material";
import { colors } from "../theme.js";

/**
 * Renders the highlight minutes as clickable chips. Clicking a chip marks it
 * and every earlier minute (by position) as watched via `onMarkWatched(index)`.
 * Watched minutes are shown dimmed/checked; `watched` is a Set of minute
 * strings for the current match.
 */
export default function KeyMoments({ minutes, watched, onMarkWatched }) {
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
        <>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: "0.85rem" }}>
            Tap a minute to mark it and everything before it as watched.
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
            }}
          >
            {minutes.map((m, i) => {
              const isWatched = watched?.has(m);
              return (
                <Chip
                  key={`${m}-${i}`}
                  label={m}
                  onClick={() => onMarkWatched?.(i)}
                  sx={{
                    px: 1,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    bgcolor: isWatched
                      ? "rgba(58,232,201,0.22)"
                      : "rgba(255,255,255,0.08)",
                    color: isWatched ? colors.accent : "inherit",
                    opacity: isWatched ? 0.85 : 1,
                    border: `1px solid ${isWatched ? colors.accent : colors.line}`,
                    borderRadius: 999,
                    transition: "transform .1s ease, background .2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      bgcolor: isWatched
                        ? "rgba(58,232,201,0.3)"
                        : "rgba(58,232,201,0.18)",
                      borderColor: colors.accent,
                    },
                  }}
                />
              );
            })}
          </Box>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No highlight minutes found for this match.
        </Typography>
      )}
    </Box>
  );
}
