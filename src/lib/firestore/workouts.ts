import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type Transaction,
  type Firestore,
} from "firebase/firestore";
import { firebaseClient, requireOnline } from "../firebase";
import { restoreProgress, getDay, type PlanProgress } from "../workoutProgress";
import type { WorkoutPlan } from "@/data/workoutPlans";
import { exercises } from "@/data/exercises";
import { emptyWorkoutProgress, type Goal, type WorkoutProgress } from "./types";
import { applyActivity, todayUTC } from "./streaks";
export function writeProgress(
  tx: Transaction,
  db: Firestore,
  uid: string,
  progress: WorkoutProgress,
) {
  tx.set(doc(db, "workoutProgress", uid), {
    ...progress,
    updatedAt: serverTimestamp(),
  });
  tx.set(doc(db, "friendActivity", uid), {
    activity: progress.activity,
    updatedAt: serverTimestamp(),
  });
}
export async function getWorkoutProgress(uid: string) {
  const s = await getDoc(doc(firebaseClient().db, "workoutProgress", uid));
  return s.exists() ? (s.data() as WorkoutProgress) : emptyWorkoutProgress();
}
export async function getWorkoutPlan(uid: string, goal: Goal) {
  const s = await getDoc(
    doc(firebaseClient().db, "workoutPlans", uid, "plans", goal),
  );
  return s.exists() ? (s.data() as WorkoutPlan) : null;
}
export async function mutatePlan(
  uid: string,
  plan: WorkoutPlan,
  change: (p: PlanProgress) => PlanProgress,
) {
  requireOnline();
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "workoutProgress", uid),
      snap = await tx.get(ref);
    let progress = snap.exists()
      ? (snap.data() as WorkoutProgress)
      : emptyWorkoutProgress();
    const goal = plan.id as Goal;
    const previous = restoreProgress(
      JSON.stringify(progress.plans[goal] ?? null),
      plan,
      new Set(exercises.map((e) => e.id)),
    );
    const next = change(previous);
    progress = {
      ...progress,
      currentPlanGoal: goal,
      plans: { ...progress.plans, [goal]: next },
    };
    progress.completedDays = Object.entries(progress.plans).flatMap(([g, p]) =>
      p!.completedDays.map((d) => `${g}-day-${d}`),
    );
    progress.completedExercises = {};
    for (const [savedGoal, saved] of Object.entries(progress.plans)) {
      for (const [day, ids] of Object.entries(saved!.completedExercises)) {
        for (const id of ids)
          progress.completedExercises[id] = {
            dayId: savedGoal + "-day-" + day,
            completedAt: new Date().toISOString(),
          };
      }
    }
    const addedDays = next.completedDays.filter(
      (d) => !previous.completedDays.includes(d),
    ).length;
    if (addedDays)
      progress = applyActivity(progress, todayUTC(), { workouts: addedDays });
    writeProgress(tx, db, uid, progress);
    tx.set(doc(db, "workoutPlans", uid, "plans", goal), {
      ...plan,
      days: plan.days.map((d) => getDay(plan, next, d.day)),
    });
  });
}
