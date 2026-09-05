import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { colors } from "../theme.js";

/**
 * Returns true when a minute string represents extra time, i.e. the base
 * minute (the number before any "+") is greater than 90. So "92" and "105+2"
 * are extra time, but "90+5" is not.
 */
function isExtraTime(minute) {
  const base = parseInt(String(minute).split("+")[0], 10);
  return Number.isFinite(base) && base > 90;
}

/**
 * Renders the highlight minutes as clickable chips. Clicking an unwatched chip
 * marks it and every earlier minute (by position) as watched; clicking an
 * already-watched chip unmarks only that single minute, via
 * `onMarkWatched(index)`. Watched minutes are shown dimmed/checked; `watched`
 * is a Set of minute strings for the current match.
 *
 * Extra-time minutes (base minute > 90) are hidden by default and revealed via
 * the toggle in the title row, controlled by `showExtraTime` /
 * `onToggleExtraTime`.
 */
export default function KeyMoments({
  minutes,
  watched,
  onMarkWatched,
  showExtraTime = false,
  onToggleExtraTime,
  title = "Key moments",
  emptyText = "No highlight minutes found for this match.",
}) {
  const watchedCount = minutes.filter((m) => watched?.has(m)).length;
  const extraTimeCount = minutes.filter(isExtraTime).length;
  // Keep original indices so click handling still maps to the full list.
  const visibleMinutes = minutes
    .map((m, i) => ({ minute: m, index: i }))
    .filter(({ minute }) => showExtraTime || !isExtraTime(minute));
  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Typography variant="h2">{title}</Typography>
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
            {watchedCount}/{minutes.length}
          </Box>
        </Stack>
        <Button
          onClick={() => onToggleExtraTime?.()}
          size="small"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.8rem",
            color: showExtraTime ? "#10331f" : colors.accent,
            bgcolor: showExtraTime ? colors.accent : "transparent",
            border: `1px solid ${colors.accent}`,
            borderRadius: 999,
            px: 1.5,
            py: 0.3,
            "&:hover": {
              bgcolor: showExtraTime
                ? colors.accent
                : "rgba(58,232,201,0.15)",
            },
          }}
        >
          {showExtraTime ? "Hide extra time" : "Show extra time"}
        </Button>
      </Box>

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
            {visibleMinutes.map(({ minute: m, index: i }) => {
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
          {emptyText}
        </Typography>
      )}
    </Box>
  );
}
