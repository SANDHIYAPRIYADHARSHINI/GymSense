import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  Timestamp,
  query,
  where,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { firebaseClient, requireOnline } from "../firebase";
import {
  emptyWorkoutProgress,
  type ExerciseLog,
  type RunDocument,
  type WorkoutProgress,
  type DietDocument,
} from "./types";
import { writeProgress } from "./workouts";
import { applyActivity, todayUTC } from "./streaks";
import type { SavedRun } from "../run/storage";
import {
  restorePreferences,
  serializePreferences,
  type DietPreferences,
  type DailyTrackers,
} from "../diet";
export function watchExerciseLogs(
  uid: string,
  next: (logs: (ExerciseLog & { id: string })[]) => void,
  error: (e: Error) => void,
) {
  return onSnapshot(
    query(
      collection(firebaseClient().db, "exerciseLogs"),
      where("userId", "==", uid),
    ),
    (s) =>
      next(
        s.docs
          .map(
            (d) => ({ ...d.data(), id: d.id }) as ExerciseLog & { id: string },
          )
          .sort(
            (a, b) =>
              (b.completedAt?.toMillis() ?? 0) -
              (a.completedAt?.toMillis() ?? 0),
          ),
      ),
    error,
  );
}
export async function saveExerciseLog(
  uid: string,
  id: string,
  input: Omit<ExerciseLog, "userId" | "completedAt">,
) {
  requireOnline();
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const logRef = doc(db, "exerciseLogs", id),
      pRef = doc(db, "workoutProgress", uid);
    const [log, p] = await Promise.all([tx.get(logRef), tx.get(pRef)]);
    if (log.exists()) return;
    const progress = p.exists()
      ? (p.data() as WorkoutProgress)
      : emptyWorkoutProgress();
    tx.set(logRef, { ...input, userId: uid, completedAt: serverTimestamp() });
    writeProgress(
      tx,
      db,
      uid,
      applyActivity(progress, todayUTC(), {
        reps: input.reps,
        activeMinutes: input.durationSeconds / 60,
      }),
    );
  });
}
export async function removeExerciseLog(uid: string, id: string) {
  requireOnline();
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "exerciseLogs", id),
      pRef = doc(db, "workoutProgress", uid);
    const [log, p] = await Promise.all([tx.get(ref), tx.get(pRef)]);
    if (!log.exists()) return;
    const data = log.data() as ExerciseLog;
    if (data.userId !== uid) throw new Error("Not your exercise log.");
    tx.delete(ref);
    writeProgress(
      tx,
      db,
      uid,
      applyActivity(
        p.exists() ? (p.data() as WorkoutProgress) : emptyWorkoutProgress(),
        data.completedAt.toDate().toISOString().slice(0, 10),
        { reps: -data.reps, activeMinutes: -data.durationSeconds / 60 },
      ),
    );
  });
}
export async function saveRun(uid: string, run: SavedRun) {
  requireOnline();
  const { db } = firebaseClient();
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "runs", `${uid}_${run.id}`),
      pRef = doc(db, "workoutProgress", uid);
    const [existing, p] = await Promise.all([tx.get(ref), tx.get(pRef)]);
    if (existing.exists()) return;
    const data: RunDocument = {
      userId: uid,
      type: run.mode === "outdoor" ? "outdoor" : "treadmill",
      source:
        run.mode === "outdoor"
          ? "gps"
          : run.mode === "ftms"
            ? "bluetooth"
            : "manual",
      distanceKm: run.distanceMeters / 1000,
      durationSeconds: run.durationSeconds,
      averagePace: run.averagePaceSeconds,
      steps: run.steps,
      startedAt: Timestamp.fromDate(new Date(run.startedAt)),
      endedAt: Timestamp.fromDate(new Date(run.endedAt)),
      stepSource: run.stepSource,
      distanceSource: run.distanceSource,
    };
    tx.set(ref, data);
    writeProgress(
      tx,
      db,
      uid,
      applyActivity(
        p.exists() ? (p.data() as WorkoutProgress) : emptyWorkoutProgress(),
        run.endedAt.slice(0, 10),
        { activeMinutes: run.durationSeconds / 60, runKm: data.distanceKm },
      ),
    );
  });
}
export function watchRuns(
  uid: string,
  next: (runs: SavedRun[]) => void,
  error: (e: Error) => void,
) {
  return onSnapshot(
    query(collection(firebaseClient().db, "runs"), where("userId", "==", uid)),
    (s) =>
      next(
        s.docs
          .map((doc) => {
            const d = doc.data() as RunDocument;
            return {
              id: doc.id,
              mode:
                d.source === "gps"
                  ? "outdoor"
                  : d.source === "bluetooth"
                    ? "ftms"
                    : "manual",
              distanceMeters: d.distanceKm * 1000,
              durationSeconds: d.durationSeconds,
              averagePaceSeconds: d.averagePace,
              steps: d.steps,
              stepSource: d.stepSource as SavedRun["stepSource"],
              distanceSource: d.distanceSource,
              startedAt: d.startedAt.toDate().toISOString(),
              endedAt: d.endedAt.toDate().toISOString(),
            } satisfies SavedRun;
          })
          .sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
      ),
    error,
  );
}
export function watchDiet(
  uid: string,
  next: (p: DietPreferences) => void,
  error: (e: Error) => void,
) {
  return onSnapshot(
    doc(firebaseClient().db, "dietPreferences", uid),
    (s) => {
      const d = s.data() as DietDocument | undefined;
      next(
        restorePreferences(
          d
            ? serializePreferences({
                ...d,
                meals: d.mealsPerDay === 3 ? "3 meals" : "3 meals plus snacks",
              })
            : null,
        ),
      );
    },
    error,
  );
}
export async function saveDiet(uid: string, p: DietPreferences) {
  requireOnline();
  const { meals, ...rest } = p;
  await setDoc(doc(firebaseClient().db, "dietPreferences", uid), {
    ...rest,
    mealsPerDay: meals === "3 meals" ? 3 : 4,
    updatedAt: serverTimestamp(),
  });
}
export async function getIntake(uid: string, date: string) {
  const s = await getDoc(
    doc(firebaseClient().db, "users", uid, "intake", date),
  );
  return s.exists() ? (s.data() as DailyTrackers) : null;
}
export async function saveIntake(
  uid: string,
  date: string,
  value: DailyTrackers,
) {
  requireOnline();
  await setDoc(doc(firebaseClient().db, "users", uid, "intake", date), value);
}
