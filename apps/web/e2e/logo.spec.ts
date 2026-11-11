import { expect, test } from "@playwright/test";

const logoFiles = [
  "/logo/eventra-light-mode-bg-transparent.png",
  "/logo/eventra-dark-mode-bg-transparent.png",
  "/logo/eventra-logo-mark.png",
  "/brand/og.png",
  "/icon.png",
];

test("logo assets are served and render in light mode", async ({
  page,
  request,
}) => {
  for (const file of logoFiles) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()["content-type"], file).toContain("image");
  }

  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("theme", "light"));
  await page.reload();
  const visibleLogo = page.locator('header img[alt^="Eventra"]:visible');
  await expect(visibleLogo).toHaveCount(1);
  expect(
    await visibleLogo.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(page.locator('footer img[alt^="Eventra"]')).toBeVisible();
});

test("logo swaps in dark mode and does not overflow at 360", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("theme", "dark"));
  await page.reload();
  await expect(page.locator('header img[alt^="Eventra"]:visible')).toHaveCount(
    1,
  );
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport);
});

test("organizer profile uses a monogram, not the Eventra wordmark", async ({
  page,
}) => {
  await page.goto("/events/senja-sessions-aurora-live");
  await page.waitForTimeout(500);
  await expect(page.getByText("Rumah Kodingku Live")).toBeVisible();
  await expect(page.getByText("RK", { exact: true })).toBeVisible();
});
