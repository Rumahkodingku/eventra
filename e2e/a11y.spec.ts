import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { name: "home", path: "/" },
  { name: "events", path: "/events" },
  { name: "event detail", path: "/events/senja-sessions-aurora-live" },
  { name: "cart", path: "/cart" },
  { name: "checkout", path: "/checkout" },
  { name: "login", path: "/login" },
];

for (const entry of pages) {
  test(`accessibility: ${entry.name}`, async ({ page }) => {
    await page.goto(entry.path);
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    );
    expect(
      serious.map((violation) => ({
        id: violation.id,
        help: violation.help,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });
}

test("organizer pages accessibility", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Masuk sebagai organizer/i }).click();
  await expect(page).toHaveURL(/\/organizer\/dashboard$/);

  const organizerPages = [
    "/organizer/dashboard",
    "/organizer/events",
    "/organizer/events/evt-03/tickets",
    "/organizer/orders",
    "/organizer/attendees",
    "/organizer/check-in",
    "/organizer/analytics",
    "/organizer/settings",
  ];

  for (const path of organizerPages) {
    await page.goto(path);
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    );
    expect(
      serious.map((violation) => ({
        path,
        id: violation.id,
        help: violation.help,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
});
