import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

// Load .env.* into **process.env** (node-side only; NOT exposed to browser)
dotenv.config();

const target = process.env.PROXY_TARGET || "http://django-api:7004"; // fallback for Docker

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { usePolling: true },
    host: "0.0.0.0",
    hmr: { host: "localhost", port: 7001 }, // if running Vite in Docker
    proxy: {
      "/api": {
        target,                // 👈 use PROXY_TARGET, not VITE_BACKEND_URL
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
        configure: (proxy, _options) => {
          proxy.on("error", (err) => console.log("proxy error", err));
          proxy.on("proxyReq", (_proxyReq, req) =>
            console.log("Sending Request to Target:", req.method, req.url)
          );
          proxy.on("proxyRes", (proxyRes, req) =>
            console.log("Received Response:", proxyRes.statusCode, req.url)
          );
        },
      },
    },
  },
});
