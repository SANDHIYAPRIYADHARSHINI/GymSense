import type {
  PlanExercise,
  WorkoutDay,
  WorkoutPlan,
} from "@/data/workoutPlans";
export type PlanProgress = {
  version: 1;
  completedDays: number[];
  completedExercises: Record<number, string[]>;
  customDays: Record<number, PlanExercise[]>;
};
export function emptyProgress(): PlanProgress {
  return {
    version: 1,
    completedDays: [],
    completedExercises: {},
    customDays: {},
  };
}
export function storageKey(planId: string) {
  return `gymsense:plan:v1:${planId}`;
}
export function getDay(
  plan: WorkoutPlan,
  progress: PlanProgress,
  day: number,
): WorkoutDay {
  const original = plan.days.find((item) => item.day === day)!;
  return plan.editable
    ? { ...original, exercises: progress.customDays[day] ?? original.exercises }
    : original;
}
export function isDayUnlocked(progress: PlanProgress, day: number) {
  return Array.from({ length: day - 1 }, (_, index) => index + 1).every(
    (previous) => progress.completedDays.includes(previous),
  );
}
export function canCompleteDay(
  plan: WorkoutPlan,
  progress: PlanProgress,
  day: number,
) {
  const exercises = getDay(plan, progress, day).exercises;
  return (
    isDayUnlocked(progress, day) &&
    exercises.length > 0 &&
    exercises.every((ex) =>
      progress.completedExercises[day]?.includes(ex.exerciseId),
    )
  );
}
export function toggleExercise(
  plan: WorkoutPlan,
  progress: PlanProgress,
  day: number,
  exerciseId: string,
): PlanProgress {
  if (
    !isDayUnlocked(progress, day) ||
    progress.completedDays.includes(day) ||
    !getDay(plan, progress, day).exercises.some(
      (ex) => ex.exerciseId === exerciseId,
    )
  )
    return progress;
  const current = progress.completedExercises[day] ?? [];
  return {
    ...progress,
    completedExercises: {
      ...progress.completedExercises,
      [day]: current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    },
  };
}
export function completeDay(
  plan: WorkoutPlan,
  progress: PlanProgress,
  day: number,
): PlanProgress {
  if (
    progress.completedDays.includes(day) ||
    !canCompleteDay(plan, progress, day)
  )
    return progress;
  return { ...progress, completedDays: [...progress.completedDays, day] };
}
export function editCustomDay(
  plan: WorkoutPlan,
  progress: PlanProgress,
  day: number,
  exercises: PlanExercise[],
): PlanProgress {
  if (
    !plan.editable ||
    !isDayUnlocked(progress, day) ||
    progress.completedDays.includes(day)
  )
    return progress;
  const ids = new Set(exercises.map((ex) => ex.exerciseId));
  return {
    ...progress,
    customDays: { ...progress.customDays, [day]: exercises },
    completedExercises: {
      ...progress.completedExercises,
      [day]: (progress.completedExercises[day] ?? []).filter((id) =>
        ids.has(id),
      ),
    },
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validExercise(
  value: unknown,
  libraryIds: Set<string>,
): value is PlanExercise {
  if (
    !record(value) ||
    typeof value.exerciseId !== "string" ||
    !libraryIds.has(value.exerciseId)
  )
    return false;
  const positive = (v: unknown) =>
    typeof v === "number" && Number.isInteger(v) && v > 0 && v <= 3600;
  return (
    positive(value.sets) &&
    typeof value.restSeconds === "number" &&
    Number.isInteger(value.restSeconds) &&
    value.restSeconds >= 0 &&
    value.restSeconds <= 3600 &&
    ((positive(value.reps) && value.durationSeconds === undefined) ||
      (positive(value.durationSeconds) && value.reps === undefined))
  );
}
// Validate saved data before it can unlock a day or change a custom routine.
export function restoreProgress(
  raw: string | null,
  plan: WorkoutPlan,
  libraryIds: Set<string>,
): PlanProgress {
  const clean = emptyProgress();
  if (!raw) return clean;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed) || parsed.version !== 1) return clean;
    for (const day of plan.days) {
      if (
        plan.editable &&
        record(parsed.customDays) &&
        Array.isArray(parsed.customDays[day.day])
      ) {
        const seen = new Set<string>();
        clean.customDays[day.day] = (parsed.customDays[day.day] as unknown[])
          .filter((item): item is PlanExercise =>
            validExercise(item, libraryIds),
          )
          .filter((item) => {
            if (seen.has(item.exerciseId)) return false;
            seen.add(item.exerciseId);
            return true;
          });
      }
      const routine = getDay(plan, clean, day.day);
      const completed = record(parsed.completedExercises)
        ? parsed.completedExercises[day.day]
        : undefined;
      clean.completedExercises[day.day] = Array.isArray(completed)
        ? routine.exercises
            .filter((ex) => completed.includes(ex.exerciseId))
            .map((ex) => ex.exerciseId)
        : [];
      if (
        Array.isArray(parsed.completedDays) &&
        parsed.completedDays.includes(day.day) &&
        canCompleteDay(plan, clean, day.day)
      )
        clean.completedDays.push(day.day);
    }
  } catch {
    return emptyProgress();
  }
  return clean;
}
