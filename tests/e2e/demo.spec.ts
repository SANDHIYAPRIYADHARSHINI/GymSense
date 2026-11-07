import { test, expect, type Page } from "@playwright/test";
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  await page.route(
    /https:\/\/[^/]*(googleapis\.com|firebaseio\.com|firebaseapp\.com)/,
    (route) => {
      messages.push("Demo attempted a Firebase request");
      return route.abort();
    },
  );
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
test("every previously blocked screen opens automatically without configuration", async ({
  page,
}) => {
  for (const [path, title] of [
    ["/dashboard", /Welcome back, Alex/],
    ["/run", "One step. Then the next."],
    ["/friends", "Find your people."],
    ["/profile", "Your effort has a story."],
    ["/exercises", "The exercise library."],
    ["/diet", "Your plate. Your preferences."],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByRole("region", { name: "Demo mode" })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
test("day completion persists on refresh and Reset demo restores day locks", async ({
  page,
}) => {
  await page.goto("/plan/weight-loss");
  const day2 = page.getByRole("button", { name: /Day 2:/ });
  await expect(day2).toBeDisabled();
  for (const checkbox of await page.getByRole("checkbox").all())
    await checkbox.check();
  await page
    .getByRole("button", { name: "Mark Day Complete", exact: true })
    .click();
  await expect(day2).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Day 1:.*Completed/ }),
  ).toBeVisible();
  await expect(day2).toBeEnabled();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(day2).toBeDisabled();
});
test("exercise sets and dietary preferences survive a refresh", async ({
  page,
}) => {
  await page.goto("/workout/squats");
  await page.locator("#set-count").fill("10");
  await page.getByRole("button", { name: "Log set", exact: true }).click();
  await expect(page.getByText(/1 sets logged/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/1 sets logged/)).toBeVisible();
  await page.goto("/diet");
  await page.locator("#diet-type").selectOption("vegan");
  await expect(
    page.getByText("Demo preferences saved in this tab."),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("#diet-type")).toHaveValue("vegan");
});
test("sample friend requests and profile previews are interactive", async ({
  page,
}) => {
  await page.goto("/friends");
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByText("No pending requests.")).toBeVisible();
  await page
    .getByRole("button", { name: "View profile", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Maya Chen", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "View profile", exact: true }),
  ).toHaveCount(2);
});
test("a manual treadmill run appears in profile history", async ({ page }) => {
  await page.goto("/run");
  await page
    .getByRole("button", { name: "Manual treadmill", exact: true })
    .click();
  await page.getByRole("button", { name: "Start run", exact: true }).click();
  await expect(page.getByText("00:01", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Stop & save run", exact: true })
    .click();
  await expect(
    page.getByText("Demo run saved in this tab and profile history."),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Manual treadmill", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Manual treadmill", exact: true }),
  ).toBeVisible();
});
test("Firebase login and demo re-entry work without configuration", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Firebase login", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Try GymSense", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue in demo mode", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: /Welcome back, Alex/ }),
  ).toBeVisible();
});
