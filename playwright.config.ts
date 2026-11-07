import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3105",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm start -- --port 3105",
        url: "http://localhost:3105/api/health",
        reuseExistingServer: false,
        timeout: 180000,
        env: {
          NEXT_PUBLIC_FIREBASE_API_KEY: "",
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "",
          NEXT_PUBLIC_FIREBASE_APP_ID: "",
        },
      },
});
