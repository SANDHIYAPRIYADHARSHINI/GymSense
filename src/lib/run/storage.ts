import {
  averagePace,
  type RunMode,
  type RunSnapshot,
  type StepSource,
} from "./engine.ts";
export const RUN_STORAGE_KEY = "gymsense:runs:v1";
export const RUNS_UPDATED_EVENT = "gymsense:runs-updated";
export type SavedRun = {
  id: string;
  startedAt: string;
  endedAt: string;
  mode: RunMode;
  durationSeconds: number;
  distanceMeters: number;
  averagePaceSeconds: number | null;
  steps: number;
  stepSource: StepSource;
  distanceSource: string;
};
export function completedRun(
  id: string,
  startedAt: string,
  endedAt: string,
  snapshot: RunSnapshot,
): SavedRun {
  return {
    id,
    startedAt,
    endedAt,
    mode: snapshot.mode,
    durationSeconds: Math.round(snapshot.elapsedSeconds * 10) / 10,
    distanceMeters: Math.round(snapshot.distanceMeters * 10) / 10,
    averagePaceSeconds: averagePace(
      snapshot.elapsedSeconds,
      snapshot.distanceMeters,
    ),
    steps: snapshot.steps,
    stepSource: snapshot.stepSource,
    distanceSource: snapshot.distanceSource,
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function bounded(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}
export function restoreRuns(raw: string | null): SavedRun[] {
  try {
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (!record(saved) || saved.version !== 1 || !Array.isArray(saved.runs))
      return [];
    const result: SavedRun[] = [];
    const ids = new Set<string>();
    for (const item of saved.runs) {
      if (
        !record(item) ||
        typeof item.id !== "string" ||
        item.id.length > 100 ||
        ids.has(item.id) ||
        typeof item.startedAt !== "string" ||
        typeof item.endedAt !== "string" ||
        !Number.isFinite(Date.parse(item.startedAt)) ||
        !Number.isFinite(Date.parse(item.endedAt)) ||
        Date.parse(item.endedAt) < Date.parse(item.startedAt) ||
        !(["outdoor", "manual", "ftms"] as unknown[]).includes(item.mode) ||
        !bounded(item.durationSeconds, 1, 172800) ||
        !bounded(item.distanceMeters, 0, 1000000) ||
        !bounded(item.steps, 0, 2000000) ||
        !Number.isInteger(item.steps) ||
        !(
          [
            "not tracked",
            "motion estimate",
            "manual",
            "distance estimate",
            "motion + manual",
          ] as unknown[]
        ).includes(item.stepSource) ||
        typeof item.distanceSource !== "string"
      )
        continue;
      ids.add(item.id);
      result.push({
        ...item,
        averagePaceSeconds: averagePace(
          item.durationSeconds,
          item.distanceMeters,
        ),
      } as SavedRun);
    }
    return result
      .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
      .slice(0, 100);
  } catch {
    return [];
  }
}
export function appendRun(raw: string | null, run: SavedRun) {
  return JSON.stringify({
    version: 1,
    runs: [run, ...restoreRuns(raw).filter((item) => item.id !== run.id)].slice(
      0,
      100,
    ),
  });
}
