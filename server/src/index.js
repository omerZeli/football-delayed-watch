import express from "express";
import matchesRouter from "./routes/matches.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Match events API
app.use("/api/matches", matchesRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
