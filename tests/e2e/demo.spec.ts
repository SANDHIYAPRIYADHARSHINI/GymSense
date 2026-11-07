import { exercises } from "../../src/data/exercises";
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
test("an outdoor GPS run appears in profile history", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 13.08, longitude: 80.27 });
  await page.goto("/run");
  await expect(
    page.getByRole("group", { name: "Run tracking mode" }).getByRole("button"),
  ).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Manual treadmill", exact: true }),
  ).toHaveCount(0);
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
    page.getByRole("heading", { name: "Outdoor GPS", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Outdoor GPS", exact: true }),
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
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "What are you working toward?" }),
  ).toBeVisible();
});

test("Home and dashboard agree on plan labels and render clean punctuation", async ({
  page,
}) => {
  const goals = [
    ["Weight Gain", "weight-gain"],
    ["Weight Loss", "weight-loss"],
    ["Custom Plan", "custom"],
  ] as const;
  for (const path of ["/", "/dashboard"]) {
    await page.goto(path);
    for (const [name, id] of goals) {
      const link = page
        .locator("main")
        .getByRole("link")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
      await expect(link).toHaveAttribute("href", "/plan/" + id);
    }
    expect(await page.locator("main").innerText()).not.toContain(
      String.fromCharCode(0xfffd),
    );
    if (path === "/") {
      await expect(page.locator(".floating-chip small")).toHaveText(
        "You've got this.",
      );
      await expect(
        page.getByRole("heading", { name: /You don't have to be extreme/ }),
      ).toBeVisible();
    }
  }
  for (const [name, id] of goals) {
    await page.goto("/plan/" + id);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
});

test("every exercise renders its own looping demo and YouTube destination", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const exercise of exercises) {
    await page.goto("/workout/" + exercise.id);
    await expect(
      page.getByRole("heading", { name: exercise.name, exact: true }),
    ).toBeVisible();
    const image = page.getByRole("img", {
      name: exercise.name + ": looping stickman demonstration",
      exact: true,
    });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect
      .poll(
        async () =>
          new URL((await image.getAttribute("src"))!, page.url()).pathname,
      )
      .toBe(exercise.animationPath);
    await expect(
      page.getByRole("link", { name: "YouTube", exact: true }),
    ).toHaveAttribute("href", exercise.youtubeVideo.url);
    await expect(
      page.getByText("Demo coming soon", { exact: true }),
    ).toHaveCount(0);
  }
});
test("demos pause, open fullscreen, and launch the chosen YouTube video", async ({
  page,
  context,
}) => {
  await page.goto("/workout/burpees");
  await page.getByRole("button", { name: "Watch demo", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  await expect(
    dialog.getByRole("img", {
      name: "Burpees: paused stickman pose",
      exact: true,
    }),
  ).toHaveAttribute("src", "/animations/burpees.poster.svg");
  await dialog
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await expect(
    dialog.getByRole("img", {
      name: "Burpees: looping stickman demonstration",
      exact: true,
    }),
  ).toHaveAttribute("src", "/animations/burpees.svg");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  // Keep the test offline; verify the actual new-tab URL without loading third-party advertising.
  await context.route("https://www.youtube.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>External exercise tutorial</h1>",
    }),
  );
  const opened = page.waitForEvent("popup");
  await page.getByRole("link", { name: "YouTube", exact: true }).click();
  const popup = await opened;
  await popup.waitForLoadState();
  await expect(popup).toHaveURL(
    exercises.find((e) => e.id === "burpees")!.youtubeVideo.url,
  );
  await popup.close();
  await page.goto("/plan/weight-gain");
  await expect(
    page.getByRole("link", { name: "YouTube", exact: true }),
  ).toHaveCount(3);
});

test("extension-injected root attributes do not cause hydration warnings", async ({
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(["local-network-access"], { origin: baseURL });
  await page.addInitScript(() =>
    sessionStorage.setItem("gymsense:mode:v1", "demo"),
  );
  await page.route("**/dashboard", async (route) => {
    const response = await route.fetch();
    const html = (await response.text())
      .replace(
        /<html([^>]*)>/,
        '<html$1 data-be-installed="true" data-liner-extension-version="7.18.55">',
      )
      .replace(
        /<body([^>]*)>/,
        '<body$1 data-new-gr-c-s-check-loaded="14.1164.0" data-gr-ext-installed="">',
      );
    await route.fulfill({ response, body: html });
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /Welcome back, Alex/ }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-liner-extension-version",
    "7.18.55",
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-gr-ext-installed",
    "",
  );
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: "Weight Loss", exact: true }),
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Weight Loss", exact: true }),
  ).toBeVisible();
});

test("strength counters expose exercise-specific setup without requesting the camera", async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("gymsense:mode:v1", "demo");
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () => {
        throw new Error("Camera must wait for an explicit click");
      },
    });
  });
  for (const id of [
    "biceps-curls",
    "hammer-curls",
    "shoulder-press",
    "lateral-raises",
    "triceps-extensions",
  ]) {
    await page.goto(`/workout/${id}`);
    await expect(
      page.getByRole("heading", { name: "Camera rep counter", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Start Camera Rep Counter",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Target reps")).toHaveValue("12");
    await page
      .getByRole("button", { name: "Reset Count", exact: true })
      .click();
    await expect(page.getByLabel("Live webcam feed")).toBeHidden();
  }
  await page.goto("/workout/plank");
  await expect(
    page.getByRole("heading", {
      name: "Camera preview & manual logging",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Camera Preview", exact: true }),
  ).toBeVisible();
});
