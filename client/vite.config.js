import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Proxy /api requests to the backend so the client can call the server
// without CORS configuration and without hardcoding the host in code.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["football.jpg", "favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Delayed Watch ⚽",
        short_name: "Delayed Watch",
        description:
          "Follow football matches on a delay without spoilers — scores, key moments and highlights.",
        theme_color: "#0a4d2c",
        background_color: "#052b18",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,ico,woff,woff2}"],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
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
