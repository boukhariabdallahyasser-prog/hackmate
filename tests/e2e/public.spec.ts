import { expect, test } from "@playwright/test";

test("a visitor can open an event category from the landing page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /find your next hackathon/i }),
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
  await expect(page.locator(".event-card .event-title")).toHaveText([
    "Fixture Hackathon: Finals",
    "Fixture Hackathon",
  ]);
  await expect(page.getByLabel("Format")).toHaveValue("online");
  await page.getByLabel("Search by title").fill(".*");
  await page.getByRole("button", { name: "Apply filter" }).click();
  await expect(page.getByRole("status")).toContainText("No published events match these filters.");
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
  await page.getByRole("link", { name: "Account", exact: true }).click();
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

test("the home agenda opens published future events and excludes past events", async ({
  page,
}) => {
  await page.goto("/");
  const agenda = page.getByRole("region", { name: "Coming up" });
  await expect(
    agenda.getByRole("link", { name: /Fixture Hackathon/ }).first(),
  ).toBeVisible();
  await expect(agenda.getByText("Past Event")).toHaveCount(0);
  await expect(agenda.getByText("Pending Fixture")).toHaveCount(0);
  await agenda.getByRole("link", { name: "View the calendar" }).click();
  await expect(page).toHaveURL(/\/events\?upcoming=1$/);
  await expect(
    page.getByRole("heading", { name: "Upcoming events" }),
  ).toBeVisible();
  await expect(page.getByText("Past Event")).toHaveCount(0);
  await page.getByRole("link", { name: "All events", exact: true }).click();
  await expect(page.getByText("Past Event")).toBeVisible();
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

test("mobile navigation exposes the same main destinations", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Find teammates" })).toBeVisible();
    await page.getByRole("link", { name: "Find teammates" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  } else {
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "HackMate home" })).toBeVisible();
});

test("landing search takes visitors to the filtered directory", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search student events" }).fill("fixture");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/events\?q=fixture$/);
  await expect(page.getByLabel("Search by title")).toHaveValue("fixture");
});

test("capture home and directory UI for visual review", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
  await page.goto("/events?upcoming=1");
  await page.screenshot({ path: testInfo.outputPath("events.png"), fullPage: true });
});
