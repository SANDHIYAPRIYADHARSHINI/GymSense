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
    subtitle: "Start with a flexible mix of strength, balance, and core work.",
    tag: "MAKE IT YOURS",
    icon: "custom",
  },
] satisfies Goal[];
export const userProgress = {
  user: { firstName: "Alex", name: "Alex Johnson" },
  weeklyStats: {
    periodLabel: "This week",
    workoutsCompleted: 3,
    activeMinutes: 96,
    repsCompleted: 248,
    currentStreak: 12,
  },
  lastWorkout: {
    planName: "Weight Gain",
    day: 1,
    exerciseId: "lunges",
    exerciseName: "Reverse lunges",
    completedExercises: 2,
    totalExercises: 4,
    remainingMinutes: 10,
  },
};
