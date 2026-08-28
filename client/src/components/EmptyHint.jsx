import { Typography } from "@mui/material";

export default function EmptyHint() {
  return (
    <Typography
      color="text.secondary"
      sx={{ mt: 4, textAlign: "center", fontSize: "1.05rem" }}
    >
      Pick a team and press <strong>Send</strong> to see when the highlights
      happened.
    </Typography>
  );
}
