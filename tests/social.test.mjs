import { test } from "node:test";
import assert from "node:assert/strict";
import {
  currentUser,
  MOCK_TODAY,
  shiftDate,
  users,
  weeklyChallenges,
} from "../src/data/users.ts";
import {
  activitySummary,
  contributionDays,
  defaultSocialState,
  intensityFor,
  profileStats,
  restoreSocialState,
  searchUsers,
  toggleChallenge,
  toggleFriend,
  weekStart,
} from "../src/lib/social.ts";
import { userProgress } from "../src/data/userProgress.ts";
const day = (date, values = {}) => ({
  date,
  workouts: 0,
  reps: 0,
  activeMinutes: 0,
  runKm: 0,
  ...values,
});
test("mock users have unique usernames, distinct histories and real derived streaks", () => {
  assert.equal(new Set(users.map((user) => user.id)).size, users.length);
  assert.equal(new Set(users.map((user) => user.username)).size, users.length);
  const expected = {
    alex: [12, 20],
    maya: [7, 16],
    jordan: [4, 18],
    sam: [0, 14],
    priya: [15, 25],
    leo: [3, 12],
  };
  for (const user of users) {
    const stats = profileStats(user);
    assert.equal(user.activity.length, 168);
    assert.equal(new Set(user.activity.map((record) => record.date)).size, 168);
    assert.deepEqual(
      [stats.currentStreak, stats.longestStreak],
      expected[user.id],
    );
  }
  assert.notDeepEqual(
    contributionDays(users[0].activity),
    contributionDays(users[1].activity),
  );
});
test("contribution window has exactly 84 chronological dated squares and all intensities", () => {
  const cells = contributionDays(currentUser.activity);
  assert.equal(cells.length, 84);
  assert.equal(cells[0].date, shiftDate(MOCK_TODAY, -83));
  assert.equal(cells[83].date, MOCK_TODAY);
  assert.equal(new Set(cells.map((cell) => cell.date)).size, 84);
  assert.deepEqual(
    new Set(cells.map((cell) => cell.intensity)),
    new Set(["none", "light", "moderate", "strong"]),
  );
  for (let i = 1; i < cells.length; i++)
    assert.equal(cells[i].date, shiftDate(cells[i - 1].date, 1));
  assert.equal(intensityFor(day(MOCK_TODAY)), "none");
  assert.equal(intensityFor(day(MOCK_TODAY, { reps: 20 })), "light");
  assert.equal(intensityFor(day(MOCK_TODAY, { workouts: 1 })), "moderate");
  assert.equal(intensityFor(day(MOCK_TODAY, { activeMinutes: 50 })), "strong");
  assert.ok(activitySummary(day(MOCK_TODAY)).includes("Rest day"));
});
test("streaks handle missing days, yesterday grace, duplicate records and future activity", () => {
  const records = [
    day("2026-11-02", { reps: 20 }),
    day("2026-11-03", { workouts: 1 }),
    day("2026-11-03", { reps: 30 }),
    day("2026-11-04", { activeMinutes: 10 }),
    day("2026-11-06", { reps: 9999 }),
  ];
  const user = { ...currentUser, activity: records };
  const stats = profileStats(user, "2026-11-05");
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.longestStreak, 3);
  assert.equal(stats.totalReps, 50);
  assert.equal(profileStats(user, "2026-11-07").currentStreak, 1);
  assert.equal(
    profileStats(
      {
        ...user,
        activity: records.filter((record) => record.date !== "2026-11-03"),
      },
      "2026-11-05",
    ).currentStreak,
    1,
  );
  const cells = contributionDays(records, "2026-11-05");
  const duplicate = cells.find((cell) => cell.date === "2026-11-03");
  assert.equal(duplicate.reps, 30);
  assert.equal(duplicate.workouts, 1);
  assert.equal(cells[83].intensity, "none");
});
test("weekly challenges use Monday through snapshot totals and agree with dashboard stats", () => {
  assert.equal(weekStart(), "2026-11-02");
  const stats = profileStats(currentUser);
  assert.deepEqual(stats.weekly, {
    workouts: 3,
    reps: 400,
    activeMinutes: 125,
    runKm: 3.5,
  });
  assert.deepEqual(
    weeklyChallenges.map((challenge) => [
      challenge.target,
      stats.weekly[challenge.metric],
    ]),
    [
      [3, 3],
      [5, 3.5],
      [500, 400],
    ],
  );
  assert.equal(
    userProgress.weeklyStats.workoutsCompleted,
    stats.weekly.workouts,
  );
  assert.equal(userProgress.weeklyStats.repsCompleted, stats.weekly.reps);
  assert.equal(userProgress.weeklyStats.currentStreak, stats.currentStreak);
});
test("username search ignores case, whitespace and @ and excludes the current user", () => {
  assert.deepEqual(
    searchUsers(" @MAYAMOVES ", currentUser.id).map((user) => user.id),
    ["maya"],
  );
  assert.deepEqual(
    searchUsers("jordan", currentUser.id).map((user) => user.id),
    ["jordan"],
  );
  assert.equal(searchUsers("not-a-user", currentUser.id).length, 0);
  assert.ok(
    !searchUsers("", currentUser.id).some((user) => user.id === currentUser.id),
  );
});
test("friends can be added and removed without self-adds, duplicates or unknown IDs", () => {
  let state = defaultSocialState();
  state = toggleFriend(state, "sam", currentUser.id);
  assert.ok(state.friendIds.includes("sam"));
  state = toggleFriend(state, "sam", currentUser.id);
  assert.ok(!state.friendIds.includes("sam"));
  assert.equal(toggleFriend(state, "alex", currentUser.id), state);
  assert.equal(toggleFriend(state, "missing", currentUser.id), state);
  const restored = restoreSocialState(
    JSON.stringify({
      version: 1,
      friendIds: ["sam", "sam", "alex", "missing"],
      joinedChallenges: ["reps", "reps", "missing"],
    }),
    currentUser.id,
  );
  assert.deepEqual(restored, {
    friendIds: ["sam"],
    joinedChallenges: ["reps"],
  });
  assert.deepEqual(
    restoreSocialState(
      JSON.stringify({ version: 1, friendIds: [], joinedChallenges: [] }),
      currentUser.id,
    ),
    { friendIds: [], joinedChallenges: [] },
  );
});
test("challenge membership and friendship persist without changing activity progress", () => {
  const before = profileStats(currentUser);
  let state = toggleChallenge(defaultSocialState(), "reps");
  assert.ok(state.joinedChallenges.includes("reps"));
  const restored = restoreSocialState(
    JSON.stringify({ version: 1, ...state }),
    currentUser.id,
  );
  assert.deepEqual(restored, state);
  state = toggleChallenge(state, "reps");
  assert.ok(!state.joinedChallenges.includes("reps"));
  assert.deepEqual(profileStats(currentUser), before);
  for (const raw of [null, "broken", "null", '{"version":2}'])
    assert.deepEqual(
      restoreSocialState(raw, currentUser.id),
      defaultSocialState(),
    );
});
