import { Box, Stack, Typography } from "@mui/material";

export default function Header() {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          fontSize: "2.6rem",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          animation: "spin 8s linear infinite",
          "@keyframes spin": { to: { transform: "rotate(360deg)" } },
        }}
      >
        ⚽
      </Box>
      <Box>
        <Typography variant="h1">Delayed Watch</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Know exactly when the action happened.
        </Typography>
      </Box>
    </Stack>
  );
}
