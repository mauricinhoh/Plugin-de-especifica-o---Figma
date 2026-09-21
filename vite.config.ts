import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// A UI do plugin Figma precisa ser um único arquivo HTML autocontido
// (sem requests externos), pois roda dentro de um iframe sandboxed.
export default defineConfig({
  root: "src/ui",
  plugins: [react(), viteSingleFile()],
  build: {
    target: "es2017",
    outDir: "../../dist",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/ui/ui.html"
    }
  }
});
