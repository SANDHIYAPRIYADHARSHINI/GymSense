import type { Landmark } from "./counter";
// Shoulders, elbows, wrists, hips, knees and ankles; no face landmarks are drawn.
const connections = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];
const joints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
export function drawSkeleton(
  canvas: HTMLCanvasElement,
  points: Landmark[],
  visibility = 0.5,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const valid = (index: number) => {
    const p = points[index];
    return (
      p &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      (p.visibility ?? 0) >= visibility
    );
  };
  context.strokeStyle = "#ccf66b";
  context.lineWidth = 3;
  context.lineCap = "round";
  for (const [a, b] of connections) {
    if (!valid(a) || !valid(b)) continue;
    context.beginPath();
    context.moveTo(points[a].x * canvas.width, points[a].y * canvas.height);
    context.lineTo(points[b].x * canvas.width, points[b].y * canvas.height);
    context.stroke();
  }
  for (const index of joints) {
    if (!valid(index)) continue;
    context.fillStyle = "#f4ffdf";
    context.beginPath();
    context.arc(
      points[index].x * canvas.width,
      points[index].y * canvas.height,
      4,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}
export function isFrameDark(
  video: HTMLVideoElement,
  sample: HTMLCanvasElement,
) {
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.drawImage(video, 0, 0, sample.width, sample.height);
  const { data } = context.getImageData(0, 0, sample.width, sample.height);
  let brightness = 0;
  for (let i = 0; i < data.length; i += 4)
    brightness +=
      0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return brightness / (data.length / 4) < 35;
}
