import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api requests to the backend so the client can call the server
// without CORS configuration and without hardcoding the host in code.
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to localhost only. Using host:true (0.0.0.0) previously made the
    // browser try to open the HMR websocket against a non-loopback address
    // that this machine couldn't reach, so the socket failed. With the React
    // plugin, a failing HMR socket also means its Fast Refresh preamble never
    // arrives, producing "@vitejs/plugin-react can't detect preamble".
    host: "localhost",
    port: 5173,
    strictPort: true,
    // Keep HMR ON but pin it explicitly to loopback so the websocket URL the
    // client uses always matches the server it can actually reach.
    hmr: {
      host: "localhost",
      protocol: "ws",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
