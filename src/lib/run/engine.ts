import { GpsDistanceTracker, type GpsFix } from "./gps.ts";
import type { TreadmillTelemetry } from "../bluetooth/ftms";
export type RunMode = "outdoor" | "manual" | "ftms";
export type RunStatus = "idle" | "running" | "paused" | "stopped";
export type StepSource =
  | "not tracked"
  | "motion estimate"
  | "manual"
  | "distance estimate"
  | "motion + manual";
export type RunSnapshot = {
  mode: RunMode;
  status: RunStatus;
  elapsedSeconds: number;
  distanceMeters: number;
  speedKph: number;
  currentPaceSeconds: number | null;
  averagePaceSeconds: number | null;
  steps: number;
  stepSource: StepSource;
  inclinePercent: number | null;
  distanceSource: string;
};
export function paceFromSpeed(speedKph: number) {
  return speedKph > 0 ? 3600 / speedKph : null;
}
export function averagePace(seconds: number, meters: number) {
  return meters > 0 && seconds > 0 ? seconds / (meters / 1000) : null;
}
export function formatPace(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return "—";
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}
export function formatRunTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600),
    m = Math.floor(total / 60) % 60,
    s = total % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
export class RunEngine {
  mode: RunMode = "outdoor";
  status: RunStatus = "idle";
  private elapsedMs = 0;
  private distance = 0;
  private lastTick = 0;
  private speed = 0;
  private speedAt = -Infinity;
  private deviceDistance: number | null = null;
  private hasDeviceDistance = false;
  private gps = new GpsDistanceTracker();
  private steps = 0;
  private stepSource: StepSource = "not tracked";
  private incline: number | null = null;
  private manualSpeed = 8;
  private telemetryAt = -Infinity;
  reset(mode: RunMode = this.mode) {
    this.mode = mode;
    this.status = "idle";
    this.elapsedMs = 0;
    this.distance = 0;
    this.lastTick = 0;
    this.speed = 0;
    this.speedAt = -Infinity;
    this.deviceDistance = null;
    this.hasDeviceDistance = false;
    this.gps.reset();
    this.steps = 0;
    this.stepSource = "not tracked";
    this.incline = null;
    this.telemetryAt = -Infinity;
  }
  start(now: number) {
    if (this.status !== "idle") return;
    this.status = "running";
    this.lastTick = now;
    this.telemetryAt = now;
    this.gps.reset();
    this.deviceDistance = null;
  }
  tick(now: number) {
    if (this.status !== "running") return;
    const end = Math.max(now, this.lastTick),
      start = this.lastTick,
      delta = (end - start) / 1000;
    this.elapsedMs += delta * 1000;
    if (this.mode === "manual")
      this.distance += (this.manualSpeed / 3.6) * delta;
    else if (this.mode === "ftms" && !this.hasDeviceDistance) {
      const fresh =
        Math.max(
          0,
          Math.min(end, this.speedAt + 3000) - Math.max(start, this.speedAt),
        ) / 1000;
      this.distance += (this.speed / 3.6) * fresh;
    }
    this.lastTick = end;
  }
  pause(now: number) {
    if (this.status !== "running") return;
    this.tick(now);
    this.status = "paused";
    this.gps.reset();
    this.deviceDistance = null;
    this.speedAt = -Infinity;
  }
  resume(now: number) {
    if (this.status !== "paused") return;
    this.status = "running";
    this.lastTick = now;
    this.speedAt = -Infinity;
    this.telemetryAt = now;
    this.deviceDistance = null;
    this.gps.reset();
  }
  stop(now: number) {
    if (this.status === "running") this.tick(now);
    if (this.status !== "idle") this.status = "stopped";
    this.gps.reset();
  }
  setManualSpeed(value: number, now: number) {
    if (!Number.isFinite(value)) return;
    this.tick(now);
    this.manualSpeed = Math.max(0, Math.min(30, value));
  }
  setManualIncline(value: number) {
    if (Number.isFinite(value) && this.mode === "manual")
      this.incline = Math.max(-10, Math.min(30, value));
  }
  setDistance(meters: number, now: number) {
    if (
      this.mode !== "manual" ||
      !["running", "paused"].includes(this.status) ||
      !Number.isFinite(meters) ||
      meters < 0 ||
      meters > 1000000
    )
      return;
    this.tick(now);
    this.distance = meters;
  }
  setSteps(steps: number, source: StepSource = "manual") {
    if (["running", "paused"].includes(this.status) && Number.isFinite(steps)) {
      this.steps = Math.max(0, Math.min(2000000, Math.round(steps)));
      this.stepSource = source;
    }
  }
  addStep() {
    if (this.status !== "running") return;
    this.steps++;
    this.stepSource =
      this.stepSource === "not tracked" || this.stepSource === "motion estimate"
        ? "motion estimate"
        : "motion + manual";
  }
  gpsFix(fix: GpsFix, now: number, receivedAt: number) {
    if (this.status !== "running" || this.mode !== "outdoor")
      return "GPS tracking is paused.";
    this.tick(now);
    const result = this.gps.push(fix, receivedAt);
    this.distance += result.meters;
    this.speed = result.speedMps === null ? 0 : result.speedMps * 3.6;
    this.speedAt = now;
    return result.message;
  }
  telemetry(sample: TreadmillTelemetry, now: number) {
    this.tick(now);
    this.telemetryAt = now;
    if (
      sample.speedKph !== undefined &&
      sample.speedKph >= 0 &&
      sample.speedKph <= 40
    ) {
      this.speed = sample.speedKph;
      this.speedAt = now;
    }
    if (sample.inclinePercent !== undefined)
      this.incline = sample.inclinePercent;
    if (sample.distanceMeters !== undefined) {
      if (this.status === "running" && this.mode === "ftms") {
        this.hasDeviceDistance = true;
        if (this.deviceDistance !== null) {
          const delta = sample.distanceMeters - this.deviceDistance;
          if (delta >= 0 && delta <= 200) this.distance += delta;
        }
      }
      this.deviceDistance = sample.distanceMeters;
    }
  }
  telemetryAge(now: number) {
    return now - this.telemetryAt;
  }
  snapshot(now: number): RunSnapshot {
    const speed =
      this.status !== "running"
        ? 0
        : this.mode === "manual"
          ? this.manualSpeed
          : now - this.speedAt <= 3000
            ? this.speed
            : 0;
    return {
      mode: this.mode,
      status: this.status,
      elapsedSeconds: this.elapsedMs / 1000,
      distanceMeters: this.distance,
      speedKph: speed,
      currentPaceSeconds: paceFromSpeed(speed),
      averagePaceSeconds: averagePace(this.elapsedMs / 1000, this.distance),
      steps: this.steps,
      stepSource: this.stepSource,
      inclinePercent: this.incline,
      distanceSource:
        this.mode === "outdoor"
          ? "GPS"
          : this.mode === "manual"
            ? "Manual speed estimate"
            : this.hasDeviceDistance
              ? "FTMS distance"
              : "FTMS speed estimate",
    };
  }
}
