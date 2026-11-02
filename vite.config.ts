import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { contentEditor } from "./tools/vite-content-editor";

export default defineConfig({
  plugins: [react(), contentEditor()],
  base: "./",
  // The contour field is ~170 KB of path data; JSON.parse is faster than a JS object literal.
  json: { stringify: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("contours.json")) return "contours";
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/motion-")) return "motion";
          if (id.includes("node_modules/gsap") || id.includes("node_modules/@gsap") || id.includes("node_modules/lenis")) return "gsap";
          if (id.includes("node_modules/react")) return "react";
        },
      },
    },
  },
});
