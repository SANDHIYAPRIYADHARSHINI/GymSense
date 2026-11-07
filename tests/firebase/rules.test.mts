import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-gymsense",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8").replace(/^\uFEFF/, ""),
    },
  });
});
after(async () => {
  await env?.cleanup();
});
const db = (uid: string) =>
  env.authenticatedContext(uid, { email: uid + "@example.test" }).firestore();
async function account(uid: string, username = uid) {
  const store = db(uid),
    batch = writeBatch(store);
  const p = {
    uid,
    username,
    displayName: uid,
    goal: "weight-gain",
    photoURL: null,
  };
  batch.set(doc(store, "usernames", username), { uid });
  batch.set(doc(store, "users", uid), {
    ...p,
    email: uid + "@example.test",
    fitnessLevel: "beginner",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(store, "publicProfiles", uid), p);
  return batch.commit();
}
const progress = () => ({
  currentPlanGoal: "weight-gain",
  completedDays: [],
  completedExercises: {},
  plans: {},
  activity: {},
  currentStreak: 0,
  longestStreak: 0,
  lastWorkoutDate: null,
  totalReps: 0,
  totalActiveMinutes: 0,
  updatedAt: serverTimestamp(),
});

test("profiles and atomic username claims: self only, no collisions, no email exposure", async () => {
  await assertSucceeds(account("alice"));
  await assertSucceeds(account("bravo"));
  await assertFails(account("charlie", "alice"));
  await assertSucceeds(getDoc(doc(db("alice"), "users", "alice")));
  await assertFails(getDoc(doc(db("bravo"), "users", "alice")));
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), "users", "alice")),
  );
  await assertFails(
    updateDoc(doc(db("bravo"), "users", "alice"), {
      displayName: "Hacked",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(db("bravo"), "usernames", "alice"), { uid: "bravo" }),
  );
  await assertFails(deleteDoc(doc(db("alice"), "usernames", "alice")));
  await assertFails(
    setDoc(doc(db("bravo"), "usernames", "orphan"), { uid: "bravo" }),
  );
  const search = await assertSucceeds(
    getDocs(
      query(
        collection(db("bravo"), "publicProfiles"),
        where("username", ">=", "ali"),
        where("username", "<=", "ali\uf8ff"),
        limit(20),
      ),
    ),
  );
  assert.equal(search.docs[0].data().email, undefined);
  await assertFails(
    updateDoc(doc(db("alice"), "publicProfiles", "alice"), {
      email: "leak@example.test",
    }),
  );
  await assertFails(getDocs(collection(db("bravo"), "publicProfiles")));
  await assertFails(
    getDocs(
      query(
        collection(env.unauthenticatedContext().firestore(), "publicProfiles"),
        limit(20),
      ),
    ),
  );
});

test("all private collections reject cross-user writes and reads", async () => {
  const a = db("alice"),
    b = db("bravo");
  const cases: [string, Record<string, unknown>][] = [
    ["workoutProgress/alice", progress()],
    [
      "workoutPlans/alice/plans/custom",
      {
        id: "custom",
        title: "Custom",
        description: "Test",
        editable: true,
        days: [{}, {}, {}],
      },
    ],
    [
      "dietPreferences/alice",
      {
        goal: "maintain",
        dietType: "vegan",
        allergies: ["nuts"],
        cuisine: "Indian",
        mealsPerDay: 3,
        budget: "budget",
        cookingTime: "under 15 minutes",
        updatedAt: serverTimestamp(),
      },
    ],
    [
      "users/alice/intake/2026-11-07",
      {
        protein: 10,
        fiber: 5,
        water: 250,
        proteinTarget: 100,
        fiberTarget: 25,
        waterTarget: 2000,
      },
    ],
    [
      "exerciseLogs/alice-log",
      {
        userId: "alice",
        exerciseId: "squats",
        planGoal: "weight-gain",
        dayId: null,
        sets: 1,
        reps: 10,
        durationSeconds: 0,
        formScore: null,
        completedAt: serverTimestamp(),
      },
    ],
    [
      "runs/alice-run",
      {
        userId: "alice",
        type: "outdoor",
        distanceKm: 1,
        durationSeconds: 600,
        averagePace: 600,
        steps: 1000,
        source: "gps",
        startedAt: Timestamp.fromMillis(1),
        endedAt: Timestamp.fromMillis(2),
        stepSource: "manual",
        distanceSource: "GPS",
      },
    ],
  ];
  for (const [path, value] of cases) {
    await assertSucceeds(setDoc(doc(a, path), value));
    await assertSucceeds(getDoc(doc(a, path)));
    await assertFails(getDoc(doc(b, path)));
    await assertFails(setDoc(doc(b, path), value));
  }
  await assertSucceeds(
    setDoc(doc(a, "users", "alice", "preferences", "challenges"), {
      joined: ["workouts"],
    }),
  );
  await assertFails(
    setDoc(doc(b, "users", "alice", "preferences", "challenges"), {
      joined: ["reps"],
    }),
  );
  await assertFails(getDocs(collection(a, "exerciseLogs")));
  await assertSucceeds(
    getDocs(
      query(collection(a, "exerciseLogs"), where("userId", "==", "alice")),
    ),
  );
  await assertFails(
    updateDoc(doc(a, "exerciseLogs", "alice-log"), { userId: "bravo" }),
  );
  await assertFails(
    setDoc(doc(b, "runs", "forged"), { ...cases[5][1], userId: "alice" }),
  );
  await assertFails(
    setDoc(doc(a, "workoutProgress", "alice"), {
      ...progress(),
      totalReps: -1,
    }),
  );
  await assertFails(
    setDoc(doc(a, "dietPreferences", "alice"), {
      ...cases[2][1],
      allergies: ["unknown"],
    }),
  );
});

test("friend consent gates activity and cannot grant private-profile access", async () => {
  const a = db("alice"),
    b = db("bravo"),
    c = db("charlie");
  await assertSucceeds(
    setDoc(doc(a, "friendActivity", "alice"), {
      activity: {},
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(b, "friendActivity", "alice")));
  const request = {
    from: "alice",
    to: "bravo",
    members: ["alice", "bravo"],
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await assertFails(
    setDoc(doc(a, "friendRequests", "alice_bravo"), {
      ...request,
      status: "accepted",
    }),
  );
  await assertSucceeds(
    setDoc(doc(a, "friendRequests", "alice_bravo"), request),
  );
  await assertFails(
    updateDoc(doc(a, "friendRequests", "alice_bravo"), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(c, "friendRequests", "alice_bravo"), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(c, "friendRequests", "alice_bravo")));
  await assertSucceeds(
    getDocs(
      query(
        collection(b, "friendRequests"),
        where("members", "array-contains", "bravo"),
      ),
    ),
  );
  await assertSucceeds(
    updateDoc(doc(b, "friendRequests", "alice_bravo"), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(getDoc(doc(b, "friendActivity", "alice")));
  await assertFails(getDoc(doc(b, "users", "alice")));
  await assertFails(
    setDoc(doc(b, "friendActivity", "alice"), {
      activity: {},
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(deleteDoc(doc(b, "friendRequests", "alice_bravo")));
  await assertFails(getDoc(doc(b, "friendActivity", "alice")));
});
