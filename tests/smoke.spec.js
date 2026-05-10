import { expect, test } from "@playwright/test";

const ignoredConsolePatterns = [
  /Firebase/i,
  /service worker/i,
];

function collectUnexpectedConsoleErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (ignoredConsolePatterns.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

test("carga la pantalla inicial sin errores críticos", async ({ page }) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);

  await page.goto("/");

  await expect(page).toHaveTitle(/Jarramplas/i);
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#start")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#playButton")).toBeEnabled({ timeout: 20_000 });
  await expect(page.locator("#playButton")).toHaveText(/Jugar/i);

  expect(consoleErrors).toEqual([]);
});

test("permite navegar por el flujo básico de selección", async ({ page }) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);

  await page.goto("/");
  await expect(page.locator("#playButton")).toBeEnabled({ timeout: 20_000 });

  await page.locator("#playButton").click();
  await expect(page.locator("#type")).toBeVisible();

  await page.locator("[data-game-type='timed']").click();
  await expect(page.locator("#select")).toBeVisible();

  await page.locator("[data-level='day19Morning']").click();
  await expect(page.locator("#scenario")).toBeVisible();
  await expect(page.locator("#scenarioOptions button").first()).toBeVisible({ timeout: 10_000 });

  expect(consoleErrors).toEqual([]);
});

test("la pantalla de estadísticas funciona con localStorage vacío", async ({ page }) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator("#statsButton")).toBeVisible({ timeout: 20_000 });
  await page.locator("#statsButton").click();

  await expect(page.locator("#stats")).toBeVisible();
  await expect(page.locator("#statsGrid")).toContainText("Partidas jugadas");
  await expect(page.locator("#statsLeaderboardStatus")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("la pantalla de estadísticas tolera localStorage corrupto", async ({ page }) => {
  const consoleErrors = collectUnexpectedConsoleErrors(page);

  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("jarramplas.records.v1", "{mal json");
    localStorage.setItem("jarramplas.stats.v1", "{mal json");
    localStorage.setItem("jarramplas.leaderboard.v1", "{mal json");
  });
  await page.reload();

  await expect(page.locator("#statsButton")).toBeVisible({ timeout: 20_000 });
  await page.locator("#statsButton").click();

  await expect(page.locator("#stats")).toBeVisible();
  await expect(page.locator("#statsGrid")).toContainText("Partidas jugadas");

  expect(consoleErrors).toEqual([]);
});
