import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { after, test } from "node:test";
import assert from "node:assert/strict";
const {
  initializeApp,
  deleteApp,
}: typeof import("firebase/app") = require("firebase/app");
const {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  getAuth,
}: typeof import("firebase/auth") = require("firebase/auth");
const {
  connectFirestoreEmulator,
  getFirestore,
  getDoc,
  doc,
}: typeof import("firebase/firestore") = require("firebase/firestore");
// Fake demo configuration only. These tests must never connect to a live project.
for (const [key, value] of Object.entries({
  API_KEY: "demo-only-key",
  AUTH_DOMAIN: "demo-gymsense.firebaseapp.com",
  PROJECT_ID: "demo-gymsense",
  STORAGE_BUCKET: "demo-gymsense.appspot.com",
  MESSAGING_SENDER_ID: "123456789",
  APP_ID: "demo-only-app",
}))
  process.env["NEXT_PUBLIC_FIREBASE_" + key] = value;
const { firebaseClient } = await import("../../src/lib/firebase");
const { auth, db } = firebaseClient();
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
connectFirestoreEmulator(db, "127.0.0.1", 8080);
const { createProfile, updateUser } =
  await import("../../src/lib/firestore/users");
const { mutatePlan, getWorkoutProgress } =
  await import("../../src/lib/firestore/workouts");
const {
  saveExerciseLog,
  saveRun,
  saveDiet,
  saveIntake,
  getIntake,
  removeExerciseLog,
} = await import("../../src/lib/firestore/records");
const {
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendOrRequest,
  getFriendActivity,
  saveChallenges,
} = await import("../../src/lib/firestore/friends");
const { workoutPlans } = await import("../../src/data/workoutPlans");
const { toggleExercise, completeDay, editCustomDay } =
  await import("../../src/lib/workoutProgress");
