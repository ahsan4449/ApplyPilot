import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5173", headless: true },
  webServer: [
    {
      command: "npm run demo:server",
      url: "http://127.0.0.1:3001/api/health",
      timeout: 120000,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev:client",
      url: "http://127.0.0.1:5173",
      timeout: 30000,
      reuseExistingServer: false,
    },
  ],
});
