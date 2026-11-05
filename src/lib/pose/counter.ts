import type { LiveCounterConfig } from "@/data/exercises";
import type { RepEvent } from "./events";
export type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};
export type RepPhase = "Ready" | "Down" | "Up";
export type PoseMeasurement = {
  valid: boolean;
  angle: number | null;
  phase: "Down" | "Up" | null;
  side: "left" | "right" | null;
  message: string;
};
export function jointAngle(
  a: Landmark,
  b: Landmark,
  c: Landmark,
  aspect = 1,
): number | null {
  const ax = (a.x - b.x) * aspect,
    ay = a.y - b.y,
    cx = (c.x - b.x) * aspect,
    cy = c.y - b.y;
  const denominator = Math.hypot(ax, ay) * Math.hypot(cx, cy);
  if (denominator < 1e-8) return null;
  const angle =
    (Math.acos(Math.min(1, Math.max(-1, (ax * cx + ay * cy) / denominator))) *
      180) /
    Math.PI;
  return Number.isFinite(angle) ? angle : null;
}
function visible(
  point: Landmark | undefined,
  threshold: number,
): point is Landmark {
  return (
    !!point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1 &&
    (point.visibility ?? 0) >= threshold
  );
}
export function analyzePose(
  points: Landmark[],
  config: LiveCounterConfig,
  aspect = 1,
  preferredSide: "left" | "right" | null = null,
): PoseMeasurement {
  const invalid: PoseMeasurement = {
    valid: false,
    angle: null,
    phase: null,
    side: null,
    message:
      "Keep your whole body in frame. Face the camera as directed and improve lighting.",
  };
  const good = (indices: number[]) =>
    indices.every((index) => visible(points[index], config.minVisibility));
  if (config.metric === "jumping-jack") {
    if (!good([11, 12, 15, 16, 23, 24, 27, 28])) return invalid;
    const width = Math.hypot(
      (points[11].x - points[12].x) * aspect,
      points[11].y - points[12].y,
    );
    if (width < 0.03)
      return {
        ...invalid,
        message: "Face the camera with both shoulders visible.",
      };
    const ankleRatio = (Math.abs(points[27].x - points[28].x) * aspect) / width;
    const raised =
      points[11].y - points[15].y > config.wristsRaisedMargin * width &&
      points[12].y - points[16].y > config.wristsRaisedMargin * width;
    const lowered =
      points[15].y - points[11].y > config.wristsLoweredMargin * width &&
      points[16].y - points[12].y > config.wristsLoweredMargin * width;
    const angle = jointAngle(points[23], points[11], points[15], aspect);
    return {
      valid: angle !== null,
      angle,
      side: null,
      phase:
        raised && ankleRatio >= config.ankleOpenRatio
          ? "Down"
          : lowered && ankleRatio <= config.ankleClosedRatio
            ? "Up"
            : null,
      message:
        "Open arms and legs together, then return to feet together and arms down.",
    };
  }
  const groups =
    config.metric === "knee"
      ? { left: [11, 23, 25, 27], right: [12, 24, 26, 28] }
      : { left: [11, 13, 15, 23, 27], right: [12, 14, 16, 24, 28] };
  const candidates = (["left", "right"] as const).filter((side) =>
    good(groups[side]),
  );
  if (!candidates.length) return invalid;
  const side =
    preferredSide && candidates.includes(preferredSide)
      ? preferredSide
      : candidates.sort(
          (a, b) =>
            Math.min(...groups[b].map((i) => points[i].visibility ?? 0)) -
            Math.min(...groups[a].map((i) => points[i].visibility ?? 0)),
        )[0];
  const triple =
    config.metric === "knee"
      ? side === "left"
        ? [23, 25, 27]
        : [24, 26, 28]
      : side === "left"
        ? [11, 13, 15]
        : [12, 14, 16];
  const angle = jointAngle(
    points[triple[0]],
    points[triple[1]],
    points[triple[2]],
    aspect,
  );
  return {
    valid: angle !== null,
    angle,
    phase: null,
    side,
    message:
      config.metric === "knee"
        ? "Stand side-on. Bend your knees, then return to standing."
        : "Stay side-on in a plank. Lower with control, then straighten your elbows.",
  };
}
export type CounterSnapshot = {
  reps: number;
  state: RepPhase;
  angle: number | null;
};
export class RepCounter {
  private phase: RepPhase = "Ready";
  private reps = 0;
  private candidate: "Down" | "Up" | null = null;
  private candidateFrames = 0;
  private candidateAt = 0;
  private movementAt: number | null = null;
  private bottomAt: number | null = null;
  private bottomPauseMs = 0;
  private smoothed: number | null = null;
  private side: "left" | "right" | null = null;
  private minimumAngle = 180;
  private eventId = 0;
  private event: RepEvent | null = null;
  private lastTime = 0;
  private config: LiveCounterConfig;
  constructor(config: LiveCounterConfig) {
    this.config = config;
  }
  snapshot(): CounterSnapshot {
    return { reps: this.reps, state: this.phase, angle: this.smoothed };
  }
  isMoving() {
    return this.movementAt !== null;
  }
  lastEvent() {
    return this.event;
  }
  preferredSide() {
    return this.side;
  }
  private completeness() {
    return this.config.metric === "jumping-jack"
      ? this.phase === "Down"
        ? 1
        : 0.5
      : Math.max(
          0,
          Math.min(
            1,
            (this.config.upAngle - this.minimumAngle) /
              (this.config.upAngle - this.config.downAngle),
          ),
        );
  }
  private emit(outcome: RepEvent["outcome"], now: number) {
    this.event = {
      id: ++this.eventId,
      outcome,
      durationMs: Math.max(0, now - (this.movementAt ?? now)),
      bottomPauseMs: this.bottomPauseMs,
      completeness: this.completeness(),
    };
  }
  invalidate() {
    if (this.movementAt !== null && this.completeness() >= 0.25)
      this.emit("incomplete", this.lastTime);
    this.phase = "Ready";
    this.candidate = null;
    this.candidateFrames = 0;
    this.movementAt = null;
    this.bottomAt = null;
    this.bottomPauseMs = 0;
    this.smoothed = null;
    this.side = null;
    this.minimumAngle = 180;
    return this.snapshot();
  }
  reset() {
    this.movementAt = null;
    this.reps = 0;
    this.event = null;
    return this.invalidate();
  }
  update(measurement: PoseMeasurement, now: number): CounterSnapshot {
    this.lastTime = now;
    if (!measurement.valid || measurement.angle === null)
      return this.invalidate();
    if (this.side && measurement.side && this.side !== measurement.side)
      this.invalidate();
    this.side = measurement.side;
    this.smoothed =
      this.smoothed === null
        ? measurement.angle
        : this.smoothed +
          this.config.smoothing * (measurement.angle - this.smoothed);
    let next = measurement.phase;
    if (this.config.metric !== "jumping-jack")
      next =
        this.smoothed <= this.config.downAngle
          ? "Down"
          : this.smoothed >= this.config.upAngle
            ? "Up"
            : null;
    if (this.phase === "Up" && next !== "Up" && this.movementAt === null) {
      this.movementAt = now;
      this.minimumAngle = this.smoothed;
    }
    if (this.movementAt !== null) {
      this.minimumAngle = Math.min(this.minimumAngle, this.smoothed);
      if (now - this.movementAt > this.config.maxCycleMs) {
        this.emit("too-slow", now);
        this.movementAt = null;
        return this.invalidate();
      }
    }
    if (this.phase === "Down" && this.bottomAt !== null && next !== "Down") {
      this.bottomPauseMs = Math.max(this.bottomPauseMs, now - this.bottomAt);
      this.bottomAt = null;
    }
    if (!next) {
      this.candidate = null;
      this.candidateFrames = 0;
      return this.snapshot();
    }
    if (next !== this.candidate) {
      this.candidate = next;
      this.candidateFrames = 1;
      this.candidateAt = now;
    } else this.candidateFrames++;
    if (this.candidateFrames < this.config.stableFrames) return this.snapshot();
    if (next === "Up") {
      if (this.phase === "Down" && this.movementAt !== null) {
        const duration = now - this.movementAt;
        if (duration >= this.config.minCycleMs) {
          this.reps++;
          this.emit("counted", now);
        } else this.emit("too-fast", now);
      } else if (this.movementAt !== null && this.completeness() >= 0.25)
        this.emit("incomplete", now);
      this.phase = "Up";
      this.movementAt = null;
      this.bottomAt = null;
      this.bottomPauseMs = 0;
      this.minimumAngle = 180;
    } else if (this.phase === "Up") {
      this.phase = "Down";
      this.bottomAt = this.candidateAt;
    }
    return this.snapshot();
  }
}
