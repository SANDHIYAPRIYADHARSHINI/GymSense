import { currentUser } from "./users.ts";
import { profileStats } from "../lib/social.ts";
import type { Goal } from "@gymsense/core";
export const workoutGoals = [
  {
    id: "weight-gain",
    title: "Weight Gain",
    subtitle: "Build strength and muscle with a steady, focused routine.",
    tag: "BUILD YOUR STRENGTH",
    icon: "strength",
  },
  {
    id: "weight-loss",
    title: "Weight Loss",
    subtitle: "Get moving with balanced sessions that build consistency.",
    tag: "MOVE WITH PURPOSE",
    icon: "flame",
  },
  {
    id: "custom",
    title: "Custom Plan",
    subtitle: "Build your own three-day routine from the exercise library.",
    tag: "MAKE IT YOURS",
    icon: "custom",
  },
] satisfies Goal[];
const currentStats = profileStats(currentUser);
export const userProgress = {
  user: { firstName: "Alex", name: "Alex Johnson" },
  weeklyStats: {
    periodLabel: "This week",
    workoutsCompleted: currentStats.weekly.workouts,
    activeMinutes: currentStats.weekly.activeMinutes,
    repsCompleted: currentStats.weekly.reps,
    currentStreak: currentStats.currentStreak,
  },
  lastWorkout: {
    planName: "Weight Gain",
    day: 1,
    exerciseId: "triceps-extensions",
    exerciseName: "Overhead triceps extensions",
    completedExercises: 2,
    totalExercises: 3,
    remainingMinutes: 5,
  },
};
