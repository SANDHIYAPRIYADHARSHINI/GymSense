import type {
  CoachMessage,
  CoachingDefinition,
  FormRule,
  PoseLandmark,
} from "@/data/exercises";
import type { RepEvent } from "./events";
import { jointAngle, type Landmark, type RepPhase } from "./counter.ts";
const indices: Record<PoseLandmark, number> = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
};
export type FormWarning = {
  id: string;
  message: CoachMessage;
  priority: number;
};
export function evaluateForm(
  points: Landmark[],
  rules: FormRule[],
  phase: RepPhase,
  side: "left" | "right" | null,
  aspect = 1,
  minVisibility = 0.7,
): FormWarning[] {
  const warnings: FormWarning[] = [];
  for (const rule of rules) {
    if (rule.when !== "always" && rule.when !== phase) continue;
    const names = rule.points.map((name) =>
      side === "right"
        ? (name.replace(/^left/, "right") as PoseLandmark)
        : name,
    );
    const values = names.map((name) => points[indices[name]]);
    if (
      values.some(
        (p) =>
          !p ||
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          (p.visibility ?? 0) < minVisibility ||
          p.x < 0 ||
          p.x > 1 ||
          p.y < 0 ||
          p.y > 1,
      )
    )
      continue;
    const [a, b, c] = values;
    let failed = false;
    if (rule.kind === "angle") {
      const angle = jointAngle(a, b, c, aspect);
      failed =
        angle !== null && (angle < rule.minDegrees || angle > rule.maxDegrees);
    } else {
      const dx = (c.x - a.x) * aspect,
        dy = c.y - a.y,
        lenSq = dx * dx + dy * dy;
      // A hip-height cue is meaningful only while the body is roughly horizontal.
      if (lenSq < 1e-6 || Math.abs(dx) / Math.sqrt(lenSq) < 0.65) continue;
      const projection = ((b.x - a.x) * aspect * dx + (b.y - a.y) * dy) / lenSq;
      const offset = (b.y - (a.y + projection * dy)) / Math.sqrt(lenSq);
      failed =
        rule.direction === "above"
          ? offset < -rule.maxOffsetRatio
          : offset > rule.maxOffsetRatio;
    }
    if (failed)
      warnings.push({
        id: rule.id,
        message: rule.message,
        priority: rule.priority,
      });
  }
  return warnings.sort((a, b) => b.priority - a.priority);
}
export class FeedbackDebouncer {
  private candidate: CoachMessage | null = null;
  private candidateAt = 0;
  private current: CoachMessage | null = null;
  private shownAt = 0;
  clear() {
    this.candidate = null;
    this.current = null;
    this.candidateAt = 0;
    this.shownAt = 0;
    return null;
  }
  update(message: CoachMessage | null, now: number) {
    if (message !== this.candidate) {
      this.candidate = message;
      this.candidateAt = now;
    }
    if (!message) {
      if (now - this.candidateAt >= 250) this.current = null;
      return this.current;
    }
    if (
      now - this.candidateAt >= 400 &&
      (!this.current || now - this.shownAt >= 1400) &&
      this.current !== message
    ) {
      this.current = message;
      this.shownAt = now;
    }
    return this.current;
  }
}
export type SetScore = {
  score: number | null;
  acceptedReps: number;
  attempts: number;
  completeness: number;
  tempoConsistency: number;
  form: number;
  averageRepMs: number | null;
};
export function scoreSet(
  events: RepEvent[],
  visibleFrames: number,
  warningFrames: number,
): SetScore {
  const accepted = events.filter((event) => event.outcome === "counted");
  const completeness = events.length ? accepted.length / events.length : 0;
  const durations = accepted.map((event) => event.durationMs);
  const average = durations.length
    ? durations.reduce((sum, value) => sum + value, 0) / durations.length
    : null;
  const variance =
    average === null
      ? 0
      : durations.reduce((sum, value) => sum + (value - average) ** 2, 0) /
        durations.length;
  const consistency = average
    ? Math.max(0, 1 - Math.sqrt(variance) / average)
    : 0;
  const tempo = completeness * consistency;
  const form = visibleFrames
    ? Math.max(0, 1 - warningFrames / visibleFrames)
    : 0;
  return {
    score: events.length
      ? accepted.length
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(40 * completeness + 30 * tempo + 30 * form),
            ),
          )
        : 0
      : null,
    acceptedReps: accepted.length,
    attempts: events.length,
    completeness: Math.round(completeness * 100),
    tempoConsistency: Math.round(tempo * 100),
    form: Math.round(form * 100),
    averageRepMs: average,
  };
}
export class CoachSession {
  private events: RepEvent[] = [];
  private visibleFrames = 0;
  private warningFrames = 0;
  private lastEventId = 0;
  private warnedInCycle = false;
  private recentCue: CoachMessage | null = null;
  private cueUntil = 0;
  private gate = new FeedbackDebouncer();
  record(event: RepEvent | null, definition: CoachingDefinition, now: number) {
    if (!event || event.id === this.lastEventId) return;
    this.lastEventId = event.id;
    this.events.push(event);
    this.recentCue =
      event.outcome === "too-fast"
        ? "Go a little slower"
        : event.outcome === "too-slow" || event.outcome === "incomplete"
          ? "Control the movement"
          : event.bottomPauseMs < definition.bottomPauseMs
            ? "Pause at the bottom"
            : this.warnedInCycle
              ? null
              : "Great rep!";
    this.cueUntil = now + 2200;
    this.warnedInCycle = false;
  }
  update(
    warnings: FormWarning[],
    event: RepEvent | null,
    definition: CoachingDefinition,
    now: number,
    visible: boolean,
    active = true,
  ) {
    if (visible && active) {
      this.visibleFrames++;
      if (warnings.length) {
        this.warningFrames++;
        this.warnedInCycle = true;
      }
    }
    this.record(event, definition, now);
    if (!visible) {
      this.recentCue = null;
      return this.gate.clear();
    }
    const cue =
      warnings[0]?.message ?? (now < this.cueUntil ? this.recentCue : null);
    return this.gate.update(cue, now);
  }
  score() {
    return scoreSet(this.events, this.visibleFrames, this.warningFrames);
  }
  reset() {
    this.events = [];
    this.visibleFrames = 0;
    this.warningFrames = 0;
    this.lastEventId = 0;
    this.warnedInCycle = false;
    this.recentCue = null;
    this.cueUntil = 0;
    this.gate.clear();
  }
}
