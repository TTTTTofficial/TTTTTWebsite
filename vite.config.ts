import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the root of the custom domain https://ttttt.win/.
export default defineConfig({
  plugins: [react()],
  base: "/",
  // three.js (~550 kB) is in its own chunk that only loads when the Life Simulator starts.
  build: { chunkSizeWarningLimit: 600 },
});
