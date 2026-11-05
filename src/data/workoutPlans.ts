import type { Exercise } from "@gymsense/core";

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

export const exerciseLibrary: Exercise[] = [
  {
    id: "push-ups",
    name: "Push-ups",
    sets: "3 x 10 reps",
    muscle: "Chest, shoulders, triceps",
    duration: "5 min",
    instructions: [
      "Place hands slightly wider than your shoulders.",
      "Keep your body straight and lower with control.",
      "Push back up; use your knees if needed.",
    ],
  },
  {
    id: "shoulder-press",
    name: "Dumbbell shoulder press",
    sets: "3 x 10 reps",
    muscle: "Shoulders, triceps",
    duration: "6 min",
    instructions: [
      "Sit or stand tall with light dumbbells at shoulder height.",
      "Press overhead without arching your back.",
      "Lower slowly to shoulder height.",
    ],
  },
  {
    id: "triceps-extensions",
    name: "Overhead triceps extensions",
    sets: "3 x 12 reps",
    muscle: "Triceps",
    duration: "5 min",
    instructions: [
      "Hold a light dumbbell overhead with both hands.",
      "Keep elbows pointing forward and lower behind your head.",
      "Extend your elbows with control.",
    ],
  },
  {
    id: "dumbbell-rows",
    name: "Dumbbell rows",
    sets: "3 x 12 reps per side",
    muscle: "Back, biceps",
    duration: "7 min",
    instructions: [
      "Hinge at your hips with a neutral back and knees soft.",
      "Pull one dumbbell toward your hip, keeping your elbow close.",
      "Lower slowly and repeat on both sides.",
    ],
  },
  {
    id: "biceps-curls",
    name: "Biceps curls",
    sets: "3 x 12 reps",
    muscle: "Biceps",
    duration: "5 min",
    instructions: [
      "Stand tall with light dumbbells at your sides.",
      "Bend your elbows without swinging your upper arms.",
      "Lower with control.",
    ],
  },
  {
    id: "reverse-fly",
    name: "Reverse fly",
    sets: "3 x 12 reps",
    muscle: "Upper back, rear shoulders",
    duration: "5 min",
    instructions: [
      "Hinge forward with a neutral back and very light weights.",
      "Raise your arms out to the sides with a slight elbow bend.",
      "Lower gently without shrugging your shoulders.",
    ],
  },
  {
    id: "squats",
    name: "Bodyweight squats",
    sets: "3 x 12 reps",
    muscle: "Quads, glutes",
    duration: "6 min",
    instructions: [
      "Stand with feet shoulder-width apart.",
      "Push hips back and bend your knees with control.",
      "Keep your chest lifted and press through your feet to stand.",
    ],
  },
  {
    id: "lunges",
    name: "Reverse lunges",
    sets: "3 x 12 reps per side",
    muscle: "Legs, glutes, balance",
    duration: "6 min",
    instructions: [
      "Stand tall and step one foot back.",
      "Bend both knees with your front knee aligned over your foot.",
      "Push through the front foot and alternate sides.",
    ],
  },
  {
    id: "plank",
    name: "Forearm plank",
    sets: "3 x 30 sec",
    muscle: "Core, stability",
    duration: "4 min",
    instructions: [
      "Place elbows below your shoulders.",
      "Brace your core and keep your hips level.",
      "Breathe steadily and stop when your form slips.",
    ],
  },
  {
    id: "march-in-place",
    name: "Brisk march in place",
    sets: "3 x 60 sec",
    muscle: "Cardio, legs",
    duration: "5 min",
    instructions: [
      "Stand tall and march at a comfortable pace.",
      "Swing your arms and land softly.",
      "Keep breathing steadily; reduce the pace when needed.",
    ],
  },
  {
    id: "mountain-climbers",
    name: "Mountain climbers",
    sets: "3 x 30 sec",
    muscle: "Core, shoulders, cardio",
    duration: "4 min",
    instructions: [
      "Start in a high plank with hands below your shoulders.",
      "Bring one knee toward your chest at a time.",
      "Keep your hips steady; step slowly for a lower-impact version.",
    ],
  },
  {
    id: "glute-bridge",
    name: "Glute bridges",
    sets: "3 x 15 reps",
    muscle: "Glutes, hamstrings",
    duration: "5 min",
    instructions: [
      "Lie on your back with knees bent and feet flat.",
      "Squeeze your glutes to lift your hips without arching your back.",
      "Lower slowly to the floor.",
    ],
  },
];
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
