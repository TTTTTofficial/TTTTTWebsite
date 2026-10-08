import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` must match the repo name for GitHub Pages project sites.
// Change to "/" if you use a custom domain.
export default defineConfig({
  plugins: [react()],
  base: "/TTTTTWebsite/",
});
