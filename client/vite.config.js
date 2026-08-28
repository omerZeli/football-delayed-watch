import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api requests to the backend so the client can call the server
// without CORS configuration and without hardcoding the host in code.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // HMR is disabled on purpose. The dev server itself accepts the HMR
    // websocket fine, but this browser/profile can't reach it (a stale cached
    // page / service worker keeps pointing at a dead socket token), which made
    // React Fast Refresh throw "RefreshRuntime.getRefreshReg is not a
    // function" and blocked the whole app from rendering. With HMR off there
    // is no websocket to fail, so the page always renders. Edits require a
    // manual browser refresh instead of live reload.
    hmr: false,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
