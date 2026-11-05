export type UserActivity = {
  date: string;
  workouts: number;
  reps: number;
  activeMinutes: number;
  runKm: number;
};
export type MockUser = {
  id: string;
  name: string;
  username: string;
  initials: string;
  color: string;
  goal: string;
  goalId: "weight-gain" | "weight-loss" | "custom";
  activity: UserActivity[];
};
// A fixed demo snapshot keeps server/client rendering and examples reproducible.
export const MOCK_TODAY = "2026-11-05";
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
function activityFor(
  seed: number,
  currentStreak: number,
  longest: number,
): UserActivity[] {
  return Array.from({ length: 168 }, (_, index) => {
    const daysAgo = 167 - index;
    const active = (index + seed) % 4 !== 0;
    let on = active;
    if (index >= 50 && index < 50 + longest) on = true;
    if (index === 49 || index === 50 + longest) on = false;
    if (daysAgo < currentStreak) on = true;
    if (daysAgo === currentStreak) on = false;
    if (currentStreak === 0 && daysAgo < 2) on = false;
    const variant = (index * 7 + seed * 11) % 5;
    return {
      date: shiftDate(MOCK_TODAY, -daysAgo),
      workouts: on && variant > 0 && variant % 2 === 0 ? 1 : 0,
      reps: on ? 40 + variant * 35 : 0,
      activeMinutes: on ? 12 + variant * 9 : 0,
      runKm: on && variant === 1 ? Number((1 + seed * 0.4).toFixed(1)) : 0,
    };
  });
}
export const users: MockUser[] = [
  {
    id: "alex",
    name: "Alex Johnson",
    username: "alexj",
    initials: "AJ",
    color: "#ccf66b",
    goal: "Build muscle",
    goalId: "weight-gain",
    activity: activityFor(1, 12, 20),
  },
  {
    id: "maya",
    name: "Maya Chen",
    username: "mayamoves",
    initials: "MC",
    color: "#b9d9ff",
    goal: "Stay consistent",
    goalId: "custom",
    activity: activityFor(2, 7, 16),
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    username: "jordanruns",
    initials: "JL",
    color: "#ffc49c",
    goal: "Lose fat and build endurance",
    goalId: "weight-loss",
    activity: activityFor(3, 4, 18),
  },
  {
    id: "sam",
    name: "Sam Rivera",
    username: "samstrength",
    initials: "SR",
    color: "#c9b7ff",
    goal: "Get stronger",
    goalId: "weight-gain",
    activity: activityFor(4, 0, 14),
  },
  {
    id: "priya",
    name: "Priya Shah",
    username: "priyalifts",
    initials: "PS",
    color: "#a6e9ce",
    goal: "Build muscle",
    goalId: "weight-gain",
    activity: activityFor(5, 15, 25),
  },
  {
    id: "leo",
    name: "Leo Park",
    username: "leopace",
    initials: "LP",
    color: "#f1b8d5",
    goal: "Move every day",
    goalId: "custom",
    activity: activityFor(6, 3, 12),
  },
];
export const currentUser = users[0];
const currentWeek = [
  { workouts: 1, reps: 120, activeMinutes: 35, runKm: 0 },
  { workouts: 1, reps: 130, activeMinutes: 30, runKm: 1.5 },
  { workouts: 0, reps: 0, activeMinutes: 20, runKm: 2 },
  { workouts: 1, reps: 150, activeMinutes: 40, runKm: 0 },
];
for (let index = 0; index < 4; index++)
  Object.assign(currentUser.activity[164 + index], currentWeek[index]);
export const initialFriendIds = ["maya", "jordan"];
export const weeklyChallenges = [
  {
    id: "workouts",
    title: "Complete 3 workouts",
    metric: "workouts",
    target: 3,
    unit: "workouts",
    description: "Three chances to show up for yourself.",
  },
  {
    id: "running",
    title: "Run 5 km",
    metric: "runKm",
    target: 5,
    unit: "km",
    description: "Build your distance, one run at a time.",
  },
  {
    id: "reps",
    title: "Complete 500 reps",
    metric: "reps",
    target: 500,
    unit: "reps",
    description: "Every controlled repetition adds up.",
  },
] as const;