const { defaultPreferences } = await import("../../src/lib/diet");
after(async () => {
  await signOut(auth);
  await deleteApp(auth.app);
});
test("real SDK signup/login/reset, profile, plans, logs, diet, runs, friends, and second-browser persistence", async () => {
  const suffix = Date.now(),
    email = `runner${suffix}@example.test`,
    password = "Test-only-password-2026";
  const account = (await createUserWithEmailAndPassword(auth, email, password))
    .user;
  await createProfile(account, {
    username: `run${suffix}`,
    displayName: "Test Runner",
    goal: "weight-loss",
  });
  const plan = workoutPlans.find((p) => p.id === "weight-loss")!;
  // Premature completion must stay locked; transactional callbacks use server state.
  await mutatePlan(account.uid, plan, (p) => completeDay(plan, p, 2));
  assert.deepEqual((await getWorkoutProgress(account.uid)).completedDays, []);
  await Promise.all(
    plan.days[0].exercises.map((ex) =>
      mutatePlan(account.uid, plan, (p) =>
        toggleExercise(plan, p, 1, ex.exerciseId),
      ),
    ),
  );
  await mutatePlan(account.uid, plan, (p) => completeDay(plan, p, 1));
  await mutatePlan(account.uid, plan, (p) => completeDay(plan, p, 1));
  let progress = await getWorkoutProgress(account.uid);
  assert.deepEqual(progress.completedDays, ["weight-loss-day-1"]);
  assert.equal(Object.values(progress.activity)[0].workouts, 1);
  const logId = account.uid + "-set";
  const log = {
    exerciseId: "squats",
    planGoal: "weight-loss" as const,
    dayId: "weight-loss-day-1",
    sets: 1,
    reps: 12,
    durationSeconds: 30,
    formScore: 90,
  };
  await saveExerciseLog(account.uid, logId, log);
  await saveExerciseLog(account.uid, logId, log);
  assert.equal((await getWorkoutProgress(account.uid)).totalReps, 12);
  await saveDiet(account.uid, {
    ...defaultPreferences,
    dietType: "vegan",
    allergies: ["nuts"],
  });
  const run = {
    id: "test-run",
    mode: "manual" as const,
    startedAt: new Date(Date.now() - 600000).toISOString(),
    endedAt: new Date(Date.now() - 1000).toISOString(),
    durationSeconds: 600,
    distanceMeters: 1000,
    averagePaceSeconds: 600,
    steps: 1200,
    stepSource: "manual" as const,
    distanceSource: "manual",
  };
  await saveRun(account.uid, run);
  await saveRun(account.uid, run);
  progress = await getWorkoutProgress(account.uid);
  assert.equal(progress.totalActiveMinutes, 10.5);
  const custom = workoutPlans.find((p) => p.id === "custom")!;
  await mutatePlan(account.uid, custom, (p) =>
    editCustomDay(custom, p, 1, [
      { exerciseId: "squats", sets: 2, reps: 10, restSeconds: 30 },
    ]),
  );
  assert.equal(
    (await getWorkoutProgress(account.uid)).plans.custom?.customDays[1][0]
      .exerciseId,
    "squats",
  );
  await saveIntake(account.uid, "2026-11-07", {
    protein: 40,
    fiber: 10,
    water: 500,
    proteinTarget: 100,
    fiberTarget: 25,
    waterTarget: 2000,
  });
  assert.equal((await getIntake(account.uid, "2026-11-07"))?.protein, 40);
  await saveChallenges(account.uid, ["workouts"]);
  await updateUser(account.uid, {
    displayName: "Updated Runner",
    goal: "custom",
    fitnessLevel: "intermediate",
  });
  assert.equal(
    (await getDoc(doc(db, "publicProfiles", account.uid))).data()?.displayName,
    "Updated Runner",
  );
  await sendPasswordResetEmail(auth, email);
  // A separate Firebase app has a separate auth/cache instance, equivalent to another browser.
  const second = initializeApp(
    {
      apiKey: "demo-only-key",
      projectId: "demo-gymsense",
      appId: "demo-only-app",
    },
    "second-browser",
  );
  const auth2 = getAuth(second),
    db2 = getFirestore(second);
  connectAuthEmulator(auth2, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db2, "127.0.0.1", 8080);
  try {
    await signInWithEmailAndPassword(auth2, email, password);
    const persisted = await getDoc(doc(db2, "workoutProgress", account.uid));
    assert.deepEqual(persisted.data()?.completedDays, ["weight-loss-day-1"]);
    assert.equal(
      (await getDoc(doc(db2, "users", account.uid))).data()?.username,
      `run${suffix}`,
    );
    await signOut(auth2);
    await assert.rejects(getDoc(doc(db2, "users", account.uid)));
  } finally {
    await deleteApp(second);
  }
  await signOut(auth);
  await signInWithEmailAndPassword(auth, email, password);
  assert.equal((await getWorkoutProgress(account.uid)).totalReps, 12);
  // Complete actual request flow through typed data functions.
  const other = (
    await createUserWithEmailAndPassword(
      auth,
      `friend${suffix}@example.test`,
      password,
    )
  ).user;
  await assert.rejects(
    createProfile(other, {
      username: `run${suffix}`,
      displayName: "Taken",
      goal: "custom",
    }),
    /taken/,
  );
  await createProfile(other, {
    username: `pal${suffix}`,
    displayName: "Test Friend",
    goal: "custom",
  });
  await sendFriendRequest(other.uid, account.uid);
  await assert.rejects(getFriendActivity(account.uid));
  await signInWithEmailAndPassword(auth, email, password);
  await respondToFriendRequest(`${other.uid}_${account.uid}`, "accepted");
  await signInWithEmailAndPassword(
    auth,
    `friend${suffix}@example.test`,
    password,
  );
  assert.ok((await getFriendActivity(account.uid)).length > 0);
  await removeFriendOrRequest(`${other.uid}_${account.uid}`);
  await assert.rejects(getFriendActivity(account.uid));
  await signInWithEmailAndPassword(auth, email, password);
  await removeExerciseLog(account.uid, logId);
  assert.equal((await getWorkoutProgress(account.uid)).totalReps, 0);
});
