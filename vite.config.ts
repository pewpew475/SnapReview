import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Make the SnapReview-tagger import optional so `npm run dev` doesn't crash
// when dependencies haven't been installed. If the package is present, its
// `componentTagger` plugin will be used in development mode.
export default defineConfig(async ({ mode }) => {
  let componentTagger: any = undefined;

  if (mode === "development") {
    try {
      const mod = await import("SnapReview-tagger");
      componentTagger = mod?.componentTagger ?? mod?.default ?? undefined;
    } catch (err) {
      // If the package isn't installed, warn and continue without the plugin.
      // This prevents the dev server from failing with a module-not-found error.
      // Installer note: run `npm install` to add the package when needed.
      // eslint-disable-next-line no-console
      console.warn("SnapReview-tagger not found — skipping componentTagger plugin.");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), componentTagger ? componentTagger() : false].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
