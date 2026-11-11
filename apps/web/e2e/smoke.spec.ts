import { expect, test } from "@playwright/test";

test("guest can discover events and open a detail page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your Gateway",
  );
  await page.getByRole("link", { name: "Event", exact: true }).first().click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(
    page.getByRole("heading", { name: "Semua event" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Senja Sessions: Aurora Live/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/events\/senja-sessions-aurora-live$/);
  await expect(
    page.getByRole("heading", { name: "Senja Sessions: Aurora Live" }),
  ).toBeVisible();
});

test("guest can add a ticket and see the cart total", async ({ page }) => {
  await page.goto("/events/senja-sessions-aurora-live/tickets");
  await page
    .getByRole("button", { name: /Tambah ke keranjang/i })
    .first()
    .click();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Keranjang" })).toBeVisible();
  await expect(page.getByText("Senja Sessions: Aurora Live")).toBeVisible();
  await expect(page.getByText("Rp 360.000").first()).toBeVisible();
});

test("organizer demo opens the dashboard", async ({ page }) => {
  await page.goto("/organizer/dashboard");
  await page.getByRole("button", { name: /Masuk sebagai organizer/i }).click();
  await expect(page).toHaveURL(/\/organizer\/dashboard$/);
  await expect(page.getByText("Penjualan simulasi")).toBeVisible();
  await expect(page.getByText("Tren penjualan")).toBeVisible();
});
