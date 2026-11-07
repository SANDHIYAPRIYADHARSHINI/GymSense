import { Timestamp } from "firebase/firestore";
import { users, currentUser, MOCK_TODAY, shiftDate } from "@/data/users";
import type { UserActivity } from "@/data/users";
import { workoutPlans, type WorkoutPlan } from "@/data/workoutPlans";
import { exercises } from "@/data/exercises";
import {
  restoreProgress,
  getDay,
  type PlanProgress,
} from "@/lib/workoutProgress";
import {
  defaultPreferences,
  type DietPreferences,
  type DailyTrackers,
} from "@/lib/diet";
import {
  emptyWorkoutProgress,
  type UserProfile,
  type PublicProfile,
  type WorkoutProgress,
  type ExerciseLog,
  type FriendRequest,
} from "@/lib/firestore/types";
import { applyActivity, todayUTC } from "@/lib/firestore/streaks";
import type { SavedRun } from "@/lib/run/storage";
export const DEMO_UID = "gymsense-demo-user";
export const DEMO_MODE_KEY = "gymsense:mode:v1";
const DATA_KEY = "gymsense:demo:v1";
export const DEMO_USER = { uid: DEMO_UID, email: "demo@example.test" };
type DemoState = {
  version: 1;
  profile: UserProfile;
  progress: WorkoutProgress;
  diet: DietPreferences;
  intake: Record<string, DailyTrackers>;
  runs: SavedRun[];
  logs: (ExerciseLog & { id: string })[];
  requests: FriendRequest[];
  challenges: string[];
};
let enabled = false;
let state: DemoState | null = null;
let storageWarning = false;
const listeners = new Set<() => void>();
export function setDemoSession(value: boolean) {
  enabled = value;
  if (!value) state = null;
}
export function isDemoSession(uid?: string) {
  return (
    enabled &&
    (uid === undefined || uid === DEMO_UID || uid.startsWith("demo-"))
  );
}
export function demoPreference() {
  try {
    return sessionStorage.getItem(DEMO_MODE_KEY);
  } catch {
    return null;
  }
}
export function saveDemoPreference(mode: "demo" | "firebase") {
  try {
    sessionStorage.setItem(DEMO_MODE_KEY, mode);
  } catch {
    /* The mode still works in memory when storage is blocked. */
  }
}
function activityFor(id: string): UserActivity[] {
  const source = users.find((u) => u.id === id) ?? currentUser;
  const offset = Math.round(
    (Date.parse(todayUTC()) - Date.parse(MOCK_TODAY)) / 86400000,
  );
  return source.activity.map((day) => ({
    ...day,
    date: shiftDate(day.date, offset),
  }));
}
export function demoPublicProfiles(): PublicProfile[] {
  return users
    .filter((u) => u.id !== currentUser.id)
    .map((u) => ({
      uid: "demo-" + u.id,
      username: u.username,
      displayName: u.name,
      photoURL: null,
      goal: u.goalId,
    }));
}
function initialState(): DemoState {
  const now = Timestamp.now();
  const progress = emptyWorkoutProgress();
  for (const day of activityFor(currentUser.id))
    progress.activity[day.date] = { ...day };
  const summary = applyActivity(progress, todayUTC(), {});
  return {
    version: 1,
    profile: {
      ...DEMO_USER,
      username: "alexj_demo",
      displayName: "Alex Johnson",
      photoURL: null,
      goal: "weight-gain",
      fitnessLevel: "beginner",
      createdAt: now,
      updatedAt: now,
    },
    progress: summary,
    diet: { ...defaultPreferences, allergies: [] },
    intake: {},
    runs: [],
    logs: [],
    challenges: ["workouts"],
    requests: [
      {
        id: DEMO_UID + "_demo-maya",
        from: DEMO_UID,
        to: "demo-maya",
        members: [DEMO_UID, "demo-maya"],
        status: "accepted",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "demo-jordan_" + DEMO_UID,
        from: "demo-jordan",
        to: DEMO_UID,
        members: ["demo-jordan", DEMO_UID],
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}
function revive(_key: string, value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    "nanoseconds" in value
  ) {
    const v = value as { seconds: unknown; nanoseconds: unknown };
    if (typeof v.seconds === "number" && typeof v.nanoseconds === "number")
      return new Timestamp(v.seconds, v.nanoseconds);
  }
  return value;
}
export function demoSnapshot(): DemoState {
  if (!state) {
    try {
      const saved = sessionStorage.getItem(DATA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved, revive) as DemoState;
        if (
          parsed.version === 1 &&
          parsed.profile?.uid === DEMO_UID &&
          parsed.progress?.plans &&
          parsed.progress?.activity &&
          Array.isArray(parsed.runs) &&
          Array.isArray(parsed.logs) &&
          Array.isArray(parsed.requests) &&
          Array.isArray(parsed.challenges) &&
          parsed.diet &&
          parsed.intake
        )
          state = parsed;
      }
    } catch {
      storageWarning = true;
    }
    state ??= initialState();
  }
  return state;
}
export function demoStorageWarning() {
  return storageWarning;
}
function publish() {
  try {
    sessionStorage.setItem(DATA_KEY, JSON.stringify(demoSnapshot()));
    storageWarning = false;
  } catch {
    storageWarning = true;
  }
  for (const listener of listeners) listener();
}
export function watchDemo(next: () => void) {
  let active = true;
  const listener = () => {
    if (active) next();
  };
  listeners.add(listener);
  queueMicrotask(listener);
  return () => {
    active = false;
    listeners.delete(listener);
  };
}
export function resetDemo() {
  state = initialState();
  publish();
}
export function demoProfile(uid: string): PublicProfile | null {
  if (uid === DEMO_UID) {
    const { uid, username, displayName, photoURL, goal } =
      demoSnapshot().profile;
    return { uid, username, displayName, photoURL, goal };
  }
  return demoPublicProfiles().find((p) => p.uid === uid) ?? null;
}
export function updateDemoProfile(
  changes: Pick<UserProfile, "displayName" | "goal" | "fitnessLevel">,
) {
  if (!changes.displayName.trim()) throw new Error("Enter a display name.");
  demoSnapshot().profile = {
    ...demoSnapshot().profile,
    ...changes,
    updatedAt: Timestamp.now(),
  };
  publish();
}
export function mutateDemoPlan(
  plan: WorkoutPlan,
  change: (p: PlanProgress) => PlanProgress,
) {
  const data = demoSnapshot(),
    goal = plan.id as keyof WorkoutProgress["plans"];
  const previous = restoreProgress(
    JSON.stringify(data.progress.plans[goal] ?? null),
    plan,
    new Set(exercises.map((e) => e.id)),
  );
  const next = change(previous);
  let progress = {
    ...data.progress,
    currentPlanGoal: goal,
    plans: { ...data.progress.plans, [goal]: next },
  };
  progress.completedDays = Object.entries(progress.plans).flatMap(([g, p]) =>
    p!.completedDays.map((d) => `${g}-day-${d}`),
  );
  progress.completedExercises = {};
  for (const [g, p] of Object.entries(progress.plans))
    for (const [day, ids] of Object.entries(p!.completedExercises))
      for (const id of ids)
        progress.completedExercises[id] = {
          dayId: `${g}-day-${day}`,
          completedAt: new Date().toISOString(),
        };
  const added = next.completedDays.filter(
    (d) => !previous.completedDays.includes(d),
  ).length;
  if (added)
    progress = applyActivity(progress, todayUTC(), { workouts: added });
  data.progress = progress;
  publish();
}
export function demoPlan(goal: string) {
  const plan = workoutPlans.find((p) => p.id === goal);
  if (!plan) return null;
  const progress =
    demoSnapshot().progress.plans[goal as keyof WorkoutProgress["plans"]];
  return progress
    ? { ...plan, days: plan.days.map((d) => getDay(plan, progress, d.day)) }
    : plan;
}
export function saveDemoLog(
  id: string,
  input: Omit<ExerciseLog, "userId" | "completedAt">,
) {
  const data = demoSnapshot();
  if (data.logs.some((l) => l.id === id)) return;
  data.logs.unshift({
    ...input,
    id,
    userId: DEMO_UID,
    completedAt: Timestamp.now(),
  });
  data.progress = applyActivity(data.progress, todayUTC(), {
    reps: input.reps,
    activeMinutes: input.durationSeconds / 60,
  });
  publish();
}
export function removeDemoLog(id: string) {
  const data = demoSnapshot(),
    log = data.logs.find((l) => l.id === id);
  if (!log) return;
  data.logs = data.logs.filter((l) => l.id !== id);
  data.progress = applyActivity(
    data.progress,
    log.completedAt.toDate().toISOString().slice(0, 10),
    { reps: -log.reps, activeMinutes: -log.durationSeconds / 60 },
  );
  publish();
}
export function saveDemoRun(run: SavedRun) {
  const data = demoSnapshot();
  if (data.runs.some((r) => r.id === run.id)) return;
  data.runs.unshift(run);
  data.progress = applyActivity(data.progress, run.endedAt.slice(0, 10), {
    activeMinutes: run.durationSeconds / 60,
    runKm: run.distanceMeters / 1000,
  });
  publish();
}
export function saveDemoDiet(p: DietPreferences) {
  demoSnapshot().diet = p;
  publish();
}
export function saveDemoIntake(date: string, value: DailyTrackers) {
  demoSnapshot().intake[date] = value;
  publish();
}
export function saveDemoChallenges(joined: string[]) {
  demoSnapshot().challenges = joined;
  publish();
}
export function sendDemoRequest(to: string) {
  const data = demoSnapshot();
  if (!demoProfile(to) || to === DEMO_UID)
    throw new Error("Choose a sample member.");
  if (
    data.requests.some((r) => r.members.includes(to) && r.status !== "rejected")
  )
    throw new Error("A request or friendship already exists.");
  const now = Timestamp.now(),
    id = DEMO_UID + "_" + to;
  data.requests = data.requests.filter((r) => r.id !== id);
  data.requests.push({
    id,
    from: DEMO_UID,
    to,
    members: [DEMO_UID, to],
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  publish();
}
export function respondDemoRequest(
  id: string,
  status: "accepted" | "rejected",
) {
  const request = demoSnapshot().requests.find((r) => r.id === id);
  if (!request || request.to !== DEMO_UID || request.status !== "pending")
    throw new Error("Only incoming pending requests can be answered.");
  request.status = status;
  request.updatedAt = Timestamp.now();
  publish();
}
export function removeDemoRequest(id: string) {
  demoSnapshot().requests = demoSnapshot().requests.filter((r) => r.id !== id);
  publish();
}
export function demoFriendActivity(uid: string) {
  if (uid === DEMO_UID) return Object.values(demoSnapshot().progress.activity);
  if (
    !demoSnapshot().requests.some(
      (r) => r.members.includes(uid) && r.status === "accepted",
    )
  )
    throw new Error("Accept a sample friend request to view activity.");
  return activityFor(uid.replace(/^demo-/, ""));
}
