import { defineConfig, devices } from "@playwright/test";

const appUrl = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: appUrl,
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    env: {
      VITE_API_BASE_URL: "http://127.0.0.1:4006",
      VITE_DEFAULT_TENANT_SLUG: "sizzler-steak-house-and-co",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: appUrl,
  },
});
