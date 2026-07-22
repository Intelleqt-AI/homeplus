import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    proxy: {
      // HomePlus and TradePilot share one backend, run locally on port 8030.
      // Override with VITE_API_PROXY_TARGET if your backend runs elsewhere.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8030',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    // mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
