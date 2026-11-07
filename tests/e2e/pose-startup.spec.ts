import { test, expect } from "@playwright/test";

test("real pose model starts without an error overlay and releases its camera", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(60000);
  await context.grantPermissions(["local-network-access"], { origin: baseURL });
  const errors: string[] = [];
  const infos: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "info") infos.push(message.text());
  });
  // Exercise the real local WASM/model without accessing a physical webcam.
  await page.addInitScript(() => {
    sessionStorage.setItem("gymsense:mode:v1", "demo");
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d")!;
        const paint = () => {
          ctx.fillStyle = "#aaa";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        paint();
        const stream = canvas.captureStream(15);
        const interval = setInterval(() => {
          if (stream.active) paint();
          else clearInterval(interval);
        }, 66);
        return stream;
      },
    });
  });
  await page.goto("/workout/biceps-curls");
  await page
    .getByRole("button", { name: "Start Camera Rep Counter", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Stop Camera", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect
    .poll(
      () =>
        infos.some((message) =>
          message.includes("Created TensorFlow Lite XNNPACK delegate for CPU"),
        ),
      { timeout: 30000 },
    )
    .toBe(true);
  await expect(
    page.getByText(/Tracking paused; improve lighting/),
  ).toBeVisible();
  const video = page.getByLabel("Live webcam feed");
  const track = await video.evaluateHandle(
    (node) =>
      ((node as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0],
  );
  await page.getByRole("button", { name: "Stop Camera", exact: true }).click();
  expect(await track.evaluate((track) => track.readyState)).toBe("ended");
  await expect(video).toBeHidden();
  expect(errors).toEqual([]);
});
