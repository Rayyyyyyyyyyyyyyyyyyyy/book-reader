import { defineConfig } from "@playwright/test";

// Browser checks for the bookshelf against the built site (`npm run test:e2e` builds first).
// Chromium only: Playwright's WebKit does not render CSS 3D, so Safari is checked by hand.
export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4399/book-reader/", browserName: "chromium" },
  webServer: { command: "npx astro preview --port 4399", url: "http://localhost:4399/book-reader/", reuseExistingServer: false },
});
