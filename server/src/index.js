import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
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

// In production, serve the built client (Vite output) from this same server so
// the SPA and the API share one origin. The client fetches "/api/..." with
// relative URLs, so no CORS config or hardcoded host is needed.
//
// The build lives at <repo>/client/dist. From this file (server/src/index.js)
// that is ../../client/dist.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA fallback: any non-API GET that isn't a real file returns index.html so
  // client-side routing / direct loads work. Express 4 accepts the "*" pattern.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;
