import type { Timestamp } from "firebase/firestore";
import type { PlanProgress } from "@/lib/workoutProgress";
import type { UserActivity } from "@/data/users";
import type { DietPreferences } from "@/lib/diet";
export type Goal = "weight-gain" | "weight-loss" | "custom";
export type PublicProfile = {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  goal: Goal;
};
export type UserProfile = PublicProfile & {
  email: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
export type WorkoutProgress = {
  currentPlanGoal: Goal;
  completedDays: string[];
  completedExercises: Record<string, { dayId: string; completedAt: string }>;
  plans: Partial<Record<Goal, PlanProgress>>;
  activity: Record<string, UserActivity>;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalReps: number;
  totalActiveMinutes: number;
  updatedAt?: Timestamp;
};
export type ExerciseLog = {
  userId: string;
  exerciseId: string;
  planGoal: Goal;
  dayId: string | null;
  sets: number;
  reps: number;
  durationSeconds: number;
  formScore: number | null;
  completedAt: Timestamp;
};
export type DietDocument = Omit<DietPreferences, "meals"> & {
  mealsPerDay: 3 | 4;
  updatedAt: Timestamp;
};
export type RunDocument = {
  userId: string;
  type: "outdoor" | "treadmill";
  distanceKm: number;
  durationSeconds: number;
  averagePace: number | null;
  steps: number;
  source: "gps" | "bluetooth" | "manual";
  startedAt: Timestamp;
  endedAt: Timestamp;
  stepSource: string;
  distanceSource: string;
};
export type FriendRequest = {
  id: string;
  from: string;
  to: string;
  members: string[];
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
export const emptyWorkoutProgress = (): WorkoutProgress => ({
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
});
