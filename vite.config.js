import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base совпадает с путём на GitHub Pages: https://shedshyi.github.io/cyberaware/
export default defineConfig({
  base: "/cyberaware/",
  plugins: [react()],
  build: { outDir: "build" },
  server: { port: 3000 },
});
