import type { WorkoutProgress, PublicProfile } from "./types";
import type { MockUser, UserActivity } from "@/data/users";
import { profileStats } from "../social";
export const todayUTC = () => new Date().toISOString().slice(0, 10);
// Shared activity is user-authored. Ignore malformed rows before rendering another user's graph.
export function validActivity(rows: unknown[]): UserActivity[] {
  return rows.filter((value): value is UserActivity => {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date))
      return false;
    const time = Date.parse(row.date + "T00:00:00Z");
    if (
      !Number.isFinite(time) ||
      new Date(time).toISOString().slice(0, 10) !== row.date
    )
      return false;
    return ["workouts", "reps", "activeMinutes", "runKm"].every(
      (key) =>
        typeof row[key] === "number" &&
        Number.isFinite(row[key]) &&
        row[key] >= 0 &&
        row[key] <= 1e9,
    );
  });
}
export function profileView(
  profile: PublicProfile,
  activity: UserActivity[] = [],
): MockUser {
  return {
    id: profile.uid,
    name: profile.displayName,
    username: profile.username,
    initials: profile.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase(),
    color: "#ccf66b",
    goal: {
      "weight-gain": "Weight Gain",
      "weight-loss": "Weight Loss",
      custom: "Custom Plan",
    }[profile.goal],
    goalId: profile.goal,
    activity: validActivity(activity),
  };
}
export function applyActivity(
  progress: WorkoutProgress,
  date: string,
  delta: Partial<Omit<UserActivity, "date">>,
) {
  const prev = progress.activity[date] ?? {
    date,
    workouts: 0,
    reps: 0,
    activeMinutes: 0,
    runKm: 0,
  };
  const day = { ...prev };
  for (const key of ["workouts", "reps", "activeMinutes", "runKm"] as const)
    day[key] = Math.max(
      0,
      Math.round((day[key] + (delta[key] ?? 0)) * 100) / 100,
    );
  const activity = { ...progress.activity, [date]: day };
  const stats = profileStats(
    { activity: Object.values(activity) } as MockUser,
    todayUTC(),
  );
  return {
    ...progress,
    activity,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastWorkoutDate:
      Object.values(activity)
        .filter((d) => d.workouts > 0)
        .map((d) => d.date)
        .sort()
        .at(-1) ?? null,
    totalReps: stats.totalReps,
    totalActiveMinutes: stats.totalActiveMinutes,
  };
}
