export type PlanExercise = {
  exerciseId: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds: number;
};
export type WorkoutDay = {
  day: number;
  title: string;
  focusMuscles: string[];
  estimatedMinutes: number;
  exercises: PlanExercise[];
};
export type WorkoutPlan = {
  id: string;
  title: string;
  description: string;
  editable: boolean;
  days: WorkoutDay[];
};

const reps = (
  exerciseId: string,
  sets: number,
  count: number,
  restSeconds: number,
): PlanExercise => ({ exerciseId, sets, reps: count, restSeconds });
const timed = (
  exerciseId: string,
  sets: number,
  durationSeconds: number,
  restSeconds: number,
): PlanExercise => ({ exerciseId, sets, durationSeconds, restSeconds });
export const workoutPlans: WorkoutPlan[] = [
  {
    id: "weight-gain",
    title: "Weight Gain",
    description:
      "Three focused strength sessions. Use comfortable weights and recover between days.",
    editable: false,
    days: [
      {
        day: 1,
        title: "Push",
        focusMuscles: ["Chest", "Shoulders", "Triceps"],
        estimatedMinutes: 30,
        exercises: [
          reps("push-ups", 3, 10, 60),
          reps("shoulder-press", 3, 10, 75),
          reps("triceps-extensions", 3, 12, 60),
        ],
      },
      {
        day: 2,
        title: "Pull",
        focusMuscles: ["Back", "Biceps"],
        estimatedMinutes: 30,
        exercises: [
          reps("dumbbell-rows", 3, 12, 75),
          reps("biceps-curls", 3, 12, 60),
          reps("reverse-fly", 3, 12, 60),
        ],
      },
      {
        day: 3,
        title: "Legs and core",
        focusMuscles: ["Quads", "Glutes", "Hamstrings", "Core"],
        estimatedMinutes: 35,
        exercises: [
          reps("squats", 3, 12, 75),
          reps("lunges", 3, 12, 60),
          reps("glute-bridge", 3, 15, 60),
          timed("plank", 3, 30, 45),
        ],
      },
    ],
  },
  {
    id: "weight-loss",
    title: "Weight Loss",
    description:
      "Balanced circuits and cardio sessions to build consistency. Work at a pace that suits you.",
    editable: false,
    days: [
      {
        day: 1,
        title: "Full-body circuit",
        focusMuscles: ["Chest", "Legs", "Core"],
        estimatedMinutes: 25,
        exercises: [
          reps("squats", 3, 12, 30),
          reps("push-ups", 3, 8, 30),
          timed("march-in-place", 3, 60, 30),
          timed("plank", 3, 20, 45),
        ],
      },
      {
        day: 2,
        title: "Cardio and core",
        focusMuscles: ["Cardiovascular endurance", "Core", "Shoulders"],
        estimatedMinutes: 25,
        exercises: [
          timed("march-in-place", 4, 90, 30),
          timed("mountain-climbers", 3, 30, 45),
          timed("plank", 3, 30, 45),
        ],
      },
      {
        day: 3,
        title: "Lower body and conditioning",
        focusMuscles: [
          "Quads",
          "Glutes",
          "Hamstrings",
          "Cardiovascular endurance",
        ],
        estimatedMinutes: 30,
        exercises: [
          reps("lunges", 3, 10, 45),
          reps("glute-bridge", 3, 15, 30),
          reps("squats", 3, 15, 45),
          timed("march-in-place", 3, 90, 30),
        ],
      },
    ],
  },
  {
    id: "custom",
    title: "Custom Plan",
    description:
      "Build each routine from the exercise library. Complete your days in order.",
    editable: true,
    days: [1, 2, 3].map((day) => ({
      day,
      title: `Your Day ${day} routine`,
      focusMuscles: [],
      estimatedMinutes: 0,
      exercises: [],
    })),
  },
];
export const planAliases: Record<string, string> = {
  "build-muscle": "weight-gain",
  "lose-weight": "weight-loss",
  "stay-fit": "custom",
};
export function findWorkoutPlan(goal: string) {
  return workoutPlans.find((plan) => plan.id === (planAliases[goal] ?? goal));
}
