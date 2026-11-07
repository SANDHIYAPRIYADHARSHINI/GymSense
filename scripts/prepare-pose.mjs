import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { patchMediaPipeLogging } from "./mediapipe-logging.mjs";
const destination = new URL("../public/mediapipe/wasm/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(
  fileURLToPath(
    new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url),
  ),
  fileURLToPath(destination),
  { recursive: true },
);
// Re-copy first so repeated installs generate identical assets.
for (const name of await readdir(destination)) {
  if (!name.endsWith(".js")) continue;
  const path = new URL(name, destination);
  await writeFile(path, patchMediaPipeLogging(await readFile(path, "utf8")));
}
console.log("MediaPipe WASM assets prepared locally.");
