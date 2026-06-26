// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// GitHub Pages project site. Repo is "book-reader" → served under /book-reader.
// Override SITE / BASE via env if the repo is renamed or a custom domain is used.
const SITE = process.env.SITE_URL ?? "https://rayyyyyyyyyyyyyyyyyyyy.github.io";
const BASE = process.env.BASE_PATH ?? "/book-reader";

export default defineConfig({
  site: SITE,
  base: BASE,
  output: "static",
  trailingSlash: "ignore",
  integrations: [react(), sitemap()],
});
