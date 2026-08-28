import { Box } from "@mui/material";

// Faint repeating pitch stripes behind the page content.
export default function PitchBackground() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 60px, transparent 60px 120px)",
      }}
    />
  );
}
