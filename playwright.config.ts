import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests: `yarn e2e`.
 *
 * They run against a production build of the app on a throwaway MongoDB with
 * seeded users (e2e/start-server.cjs), so they need no account, no .env.local
 * and no network, and they never touch a real database.
 */
export default defineConfig({
  testDir: "./e2e",
  // Not *.spec.ts / *.test.ts: jest would pick those up.
  testMatch: /.*\.e2e\.ts$/,
  // One server, one database, tests that change what the next one sees.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3998",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node e2e/start-server.cjs",
    url: "http://localhost:3998/robots.txt",
    timeout: 300_000,
    reuseExistingServer: false,
  },
  projects: [
    { name: "sign-in", testMatch: /auth\.setup\.ts$/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["sign-in"],
    },
  ],
});
