import { useMemo, useState } from "react";
import { Box, Button, InputLabel, Paper, TextField, Typography } from "@mui/material";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { colors } from "../theme.js";

/**
 * Parse an "hh:mm:ss" string into { minutes, seconds } where `minutes` is the
 * total hh:mm expressed in whole minutes and `seconds` is the untouched tail.
 * Returns null when the value doesn't match the expected format. Fields may be
 * one or two digits; minutes and seconds must be 0-59.
 *
 * The seconds are kept separate on purpose: game minutes are whole minutes, so
 * the sync math only ever adds/subtracts minutes and the seconds ride along
 * unchanged (e.g. 01:30:35 + 10 min -> 01:40:35).
 */
function parseTvTime(value) {
  const m = String(value).trim().match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  if (min > 59 || sec > 59) return null;
  return { minutes: h * 60 + min, seconds: sec };
}

/**
 * Format raw keyboard input into an "hh:mm:ss" mask as the user types.
 * Non-digits are dropped and the value is capped at 6 digits (hhmmss). Colons
 * are inserted once the 3rd and 5th digits are present, and they naturally
 * disappear when the user deletes back. So "0120" -> "01:20", "012030" ->
 * "01:20:30", "01" -> "01".
 */
function maskTvTime(value) {
  const digits = String(value).replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
}

/**
 * Format a total number of minutes plus a fixed seconds tail back into
 * "hh:mm:ss" (zero-padded). The seconds pass through as-is.
 */
function formatTvTime(totalMinutes, seconds) {
  const clampedMin = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(clampedMin / 60);
  const m = clampedMin % 60;
  const s = Math.max(0, Math.min(59, seconds));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Lets the user map a game minute to a TV playback time (hh:mm:ss), then
 * computes the TV time for the next minute they haven't watched yet.
 *
 * The math: (nextMinute - referenceMinute) minutes are added to the reference
 * TV time. Everything runs locally on Enter, with no server call. The parent
 * remounts this component (via a key) after a Send so the fields reset.
 *
 * @param {{label: string, value: number}|null} nextMinute the smallest
 *   unwatched minute — `label` is what to display (e.g. "90+3") and `value` is
 *   its total minute count (base + stoppage). Null when there's nothing left to
 *   watch.
 */
export default function TvSync({ nextMinute }) {
  const [refMinute, setRefMinute] = useState("");
  const [tvTime, setTvTime] = useState("");
  // The reference committed on Enter: { ref, refMinutes, refSeconds }. The result
  // is derived from this + the live `nextMinute`, so marking/unmarking minutes
  // updates "Next up" without pressing Enter again.
  const [committed, setCommitted] = useState(null);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setCommitted(null);
    setError("");

    const ref = parseInt(String(refMinute).trim(), 10);
    if (!Number.isFinite(ref) || ref < 0 || String(refMinute).trim() === "") {
      setError("Enter a valid game minute (a positive number).");
      return;
    }

    // TV time is optional: with a game minute but no TV time we just show the
    // signed minute difference to the next unwatched minute.
    if (String(tvTime).trim() === "") {
      setCommitted({ ref, refMinutes: null });
      return;
    }

    const parsed = parseTvTime(tvTime);
    if (parsed == null) {
      setError("Enter a TV time as hh:mm:ss (e.g. 01:20:35).");
      return;
    }

    setCommitted({ ref, refMinutes: parsed.minutes, refSeconds: parsed.seconds });
  };

  // Recomputes whenever the committed reference or the next unwatched minute
  // changes (the latter happens when the user marks/unmarks minutes).
  const result = useMemo(() => {
    if (!committed) return null;
    if (nextMinute == null) {
      return { done: true };
    }
    // Stoppage time counts toward the total: "90+3" is 93 minutes, so it sits
    // 3 minutes past plain "90". The diff/target math uses that total value,
    // while the label ("90+3") is what we show the user.
    const diff = nextMinute.value - committed.ref;
    // No TV time: report the signed minute offset to the next minute instead.
    if (committed.refMinutes == null) {
      const sign = diff >= 0 ? "+" : "−";
      return { minute: nextMinute.label, diff: `${sign}${Math.abs(diff)}` };
    }
    const targetMinutes = committed.refMinutes + diff;
    if (targetMinutes < 0) return { invalid: true };
    return { minute: nextMinute.label, time: formatTvTime(targetMinutes, committed.refSeconds) };
  }, [committed, nextMinute]);

  return (
    <Paper
      component="form"
      onSubmit={onSubmit}
      elevation={0}
      sx={{
        mt: 3,
        p: 2.5,
        bgcolor: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: 4,
        backdropFilter: "blur(8px)",
      }}
    >
      <Typography variant="h2">TV time sync</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
        Map a game minute to its spot in your recording, and we'll tell you when
        the next unwatched minute shows up on the TV.
      </Typography>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: "1 1 120px" }}>
          <InputLabel
            htmlFor="tvsync-minute"
            sx={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "text.secondary",
            }}
          >
            Game minute
          </InputLabel>
          <TextField
            id="tvsync-minute"
            value={refMinute}
            onChange={(e) => setRefMinute(e.target.value.replace(/\D/g, ""))}
            placeholder="32"
            autoComplete="off"
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*", autoComplete: "off" } }}
            size="small"
          />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, flex: "1 1 140px" }}>
          <InputLabel
            htmlFor="tvsync-time"
            sx={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "text.secondary",
            }}
          >
            TV time (hh:mm:ss)
          </InputLabel>
          <TextField
            id="tvsync-time"
            value={tvTime}
            onChange={(e) => setTvTime(maskTvTime(e.target.value))}
            placeholder="01:20:35"
            size="small"
            autoComplete="off"
            slotProps={{ htmlInput: { inputMode: "numeric", autoComplete: "off" } }}
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2.5, fontWeight: 600, px: 2.6, py: 1.1 }}
        >
          Enter
        </Button>
      </Box>

      {(error || result?.invalid) && (
        <Typography sx={{ mt: 1.5, color: colors.danger, fontSize: "0.85rem" }}>
          {error || "That reference is later than the next minute — check your values."}
        </Typography>
      )}

      {result?.done && (
        <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: "0.85rem" }}>
          You've watched every minute — nothing left to sync.
        </Typography>
      )}

      {result?.minute != null && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            bgcolor: "rgba(58,232,201,0.12)",
            border: `1px solid ${colors.accent}`,
            borderRadius: 3,
          }}
        >
          <PlayCircleOutlineRoundedIcon sx={{ color: colors.accent }} />
          <Typography sx={{ fontSize: "0.95rem" }}>
            Next up: minute{" "}
            <Box component="span" sx={{ fontWeight: 800, color: colors.accent }}>
              {result.minute}
            </Box>{" "}
            {result.time != null ? (
              <>
                at TV time{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 800, color: colors.accent, fontVariantNumeric: "tabular-nums" }}
                >
                  {result.time}
                </Box>
              </>
            ) : (
              <>
                (
                <Box
                  component="span"
                  sx={{ fontWeight: 800, color: colors.accent, fontVariantNumeric: "tabular-nums" }}
                >
                  {result.diff}
                </Box>{" "}
                min from your reference)
              </>
            )}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
