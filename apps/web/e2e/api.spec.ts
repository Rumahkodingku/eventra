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

test("customer buys a ticket and organizer checks it in", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Masuk sebagai customer/i }).click();
  await expect(page).toHaveURL(/\/tickets$/);

  await page.goto("/events/senja-sessions-aurora-live/tickets");
  await page
    .getByRole("button", { name: /Tambah ke keranjang/i })
    .first()
    .click();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Keranjang" })).toBeVisible();
  await expect(page.getByText("Senja Sessions: Aurora Live")).toBeVisible();
  await expect(page.getByText(/Harga dan stok dikunci sampai/)).toBeVisible();

  await page.goto("/checkout");
  await page
    .getByRole("button", { name: /Gunakan data pembeli untuk semua tiket/i })
    .click();
  await page
    .getByRole("checkbox", { name: /Saya menyetujui syarat dan ketentuan/i })
    .check();
  await page
    .getByRole("checkbox", {
      name: /Saya memahami bahwa pembayaran ini adalah simulasi/i,
    })
    .check();
  await page.getByRole("button", { name: /Bayar sekarang/i }).click();

  await expect(page).toHaveURL(/\/checkout\/success\/[0-9A-Z]{26}$/);
  await expect(
    page.getByRole("heading", { name: "Tiketmu sudah siap" }),
  ).toBeVisible();

  await page.goto("/tickets");
  await expect(page.getByText("Senja Sessions: Aurora Live")).toBeVisible();
  const code = await page
    .getByText(/TKT-[0-9A-Z]+/)
    .first()
    .innerText();

  await page.goto("/notifications");
  await expect(page.getByText("Pembayaran berhasil")).toBeVisible();

  await page.goto("/events/senja-sessions-aurora-live");
  await page
    .getByRole("button", { name: "Simpan ke wishlist", exact: true })
    .first()
    .click();
  await page.goto("/wishlist");
  await expect(page.getByText("Senja Sessions: Aurora Live")).toBeVisible();

  await page.goto("/events/senja-sessions-aurora-live");
  await page
    .getByPlaceholder("Apa yang paling berkesan?")
    .fill("Pengalaman yang rapi dan menyenangkan.");
  await page.getByRole("button", { name: "Kirim ulasan" }).click();
  await expect(
    page.getByText("Pengalaman yang rapi dan menyenangkan."),
  ).toBeVisible();

  await page.goto("/organizer/check-in");
  await page.getByRole("button", { name: /Masuk sebagai organizer/i }).click();
  await page
    .locator("#checkin-event")
    .selectOption({ label: "Senja Sessions: Aurora Live" });
  await page.getByPlaceholder("Masukkan kode tiket").fill(code);
  await page.getByRole("button", { name: /Cari tiket/i }).click();
  await page.getByRole("button", { name: /^Check-in$/i }).click();
  await expect(page.getByText(/Check-in berhasil/i).first()).toBeVisible();
});

test("failed payment shows the server failure state", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Masuk sebagai customer/i }).click();
  await expect(page).toHaveURL(/\/tickets$/);

  await page.goto("/events/senja-sessions-aurora-live/tickets");
  await page
    .getByRole("button", { name: /Tambah ke keranjang/i })
    .first()
    .click();
  await page.goto("/checkout");
  await page
    .getByRole("button", { name: /Gunakan data pembeli untuk semua tiket/i })
    .click();
  await page
    .getByRole("checkbox", { name: /Saya menyetujui syarat dan ketentuan/i })
    .check();
  await page
    .getByRole("checkbox", {
      name: /Saya memahami bahwa pembayaran ini adalah simulasi/i,
    })
    .check();
  await page
    .getByRole("checkbox", { name: /Simulasikan pembayaran gagal/i })
    .check();
  await page.getByRole("button", { name: /Bayar sekarang/i }).click();

  await expect(page).toHaveURL(/\/checkout\/result\/[0-9A-Z]{26}$/);
  await expect(
    page.getByRole("heading", { name: "Pembayaran belum berhasil" }),
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

  await page.goto("/organizer/settings");
  await page.getByLabel("Nama tampilan").fill("Rumah Kodingku API");
  await page.getByRole("button", { name: /^Simpan$/ }).click();
  await expect(page.getByText("Pengaturan disimpan.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nama tampilan")).toHaveValue(
    "Rumah Kodingku API",
  );
});
