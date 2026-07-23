import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: "mobile",
  envDir: "..",
  plugins: [react(), tailwindcss(), tsConfigPaths()],
  build: {
    rollupOptions: {
      input: "index.html",
    },
    outDir: "../dist",
    emptyOutDir: true,
  },
});