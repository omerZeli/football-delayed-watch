import { createTheme } from "@mui/material/styles";

// Pitch/football palette, carried over from the original design tokens.
export const colors = {
  grassDeep: "#0a4d2c",
  grass: "#0f6b3d",
  grassLight: "#158a4e",
  grassDeepest: "#052b18",
  line: "rgba(255, 255, 255, 0.18)",
  accent: "#3ae8c9",
  accentDark: "#1ac7a8",
  card: "rgba(6, 40, 24, 0.72)",
  menu: "rgba(6, 40, 24, 0.96)",
  text: "#f2fef6",
  muted: "#a7c9b4",
  danger: "#ff5c5c",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: colors.accent, dark: colors.accentDark, contrastText: "#10331f" },
    background: { default: colors.grassDeepest, paper: colors.card },
    text: { primary: colors.text, secondary: colors.muted },
    error: { main: colors.danger },
    divider: colors.line,
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.5px" },
    h2: { fontSize: "1.2rem", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: "100vh",
          color: colors.text,
          background: `radial-gradient(circle at 50% -10%, ${colors.grassLight}, transparent 55%), linear-gradient(160deg, ${colors.grassDeep}, ${colors.grassDeepest} 90%)`,
          backgroundAttachment: "fixed",
        },
      },
    },
  },
});

export default theme;
