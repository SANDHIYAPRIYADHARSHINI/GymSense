import type { Exercise, Goal } from "@gymsense/core";
export const goals: Goal[] = [
  {
    id: "build-muscle",
    title: "Build muscle",
    subtitle: "Get stronger. Feel unstoppable.",
    tag: "STRENGTH",
    icon: "strength",
  },
  {
    id: "lose-weight",
    title: "Lose weight",
    subtitle: "Small steps. Lasting change.",
    tag: "CONDITIONING",
    icon: "flame",
  },
  {
    id: "stay-fit",
    title: "Stay fit",
    subtitle: "Move better, every single day.",
    tag: "EVERYDAY FITNESS",
    icon: "activity",
  },
];
export const exercises: Exercise[] = [
  {
    id: "squats",
    name: "Bodyweight squats",
    sets: "3 � 12 reps",
    muscle: "Quads � Glutes",
    duration: "6 min",
    instructions: [
      "Stand with feet shoulder-width apart.",
      "Push your hips back and bend your knees with control.",
      "Keep your chest lifted, then press through your feet to stand.",
    ],
  },
  {
    id: "push-ups",
    name: "Push-ups",
    sets: "3 � 10 reps",
    muscle: "Chest � Triceps",
    duration: "5 min",
    instructions: [
      "Place hands slightly wider than your shoulders.",
      "Keep a straight line from head to heels.",
      "Lower with control and push back up. Use your knees if needed.",
    ],
  },
  {
    id: "lunges",
    name: "Reverse lunges",
    sets: "3 � 12 reps",
    muscle: "Legs � Balance",
    duration: "6 min",
    instructions: [
      "Stand tall and take one foot back.",
      "Bend both knees, keeping your front knee aligned with your foot.",
      "Push through the front foot and alternate sides.",
    ],
  },
  {
    id: "plank",
    name: "Forearm plank",
    sets: "3 � 30 sec",
    muscle: "Core � Stability",
    duration: "4 min",
    instructions: [
      "Place elbows beneath your shoulders.",
      "Brace your core and keep your hips level.",
      "Breathe steadily; stop the hold if your form slips.",
    ],
  },
];
export const meals = [
  {
    name: "Power breakfast bowl",
    type: "Vegetarian",
    time: "Breakfast",
    cal: 420,
    protein: 24,
    detail: "Greek yogurt, oats, berries & chia",
    emoji: "??",
  },
  {
    name: "Grilled chicken plate",
    type: "High protein",
    time: "Lunch",
    cal: 560,
    protein: 46,
    detail: "Chicken, brown rice & roasted greens",
    emoji: "??",
  },
  {
    name: "Tofu harvest bowl",
    type: "Vegan",
    time: "Dinner",
    cal: 480,
    protein: 28,
    detail: "Crispy tofu, quinoa & seasonal vegetables",
    emoji: "??",
  },
  {
    name: "Paneer grain bowl",
    type: "Vegetarian",
    time: "Lunch",
    cal: 510,
    protein: 32,
    detail: "Paneer, millet, spinach & mint yogurt",
    emoji: "??",
  },
];
