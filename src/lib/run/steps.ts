export class StepDetector {
  private baseline: number | null = null;
  private samples = 0;
  private armed = true;
  private lastStep = -Infinity;
  reset() {
    this.baseline = null;
    this.samples = 0;
    this.armed = true;
    this.lastStep = -Infinity;
  }
  sample(x: number | null, y: number | null, z: number | null, now: number) {
    if (
      x === null ||
      y === null ||
      z === null ||
      ![x, y, z, now].every(Number.isFinite)
    )
      return false;
    const magnitude = Math.hypot(x, y, z);
    if (magnitude > 40) return false;
    this.baseline =
      this.baseline === null
        ? magnitude
        : this.baseline + 0.08 * (magnitude - this.baseline);
    this.samples++;
    const high = magnitude - this.baseline;
    if (high < 0.25) this.armed = true;
    if (
      this.samples >= 10 &&
      this.armed &&
      high > 1.2 &&
      now - this.lastStep >= 300
    ) {
      this.armed = false;
      this.lastStep = now;
      return true;
    }
    return false;
  }
}
export async function requestMotionAccess(): Promise<
  "granted" | "denied" | "unsupported"
> {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    typeof DeviceMotionEvent === "undefined"
  )
    return "unsupported";
  const constructor = DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<string>;
  };
  try {
    return constructor.requestPermission
      ? (await constructor.requestPermission()) === "granted"
        ? "granted"
        : "denied"
      : "granted";
  } catch {
    return "denied";
  }
}
