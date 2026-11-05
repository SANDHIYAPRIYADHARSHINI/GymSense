import {
  initialFriendIds,
  MOCK_TODAY,
  shiftDate,
  users,
  weeklyChallenges,
  type MockUser,
  type UserActivity,
} from "../data/users.ts";
export type Intensity = "none" | "light" | "moderate" | "strong";
const emptyDay = (date: string): UserActivity => ({
  date,
  workouts: 0,
  reps: 0,
  activeMinutes: 0,
  runKm: 0,
});
export function isActive(day: UserActivity) {
  return (
    day.workouts > 0 || day.reps > 0 || day.activeMinutes > 0 || day.runKm > 0
  );
}
export function intensityFor(day: UserActivity): Intensity {
  return day.workouts >= 2 || day.reps >= 150 || day.activeMinutes >= 45
    ? "strong"
    : day.workouts >= 1 || day.reps >= 60 || day.activeMinutes >= 20
      ? "moderate"
      : isActive(day)
        ? "light"
        : "none";
}
export function aggregateActivity(activity: UserActivity[]) {
  const byDate = new Map<string, UserActivity>();
  for (const item of activity) {
    const day = byDate.get(item.date) ?? emptyDay(item.date);
    for (const key of ["workouts", "reps", "activeMinutes", "runKm"] as const)
      day[key] += item[key];
    byDate.set(item.date, day);
  }
  return byDate;
}
export function contributionDays(
  activity: UserActivity[],
  endDate = MOCK_TODAY,
) {
  const aggregated = aggregateActivity(activity);
  return Array.from({ length: 84 }, (_, index) => {
    const date = shiftDate(endDate, index - 83);
    const activity = aggregated.get(date) ?? emptyDay(date);
    return { ...activity, intensity: intensityFor(activity) };
  });
}
export function activitySummary(day: UserActivity) {
  return isActive(day)
    ? `${day.workouts} workout${day.workouts === 1 ? "" : "s"}, ${day.reps} reps, ${day.activeMinutes} active minutes${day.runKm ? `, ${Number(day.runKm.toFixed(2))} km run` : ""}`
    : "Rest day — no activity recorded";
}
const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function displayDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}
export function weekStart(date = MOCK_TODAY) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return shiftDate(date, -((weekday + 6) % 7));
}
export function profileStats(user: MockUser, endDate = MOCK_TODAY) {
  const aggregated = aggregateActivity(user.activity);
  const ordered = [...aggregated.values()]
    .filter((day) => day.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
  let longestStreak = 0,
    run = 0,
    previous = "";
  for (const day of ordered) {
    if (isActive(day)) {
      run = previous === shiftDate(day.date, -1) ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
      previous = day.date;
    } else {
      run = 0;
      previous = "";
    }
  }
  let cursor = isActive(aggregated.get(endDate) ?? emptyDay(endDate))
    ? endDate
    : shiftDate(endDate, -1);
  let currentStreak = 0;
  while (aggregated.has(cursor) && isActive(aggregated.get(cursor)!)) {
    currentStreak++;
    cursor = shiftDate(cursor, -1);
  }
  const start = weekStart(endDate);
  const weekly = ordered
    .filter((day) => day.date >= start)
    .reduce(
      (total, day) => ({
        workouts: total.workouts + day.workouts,
        reps: total.reps + day.reps,
        activeMinutes: total.activeMinutes + day.activeMinutes,
        runKm: Math.round((total.runKm + day.runKm) * 100) / 100,
      }),
      { workouts: 0, reps: 0, activeMinutes: 0, runKm: 0 },
    );
  return {
    currentStreak,
    longestStreak,
    weekly,
    totalReps: ordered.reduce((sum, day) => sum + day.reps, 0),
    totalActiveMinutes: ordered.reduce(
      (sum, day) => sum + day.activeMinutes,
      0,
    ),
    totalWorkouts: ordered.reduce((sum, day) => sum + day.workouts, 0),
  };
}
export function searchUsers(query: string, currentId: string) {
  const normalized = query.trim().replace(/^@/, "").toLowerCase();
  return users.filter(
    (user) =>
      user.id !== currentId && user.username.toLowerCase().includes(normalized),
  );
}
export const SOCIAL_STORAGE_KEY = "gymsense:social:v1";
export type SocialState = { friendIds: string[]; joinedChallenges: string[] };
export function defaultSocialState(): SocialState {
  return { friendIds: [...initialFriendIds], joinedChallenges: ["workouts"] };
}
export function restoreSocialState(
  raw: string | null,
  currentId: string,
): SocialState {
  try {
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (
      !saved ||
      typeof saved !== "object" ||
      !("version" in saved) ||
      saved.version !== 1
    )
      return defaultSocialState();
    const data = saved as Record<string, unknown>;
    return {
      friendIds: Array.isArray(data.friendIds)
        ? users
            .filter(
              (user) =>
                user.id !== currentId &&
                (data.friendIds as unknown[]).includes(user.id),
            )
            .map((user) => user.id)
        : [...initialFriendIds],
      joinedChallenges: Array.isArray(data.joinedChallenges)
        ? weeklyChallenges
            .filter((challenge) =>
              (data.joinedChallenges as unknown[]).includes(challenge.id),
            )
            .map((challenge) => challenge.id)
        : ["workouts"],
    };
  } catch {
    return defaultSocialState();
  }
}
export function toggleFriend(
  state: SocialState,
  targetId: string,
  currentId: string,
): SocialState {
  if (targetId === currentId || !users.some((user) => user.id === targetId))
    return state;
  return {
    ...state,
    friendIds: state.friendIds.includes(targetId)
      ? state.friendIds.filter((id) => id !== targetId)
      : [...state.friendIds, targetId],
  };
}
export function toggleChallenge(state: SocialState, id: string): SocialState {
  if (!weeklyChallenges.some((challenge) => challenge.id === id)) return state;
  return {
    ...state,
    joinedChallenges: state.joinedChallenges.includes(id)
      ? state.joinedChallenges.filter((item) => item !== id)
      : [...state.joinedChallenges, id],
  };
}
