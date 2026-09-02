import { CircularProgress, Paper, Typography } from "@mui/material";

/**
 * Small loader fixed to the top-right corner, shown only while the Render
 * server is cold-starting (free-plan wake-up). Renders nothing once the server
 * is awake, so it disappears the moment the server is confirmed up.
 *
 * @param {object} props
 * @param {"awake"|"waking"} props.status
 */
export default function ServerWakingLoader({ status }) {
  // Visible by default while waking; hidden once the server is confirmed awake.
  if (status !== "waking") return null;

  return (
    <Paper
      elevation={0}
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      }}
    >
      <CircularProgress size={16} thickness={5} color="primary" />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Waking server…
      </Typography>
    </Paper>
  );
}
