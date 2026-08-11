import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const vitePort = Number(process.env.VITE_PORT || 5847);
const viteClientPort = Number(process.env.VITE_CLIENT_PORT || vitePort);
const viteHmrHost = process.env.VITE_HMR_HOST || "localhost";
const viteDevUrl = process.env.VITE_DEV_URL || `http://${viteHmrHost}:${viteClientPort}`;

export default defineConfig({
  plugins: [tailwindcss()],
  root: resolve(__dirname, "frontend"),
  base: "/static/",
  build: {
    manifest: "manifest.json",
    outDir: resolve(__dirname, "static/dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "frontend/js/main.js"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: vitePort,
    strictPort: true,
    origin: viteDevUrl,
    cors: true,
    hmr: {
      host: viteHmrHost,
      clientPort: viteClientPort,
    },
  },
});
