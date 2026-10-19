import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-End-Tests: steuern die echte App in einem Browser, wie ein Mensch sie bedienen würde.
 * Starten mit `npm run e2e`; der Entwicklungsserver wird dafür automatisch hochgefahren.
 */
export default defineConfig({
  testDir: './e2e',
  // In der CI keine vergessenen test.only durchlassen und fehlgeschlagene Tests einmal wiederholen
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    // Fehlerbericht mit Schritt-für-Schritt-Aufzeichnung, falls ein Test scheitert
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // Das auf dem Rechner bzw. CI-Server installierte Chrome nutzen – spart den Browser-Download
      name: 'handy',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npx ng serve --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
