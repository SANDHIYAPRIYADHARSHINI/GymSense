import { exercises as exerciseLibrary } from "../src/data/exercises.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { workoutPlans, findWorkoutPlan } from "../src/data/workoutPlans.ts";
import {
  canCompleteDay,
  completeDay,
  editCustomDay,
  emptyProgress,
  getDay,
  isDayUnlocked,
  restoreProgress,
  storageKey,
  toggleExercise,
} from "../src/lib/workoutProgress.ts";
const ids = new Set(exerciseLibrary.map((ex) => ex.id));
const gain = findWorkoutPlan("weight-gain");
const custom = findWorkoutPlan("custom");
function finishExercises(plan, progress, day) {
  for (const item of getDay(plan, progress, day).exercises)
    progress = toggleExercise(plan, progress, day, item.exerciseId);
  return progress;
}
test("all plans have three days and valid library destinations and prescriptions", () => {
  assert.equal(workoutPlans.length, 3);
  for (const plan of workoutPlans) {
    assert.deepEqual(
      plan.days.map((day) => day.day),
      [1, 2, 3],
    );
    for (const day of plan.days) {
      assert.ok(day.title);
      if (!plan.editable) {
        assert.ok(day.focusMuscles.length);
        assert.ok(day.estimatedMinutes > 0);
        assert.ok(day.exercises.length);
      }
      for (const item of day.exercises) {
        assert.ok(ids.has(item.exerciseId));
        assert.ok(item.sets > 0);
        assert.ok(item.reps > 0 || item.durationSeconds > 0);
        assert.ok(item.restSeconds >= 0);
      }
    }
  }
});
test("day locking, completion gating and JSON persistence across all three days", () => {
  let progress = emptyProgress();
  assert.equal(isDayUnlocked(progress, 1), true);
  assert.equal(isDayUnlocked(progress, 2), false);
  assert.equal(isDayUnlocked(progress, 3), false);
  assert.equal(completeDay(gain, progress, 1), progress);
  assert.equal(toggleExercise(gain, progress, 2, "biceps-curls"), progress);
  progress = toggleExercise(gain, progress, 1, "push-ups");
  assert.equal(canCompleteDay(gain, progress, 1), false);
  progress = restoreProgress(JSON.stringify(progress), gain, ids);
  assert.deepEqual(progress.completedExercises[1], ["push-ups"]);
  progress = toggleExercise(gain, progress, 1, "push-ups");
  assert.deepEqual(progress.completedExercises[1], []);
  for (const day of [1, 2, 3]) {
    progress = finishExercises(gain, progress, day);
    assert.equal(canCompleteDay(gain, progress, day), true);
    progress = completeDay(gain, progress, day);
    progress = restoreProgress(JSON.stringify(progress), gain, ids);
    assert.ok(progress.completedDays.includes(day));
    if (day < 3) assert.equal(isDayUnlocked(progress, day + 1), true);
  }
  assert.deepEqual(progress.completedDays, [1, 2, 3]);
  assert.equal(toggleExercise(gain, progress, 1, "push-ups"), progress);
  assert.notEqual(storageKey("weight-gain"), storageKey("weight-loss"));
});
test("custom days start empty; additions, removal, prescriptions and completion persist", () => {
  let progress = emptyProgress();
  assert.equal(getDay(custom, progress, 1).exercises.length, 0);
  assert.equal(canCompleteDay(custom, progress, 1), false);
  const squat = { exerciseId: "squats", sets: 4, reps: 15, restSeconds: 45 };
  const plank = {
    exerciseId: "plank",
    sets: 2,
    durationSeconds: 40,
    restSeconds: 30,
  };
  assert.equal(editCustomDay(custom, progress, 2, [squat]), progress);
  progress = editCustomDay(custom, progress, 1, [squat, plank]);
  progress = toggleExercise(custom, progress, 1, "squats");
  progress = editCustomDay(custom, progress, 1, [plank]);
  assert.deepEqual(progress.completedExercises[1], []);
  progress = restoreProgress(JSON.stringify(progress), custom, ids);
  assert.deepEqual(getDay(custom, progress, 1).exercises, [plank]);
  progress = finishExercises(custom, progress, 1);
  progress = completeDay(custom, progress, 1);
  progress = restoreProgress(JSON.stringify(progress), custom, ids);
  assert.equal(isDayUnlocked(progress, 2), true);
  assert.equal(editCustomDay(custom, progress, 1, []), progress);
  assert.equal(getDay(custom, progress, 2).exercises.length, 0);
});
test("invalid or stale storage cannot bypass progression or add unknown exercises", () => {
  for (const raw of [null, "broken", "null", '{"version":2}'])
    assert.deepEqual(restoreProgress(raw, gain, ids), emptyProgress());
  const forged = {
    version: 1,
    completedDays: [1, 2, 3],
    completedExercises: {},
    customDays: {
      1: [
        { exerciseId: "missing", sets: 3, reps: 10, restSeconds: 30 },
        { exerciseId: "squats", sets: -1, reps: 10, restSeconds: 30 },
      ],
    },
  };
  const progress = restoreProgress(JSON.stringify(forged), custom, ids);
  assert.deepEqual(progress.completedDays, []);
  assert.deepEqual(progress.customDays[1], []);
  assert.equal(isDayUnlocked(progress, 2), false);
  const partial = emptyProgress();
  partial.completedDays = [2, 3];
  assert.deepEqual(
    restoreProgress(JSON.stringify(partial), gain, ids).completedDays,
    [],
  );
});
test("legacy plan links resolve to the same plan and persistence key", () => {
  assert.equal(findWorkoutPlan("build-muscle"), gain);
  assert.equal(findWorkoutPlan("lose-weight").id, "weight-loss");
  assert.equal(findWorkoutPlan("stay-fit"), custom);
  assert.equal(findWorkoutPlan("missing"), undefined);
});
