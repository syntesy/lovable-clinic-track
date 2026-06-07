import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("/src/pages/academy")) return "chunk-academy";
          if (id.includes("/src/pages/edu/"))    return "chunk-edu";
          if (id.includes("/src/pages/admin/"))  return "chunk-admin";
          if (id.includes("/src/pages/governance")) return "chunk-governance";
          if (
            id.includes("/src/pages/Insights/") ||
            id.includes("/src/pages/Career/") ||
            id.includes("/src/pages/Diligence/")
          ) return "chunk-insights";
          if (
            id.includes("/src/pages/Registry/") ||
            id.includes("/src/pages/Evidence/") ||
            id.includes("/src/pages/reghen/")
          ) return "chunk-registry";
          if (id.includes("/src/pages/landing/")) return "chunk-landing";
        },
      },
    },
  },
});
