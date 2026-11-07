import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getApps }: typeof import("firebase/app") = require("firebase/app");
const values = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
});
const store = await import("../../src/lib/demo/store");
const users = await import("../../src/lib/firestore/users");
const workouts = await import("../../src/lib/firestore/workouts");
const records = await import("../../src/lib/firestore/records");
const friends = await import("../../src/lib/firestore/friends");
const { workoutPlans } = await import("../../src/data/workoutPlans");
const { toggleExercise, completeDay, editCustomDay } =
  await import("../../src/lib/workoutProgress");
const uid = store.DEMO_UID;
after(() => store.setDemoSession(false));
test("demo plans, custom editing and completion persist without creating a Firebase app", async () => {
  store.setDemoSession(true);
  store.resetDemo();
  const baseline = store.demoSnapshot().progress;
  const workoutsBefore = Object.values(baseline.activity).reduce(
    (n, d) => n + d.workouts,
    0,
  );
  const plan = workoutPlans.find((p) => p.id === "weight-loss")!;
  await workouts.mutatePlan(uid, plan, (p) => completeDay(plan, p, 2));
  assert.equal(store.demoSnapshot().progress.completedDays.length, 0);
  for (const ex of plan.days[0].exercises)
    await workouts.mutatePlan(uid, plan, (p) =>
      toggleExercise(plan, p, 1, ex.exerciseId),
    );
  await workouts.mutatePlan(uid, plan, (p) => completeDay(plan, p, 1));
  await workouts.mutatePlan(uid, plan, (p) => completeDay(plan, p, 1));
  assert.deepEqual(store.demoSnapshot().progress.completedDays, [
    "weight-loss-day-1",
  ]);
  assert.equal(
    Object.values(store.demoSnapshot().progress.activity).reduce(
      (n, d) => n + d.workouts,
      0,
    ),
    workoutsBefore + 1,
  );
  const custom = workoutPlans.find((p) => p.id === "custom")!;
  await workouts.mutatePlan(uid, custom, (p) =>
    editCustomDay(custom, p, 1, [
      { exerciseId: "squats", sets: 3, reps: 10, restSeconds: 60 },
    ]),
  );
  assert.equal(
    (await workouts.getWorkoutPlan(uid, "custom"))?.days[0].exercises.length,
    1,
  );
  store.setDemoSession(false);
  store.setDemoSession(true);
  assert.deepEqual((await workouts.getWorkoutProgress(uid)).completedDays, [
    "weight-loss-day-1",
  ]);
  assert.ok((await users.getUser(uid))?.createdAt.toMillis());
  assert.equal(getApps().length, 0);
});
test("demo exercise logs and runs update totals exactly once and notify views", async () => {
  store.resetDemo();
  let updates = 0;
  const stop = records.watchExerciseLogs(
    uid,
    () => updates++,
    () => assert.fail("No Firebase errors expected"),
  );
  const baseline = store.demoSnapshot().progress.totalReps;
  const input = {
    exerciseId: "squats",
    planGoal: "weight-loss" as const,
    dayId: null,
    sets: 1,
    reps: 10,
    durationSeconds: 30,
    formScore: 90,
  };
  await records.saveExerciseLog(uid, "set-1", input);
  await records.saveExerciseLog(uid, "set-1", input);
  assert.equal(store.demoSnapshot().progress.totalReps, baseline + 10);
  assert.ok(updates > 0);
  await records.removeExerciseLog(uid, "set-1");
  assert.equal(store.demoSnapshot().progress.totalReps, baseline);
  const run = {
    id: "run-1",
    mode: "manual" as const,
    startedAt: new Date(Date.now() - 600000).toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 600,
    distanceMeters: 1000,
    averagePaceSeconds: 600,
    steps: 1200,
    stepSource: "manual" as const,
    distanceSource: "manual",
  };
  await records.saveRun(uid, run);
  await records.saveRun(uid, run);
  assert.equal(store.demoSnapshot().runs.length, 1);
  stop();
  const previous = updates;
  store.resetDemo();
  await Promise.resolve();
  assert.equal(updates, previous);
  assert.equal(getApps().length, 0);
});
test("demo diet, intake, profile and challenge edits restore after a new session read", async () => {
  store.resetDemo();
  await records.saveDiet(uid, {
    ...store.demoSnapshot().diet,
    dietType: "vegan",
    allergies: ["nuts"],
  });
  await records.saveIntake(uid, "2026-11-07", {
    protein: 30,
    fiber: 5,
    water: 250,
    proteinTarget: 100,
    fiberTarget: 25,
    waterTarget: 2000,
  });
  await users.updateUser(uid, {
    displayName: "Demo Athlete",
    goal: "custom",
    fitnessLevel: "intermediate",
  });
  await friends.saveChallenges(uid, ["reps"]);
  store.setDemoSession(false);
  store.setDemoSession(true);
  assert.equal(store.demoSnapshot().diet.dietType, "vegan");
  assert.deepEqual(store.demoSnapshot().diet.allergies, ["nuts"]);
  assert.equal((await records.getIntake(uid, "2026-11-07"))?.protein, 30);
  assert.equal((await users.getUser(uid))?.displayName, "Demo Athlete");
  assert.deepEqual(store.demoSnapshot().challenges, ["reps"]);
});
test("sample friend consent, search, removal and reset work entirely offline", async () => {
  store.resetDemo();
  assert.equal((await users.searchUsers("@maya"))[0].uid, "demo-maya");
  assert.ok((await friends.getFriendActivity("demo-maya")).length > 0);
  await assert.rejects(friends.getFriendActivity("demo-jordan"));
  await friends.respondToFriendRequest("demo-jordan_" + uid, "accepted");
  assert.ok((await friends.getFriendActivity("demo-jordan")).length > 0);
  await friends.removeFriendOrRequest("demo-jordan_" + uid);
  await assert.rejects(friends.getFriendActivity("demo-jordan"));
  await friends.sendFriendRequest(uid, "demo-priya");
  assert.equal(
    store.demoSnapshot().requests.find((r) => r.to === "demo-priya")?.status,
    "pending",
  );
  store.resetDemo();
  assert.equal(store.demoSnapshot().requests.length, 2);
  assert.equal(store.demoSnapshot().profile.displayName, "Alex Johnson");
  assert.equal(getApps().length, 0);
});
test("blocked or malformed demo storage falls back to memory and never enables a real account", () => {
  store.setDemoSession(false);
  values.set("gymsense:demo:v1", "invalid json");
  store.setDemoSession(true);
  assert.equal(store.demoSnapshot().profile.uid, uid);
  assert.equal(store.demoStorageWarning(), true);
  store.setDemoSession(false);
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
    },
  });
  store.setDemoSession(true);
  store.resetDemo();
  assert.equal(store.demoStorageWarning(), true);
  store.setDemoSession(false);
  assert.equal(store.isDemoSession(uid), false);
  assert.equal(store.isDemoSession("real-account"), false);
  assert.equal(getApps().length, 0);
});
