import { expect, test } from "@playwright/test";

test("guest discovers the API-backed catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your Gateway",
  );
  await page.getByRole("link", { name: "Event", exact: true }).first().click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(
    page.getByRole("heading", { name: "Semua event" }),
  ).toBeVisible();

  const card = page
    .getByRole("link", { name: /Senja Sessions: Aurora Live/i })
    .first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(/\/events\/senja-sessions-aurora-live$/);
  await expect(
    page.getByRole("heading", { name: "Senja Sessions: Aurora Live" }),
  ).toBeVisible();
});

test("organizer creates and updates an event through the API", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Masuk sebagai organizer/i }).click();
  await expect(page).toHaveURL(/\/organizer\/dashboard$/);

  await page.goto("/organizer/events");
  await expect(page.getByRole("heading", { name: "Event" })).toBeVisible();
  await expect(page.getByText(/24 event/)).toBeVisible();

  await page.goto("/organizer/events/new");
  await page.getByLabel("Judul event").fill("API E2E Event");
  await page.getByLabel("Deskripsi").fill("Event dibuat lewat API adapter.");
  await page.getByLabel("Harga").fill("150000");
  await page.getByRole("button", { name: /Simpan draft/i }).click();

  await expect(page).toHaveURL(/\/organizer\/events\/[0-9A-Z]{26}$/);
  await expect(
    page.getByRole("heading", { name: "API E2E Event" }),
  ).toBeVisible();
  const eventId = new URL(page.url()).pathname.split("/").at(-1);

  await page.goto(`/organizer/events/${eventId}/edit`);
  await page.getByLabel("Judul event").fill("API E2E Event Updated");
  await page.getByRole("button", { name: /Simpan draft/i }).click();

  await expect(page).toHaveURL(new RegExp(`/organizer/events/${eventId}$`));
  await expect(
    page.getByRole("heading", { name: "API E2E Event Updated" }),
  ).toBeVisible();

  await page.goto(`/organizer/events/${eventId}/tickets`);
  await page.getByRole("button", { name: /Tambah tipe tiket/i }).click();
  await page
    .getByRole("button", { name: /^Simpan$/ })
    .first()
    .click();
  await expect(page.getByText("Konfigurasi tiket disimpan.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("New ticket")).toBeVisible();
});
