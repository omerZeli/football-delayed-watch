import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /api requests to the backend so the client can call the server
// without CORS configuration and without hardcoding the host in code.
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to the IPv4 loopback explicitly. Using "localhost" let Node bind to
    // the IPv6 loopback (::1) while the browser sometimes resolved localhost to
    // 127.0.0.1 (IPv4) on a soft reload. The HMR websocket then hit an address
    // the server wasn't listening on, failed, and Fast Refresh never wired up
    // (RefreshRuntime.getRefreshReg is not a function). A hard reload happened
    // to re-resolve to the working address, which is why it "fixed" itself.
    // Pinning both the server and the HMR client to 127.0.0.1 keeps them in
    // agreement on every reload.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "127.0.0.1",
      protocol: "ws",
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
