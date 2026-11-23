import { expect, test } from "@playwright/test";

test("a visitor can open an event category from the landing page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /make your next big thing happen/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Workshops" }).click();
  await expect(page).toHaveURL(/\/events\?category=workshop$/);
  await expect(page.getByLabel("Category")).toHaveValue("workshop");
  await page.getByLabel("Category").selectOption("coding");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page).toHaveURL(/[?&]category=coding(?:&|$)/);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});

test("title search, format and start date sorting work together", async ({
  page,
}) => {
  await page.goto("/events?category=hackathon");
  await page.getByLabel("Search by title").fill("fIxTuRe");
  await page.getByLabel("Format").selectOption("online");
  await page.getByLabel("Sort by start date").selectOption("latest");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page.locator(".event-card strong")).toHaveText([
    "Fixture Hackathon: Finals",
    "Fixture Hackathon",
  ]);
  await expect(page.getByLabel("Format")).toHaveValue("online");
  await page.getByLabel("Search by title").fill(".*");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "No published events match these filters.",
  );
});

test("an invalid event slug returns 404", async ({ page }) => {
  const response = await page.goto("/events/Invalid_Slug");
  expect(response?.status()).toBe(404);
});

test("a visitor can open a published event while a pending event stays hidden", async ({
  page,
}) => {
  await page.goto("/events?category=hackathon");
  await expect(
    page.getByRole("link", { name: /pending fixture/i }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: /fixture hackathon/i })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Fixture Hackathon" }),
  ).toBeVisible();
  await expect(
    page.getByText("Community submitted", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Fixture Hackathon",
  );

  await page.goto("/events/pending-fixture");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("account navigation protects private pages and exposes registration and recovery", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "My space", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to HackMate" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(
    page.getByRole("textbox", { name: "University email" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeVisible();
  await page.goto("/staff");
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await page.goto("/teams");
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
});

test("the home highlights published future events and excludes past events", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /make your next big thing happen/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Fixture Hackathon/i }).first()).toBeVisible();
  await expect(page.getByText("Past Event")).toHaveCount(0);
  await expect(page.getByText("Pending Fixture")).toHaveCount(0);

  await page.getByRole("link", { name: "View upcoming events" }).click();
  await expect(page).toHaveURL(/\/events\?upcoming=1$/);
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
  await expect(page.getByText("Past Event")).toHaveCount(0);
  await page.getByRole("link", { name: "Browse all dates" }).click();
  await expect(page.getByText("Past Event")).toBeVisible();
});

test("the global command palette searches events and closes with Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search events and pages" }).click();
  const dialog = page.getByRole("dialog", { name: "Search HackMate" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  // Verify the app-level shortcut independently of browser-reserved Ctrl+K.
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "k", ctrlKey: true, bubbles: true, cancelable: true,
    }));
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.keyboard.press("/");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("searchbox", { name: "Search events" }).fill("fixture");
  await dialog.getByRole("searchbox", { name: "Search events" }).press("Enter");
  await expect(page).toHaveURL(/[?&]q=fixture(?:&|$)/);
});

test("the mobile menu works without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: /Explore/ }).first().click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
});

test("continuous motion respects the reduced-motion preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".v3-ticker-track")).toHaveCSS("animation-name", "none");
});

test("published events support venue and registration filters and calendar export", async ({
  page,
  request,
}) => {
  await page.goto("/events");
  await page.getByLabel("City or venue").fill("algiers");
  await page
    .getByRole("combobox", { name: "Registration", exact: true })
    .selectOption("open");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page.locator(".event-card strong")).toHaveText([
    "Fixture Hackathon",
  ]);
  await page.getByRole("link", { name: /Fixture Hackathon/ }).click();
  const href = await page
    .getByRole("link", { name: "Download calendar event" })
    .getAttribute("href");
  const calendar = await request.get(href!);
  expect(calendar.headers()["content-type"]).toContain("text/calendar");
  expect(await calendar.text()).toContain(
    "Registration deadline · Fixture Hackathon",
  );
  expect((await request.get("/events/pending-fixture/calendar")).status()).toBe(
    404,
  );
});

test("university filter narrows events and is preserved in the URL", async ({ page }) => {
  await page.goto("/events");
  await page.getByLabel("University").selectOption("00000000-0000-4000-8000-000000000200");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page).toHaveURL(/university=00000000-0000-4000-8000-000000000200/);
  await expect(page.locator(".event-card strong")).toHaveText([
    "Fixture Hackathon: In Person",
  ]);
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page.getByLabel("University")).toHaveValue("");
});

test("published events always have a poster, but hidden events do not", async ({ page, request }) => {
  await page.goto("/events?category=hackathon");
  const cover = page.locator(".event-card .event-artwork img").first();
  await expect(cover).toHaveAttribute("src", "/events/fixture-hackathon/poster");
  const image = await request.get("/events/fixture-hackathon/poster");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/svg+xml");
  expect(await image.text()).toContain("Fixture Hackathon");

  expect((await request.get("/events/pending-fixture/poster")).status()).toBe(404);
  await page.goto("/events/fixture-hackathon");
  await expect(page.locator(".detail-poster img")).toHaveCount(1);
});


test("public readiness endpoint reports Supabase status without exposing credentials", async ({ request }) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toContain("no-store");
  const body = await response.json();
  expect(body.service).toBe("supabase");
  expect(["ready", "unavailable"]).toContain(body.status);
  expect(JSON.stringify(body)).not.toMatch(/sb_publishable_|service_role|SUPABASE_PUBLISHABLE_KEY/);
});
