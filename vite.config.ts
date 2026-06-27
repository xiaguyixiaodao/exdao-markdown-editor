import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          codemirror: [
            "@codemirror/view",
            "@codemirror/state",
            "@codemirror/commands",
            "@codemirror/language",
            "@codemirror/lang-markdown",
            "@codemirror/search",
            "@codemirror/autocomplete",
          ],
          katex: ["katex"],
        },
      },
    },
  },
}));
