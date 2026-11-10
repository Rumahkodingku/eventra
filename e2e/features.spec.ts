import { expect, type Page, test } from "@playwright/test";

async function loginOrganizer(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Masuk sebagai organizer/i }).click();
  await expect(page).toHaveURL(/\/organizer\/dashboard$/);
}

test("organizer event editor saves content fields and a valid sales window", async ({
  page,
}) => {
  await loginOrganizer(page);
  await page.goto("/organizer/events/new");
  await page.getByLabel("Judul event").fill("E2E Content Event");
  await page
    .getByLabel("Deskripsi")
    .fill("Event untuk menguji field konten lengkap.");
  await page.getByLabel("Subkategori").fill("Testing");

  const add = page.getByRole("button", { name: /^Tambah$/ });
  await add.nth(0).click();
  await add.nth(1).click();
  await add.nth(2).click();
  await page.getByPlaceholder("Highlight event").fill("Highlight E2E");
  await page.getByPlaceholder("19:30").fill("19:30");
  await page.getByPlaceholder("Judul sesi").fill("Opening E2E");
  await page.getByPlaceholder("Deskripsi singkat").fill("Sesi E2E");
  await page.getByPlaceholder("Syarat event").fill("Syarat E2E");
  await page.getByPlaceholder("18+").fill("18+");
  await page.getByRole("button", { name: /Simpan draft/i }).click();
  await expect(page).toHaveURL(/\/organizer\/events\/evt-/);

  const event = await page.evaluate(() => {
    const raw = localStorage.getItem("eventra-events");
    if (!raw) return null;
    const state = JSON.parse(raw).state;
    return state.events.find(
      (item: { title: string }) => item.title === "E2E Content Event",
    );
  });
  expect(event).toBeTruthy();
  expect(event.highlights).toContain("Highlight E2E");
  expect(event.schedule[0].time).toBe("19:30");
  expect(event.terms).toContain("Syarat E2E");
  expect(event.ageNote).toBe("18+");
  expect(
    new Date(event.ticketTypes[0].salesStartAt).getTime(),
  ).toBeLessThanOrEqual(Date.now() + 60_000);
  expect(new Date(event.ticketTypes[0].salesEndAt).getTime()).toBeLessThan(
    new Date(event.startAt).getTime(),
  );
});

test("organizer can preview and regenerate seat inventory", async ({
  page,
}) => {
  await loginOrganizer(page);
  await page.goto("/organizer/events/evt-03/tickets");
  await expect(page.getByText("Seat inventory")).toBeVisible();
  await expect(page.getByText("Front Stage").first()).toBeVisible();
  await page.getByLabel("Template venue").selectOption("theater");
  await page.getByRole("button", { name: /Regenerate inventory/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Regenerate inventory/i }).click();
  await expect(page.getByText("Orchestra").first()).toBeVisible();
  await page
    .getByRole("button", { name: /^Simpan$/ })
    .first()
    .click();
  const layout = await page.evaluate(() => {
    const raw = localStorage.getItem("eventra-events");
    if (!raw) return null;
    const state = JSON.parse(raw).state;
    return state.events.find((item: { id: string }) => item.id === "evt-03")
      ?.seatLayout?.id;
  });
  expect(layout).toBe("theater");
});

test("attendee detail and organizer event pagination work", async ({
  page,
}) => {
  await loginOrganizer(page);
  await page.goto("/organizer/attendees");
  await page
    .getByRole("button", { name: /Detail/i })
    .first()
    .click();
  const detail = page.getByRole("dialog");
  await expect(detail).toBeVisible();
  await expect(detail.getByText("Kode tiket")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/organizer/events");
  const rowsBefore = await page.locator("tbody tr").count();
  expect(rowsBefore).toBeLessThanOrEqual(10);
  await page.getByRole("button", { name: /Muat lebih banyak/i }).click();
  await expect(page.locator("tbody tr")).toHaveCount(20);
});

test("search supports keyboard navigation and seat map supports zoom", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(900);
  await page.keyboard.press("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("textbox", { name: /Cari event/i }).fill("senja");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/events\/senja-sessions-aurora-live$/);

  await page.goto("/events/liga-nusantara-final-derby/tickets");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByText("125%")).toBeVisible();
});
