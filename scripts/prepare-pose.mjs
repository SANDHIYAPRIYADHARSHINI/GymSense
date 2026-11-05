import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const destination = new URL("../public/mediapipe/wasm/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(
  fileURLToPath(
    new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url),
  ),
  fileURLToPath(destination),
  { recursive: true },
);
console.log("MediaPipe WASM assets prepared locally.");
