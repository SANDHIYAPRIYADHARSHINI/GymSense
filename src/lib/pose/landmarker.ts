import type { PoseLandmarker } from "@mediapipe/tasks-vision";
export async function createPoseLandmarker(
  signal: AbortSignal,
): Promise<PoseLandmarker> {
  const [{ FilesetResolver, PoseLandmarker }, response] = await Promise.all([
    import("@mediapipe/tasks-vision"),
    fetch("/mediapipe/pose_landmarker_lite.task", { signal }),
  ]);
  if (!response.ok)
    throw new Error(
      "The local pose model could not be loaded. Run npm install and retry.",
    );
  const modelAssetBuffer = new Uint8Array(await response.arrayBuffer());
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const detector = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetBuffer, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.6,
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
    outputSegmentationMasks: false,
  });
  if (signal.aborted) {
    detector.close();
    throw new DOMException("Cancelled", "AbortError");
  }
  return detector;
}
