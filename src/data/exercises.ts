import { exerciseVideos, type ExerciseVideo } from "./exerciseVideos.ts";
import { demoAssets } from "./animationAssets.ts";
export type MuscleGroup =
  | "Chest"
  | "Shoulders"
  | "Triceps"
  | "Back"
  | "Biceps"
  | "Forearms"
  | "Quads"
  | "Glutes"
  | "Hamstrings"
  | "Calves"
  | "Core"
  | "Cardio";
export type Equipment =
  "Bodyweight" | "Dumbbells" | "Resistance band" | "Bench";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
// Index values follow the official MediaPipe Pose Landmarker model.
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
export const poseLandmarks = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
} as const;
export type PoseLandmark = keyof typeof poseLandmarks;
export type CoachMessage =
  | "Go a little slower"
  | "Control the movement"
  | "Keep your back straighter"
  | "Lower your hips a bit"
  | "Great rep!"
  | "Pause at the bottom";
export type FormRule = {
  id: string;
  message: CoachMessage;
  priority: number;
  when: "always" | "Up" | "Down";
  points: [PoseLandmark, PoseLandmark, PoseLandmark];
} & (
  | { kind: "angle"; minDegrees: number; maxDegrees: number }
  | {
      kind: "line-offset";
      direction: "above" | "below";
      maxOffsetRatio: number;
    }
);
export type CoachingDefinition = {
  minRepDurationMs: number;
  maxRepDurationMs: number;
  bottomPauseMs: number;
  formRules: FormRule[];
};
export type LiveCounterConfig = {
  minVisibility: number;
  stableFrames: number;
  minCycleMs: number;
  maxCycleMs: number;
  smoothing: number;
  targetReps: number;
} & (
  | { metric: "knee" | "elbow"; downAngle: number; upAngle: number }
  | {
      metric: "jumping-jack";
      wristsRaisedMargin: number;
      wristsLoweredMargin: number;
      ankleOpenRatio: number;
      ankleClosedRatio: number;
    }
);
const counterDefaults = {
  minVisibility: 0.7,
  stableFrames: 3,
  minCycleMs: 600,
  maxCycleMs: 15000,
  smoothing: 0.45,
  targetReps: 12,
};
const liveCounters: Record<string, LiveCounterConfig> = {
  squats: { ...counterDefaults, metric: "knee", downAngle: 105, upAngle: 155 },
  "push-ups": {
    ...counterDefaults,
    metric: "elbow",
    downAngle: 95,
    upAngle: 155,
    targetReps: 10,
  },
  "jumping-jacks": {
    ...counterDefaults,
    metric: "jumping-jack",
    wristsRaisedMargin: 0.15,
    wristsLoweredMargin: 0.15,
    ankleOpenRatio: 1.6,
    ankleClosedRatio: 1.05,
    targetReps: 20,
  },
};
export type Exercise = {
  id: string;
  name: string;
  targetMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  instructions: string[];
  commonMistakes: string[];
  mediaPipeLandmarks: PoseLandmark[];
  jointAngleDefinition: {
    label: string;
    points: [PoseLandmark, PoseLandmark, PoseLandmark];
    vertex: PoseLandmark;
    unit: "degrees";
    cameraView: "Front" | "Side";
    notes: string;
  };
  repCountingRules: {
    mode: "repetitions" | "hold" | "sequence";
    startState: string;
    activeState: string;
    countWhen: string;
    startAngle: [number, number];
    activeAngle: [number, number];
    minVisibility: number;
    minCycleSeconds: number;
    countPerSide: boolean;
    validationStatus: "prototype";
  };
  animationPath: `/animations/${string}.svg`;
  youtubeVideo: ExerciseVideo;
  liveCounter?: LiveCounterConfig;
  coaching: CoachingDefinition;
};
type Profile =
  | "knee"
  | "elbow"
  | "press"
  | "shoulder"
  | "fly"
  | "hip"
  | "hold"
  | "calf"
  | "twist"
  | "jack"
  | "burpee";
const definitions: Record<
  Profile,
  {
    points: [PoseLandmark, PoseLandmark, PoseLandmark];
    label: string;
    start: [number, number];
    active: [number, number];
    view: "Front" | "Side";
    startState: string;
    activeState: string;
    countWhen: string;
    mode: Exercise["repCountingRules"]["mode"];
  }
> = {
  knee: {
    points: ["leftHip", "leftKnee", "leftAnkle"],
    label: "Knee flexion",
    start: [155, 180],
    active: [65, 110],
    view: "Side",
    startState: "Standing with knees extended",
    activeState: "Controlled knee bend",
    countWhen: "Return to standing after the bent-knee phase",
    mode: "repetitions",
  },
  elbow: {
    points: ["leftShoulder", "leftElbow", "leftWrist"],
    label: "Elbow flexion",
    start: [150, 180],
    active: [45, 95],
    view: "Side",
    startState: "Elbow extended",
    activeState: "Elbow bent",
    countWhen: "Return to extension after a controlled bend",
    mode: "repetitions",
  },
  press: {
    points: ["leftShoulder", "leftElbow", "leftWrist"],
    label: "Elbow extension",
    start: [65, 105],
    active: [155, 180],
    view: "Front",
    startState: "Elbows bent in the starting position",
    activeState: "Arms extended",
    countWhen: "Return to the starting position after extension",
    mode: "repetitions",
  },
  shoulder: {
    points: ["leftHip", "leftShoulder", "leftWrist"],
    label: "Arm elevation",
    start: [0, 25],
    active: [70, 105],
    view: "Front",
    startState: "Arms beside torso",
    activeState: "Arms raised to shoulder height",
    countWhen: "Lower arms after the raised phase",
    mode: "repetitions",
  },
  fly: {
    points: ["leftHip", "leftShoulder", "leftWrist"],
    label: "Shoulder opening proxy",
    start: [0, 35],
    active: [65, 110],
    view: "Front",
    startState: "Arms below torso",
    activeState: "Arms opened laterally",
    countWhen:
      "Return after opening both arms; calibrate the bent-over camera view",
    mode: "repetitions",
  },
  hip: {
    points: ["leftShoulder", "leftHip", "leftKnee"],
    label: "Hip extension / flexion",
    start: [155, 180],
    active: [65, 120],
    view: "Side",
    startState: "Hips extended",
    activeState: "Hips flexed",
    countWhen: "Return to extension after flexion",
    mode: "repetitions",
  },
  hold: {
    points: ["leftShoulder", "leftHip", "leftAnkle"],
    label: "Body alignment",
    start: [155, 180],
    active: [160, 180],
    view: "Side",
    startState: "Body aligned in the hold position",
    activeState: "Stable aligned hold",
    countWhen:
      "Accumulate visible hold seconds, not repetitions; pause when alignment is lost",
    mode: "hold",
  },
  calf: {
    points: ["leftKnee", "leftAnkle", "leftFootIndex"],
    label: "Ankle plantarflexion proxy",
    start: [75, 115],
    active: [120, 165],
    view: "Side",
    startState: "Heels lowered",
    activeState: "Heels raised",
    countWhen:
      "Lower heels after a visible raise; confirm heel displacement separately",
    mode: "repetitions",
  },
  twist: {
    points: ["leftShoulder", "leftHip", "rightShoulder"],
    label: "Torso rotation proxy",
    start: [20, 90],
    active: [20, 90],
    view: "Front",
    startState: "Torso centered",
    activeState: "Alternate left and right rotations",
    countWhen:
      "Count one left-and-right cycle; requires calibrated 3D shoulder rotation, not this angle alone",
    mode: "sequence",
  },
  jack: {
    points: ["leftHip", "leftShoulder", "leftWrist"],
    label: "Overhead arm elevation",
    start: [0, 35],
    active: [145, 180],
    view: "Front",
    startState: "Feet together, arms lowered",
    activeState: "Feet apart, arms overhead",
    countWhen:
      "Return to closed position after opening; also confirm ankle separation",
    mode: "sequence",
  },
  burpee: {
    points: ["leftHip", "leftKnee", "leftAnkle"],
    label: "Knee flexion phase proxy",
    start: [155, 180],
    active: [60, 110],
    view: "Side",
    startState: "Standing",
    activeState: "Crouch, plank, crouch, stand",
    countWhen:
      "Count only after the full ordered sequence; use hip and shoulder positions to confirm plank",
    mode: "sequence",
  },
};
type Seed = {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  profile: Profile;
  instructions: string[];
  mistakes: string[];
  perSide?: boolean;
  extraLandmarks?: PoseLandmark[];
  ruleNote?: string;
};
const seeds: Seed[] = [
  {
    id: "jumping-jacks",
    name: "Jumping jacks",
    muscles: ["Cardio", "Shoulders", "Calves"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "jack",
    extraLandmarks: ["leftAnkle", "rightAnkle", "rightShoulder", "rightWrist"],
    instructions: [
      "Stand with feet together and arms by your sides.",
      "Step or jump feet apart while raising your arms overhead.",
      "Return to the starting position and land softly.",
    ],
    mistakes: [
      "Landing with stiff knees.",
      "Rushing faster than you can control.",
    ],
  },
  {
    id: "squats",
    name: "Bodyweight squats",
    muscles: ["Quads", "Glutes", "Hamstrings"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "knee",
    instructions: [
      "Stand with feet about shoulder-width apart.",
      "Sit your hips back and bend your knees with control.",
      "Keep your chest lifted and press through your feet to stand.",
    ],
    mistakes: [
      "Letting knees collapse inward.",
      "Lifting heels or rounding your back.",
    ],
  },
  {
    id: "push-ups",
    name: "Push-ups",
    muscles: ["Chest", "Shoulders", "Triceps", "Core"],
    equipment: ["Bodyweight"],
    difficulty: "Intermediate",
    profile: "elbow",
    extraLandmarks: ["leftHip", "leftAnkle"],
    instructions: [
      "Place hands slightly wider than shoulders in a high plank.",
      "Lower your chest with your body in one line.",
      "Push back up; use your knees for a manageable variation.",
    ],
    mistakes: [
      "Sagging or lifting the hips.",
      "Flaring elbows directly out to the sides.",
    ],
  },
  {
    id: "lunges",
    name: "Lunges",
    muscles: ["Quads", "Glutes", "Hamstrings"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "knee",
    perSide: true,
    extraLandmarks: ["rightHip", "rightKnee", "rightAnkle"],
    instructions: [
      "Stand tall and step one foot back.",
      "Bend both knees, keeping the front knee aligned over your foot.",
      "Push through the front foot to return; alternate sides.",
    ],
    mistakes: [
      "Taking a narrow, unstable step.",
      "Letting the front knee cave inward.",
    ],
  },
  {
    id: "glute-bridge",
    name: "Glute bridges",
    muscles: ["Glutes", "Hamstrings", "Core"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "hip",
    instructions: [
      "Lie on your back with bent knees and feet flat.",
      "Squeeze your glutes to lift hips into line with shoulders and knees.",
      "Lower slowly while keeping your ribs down.",
    ],
    mistakes: [
      "Arching the lower back to lift higher.",
      "Pushing primarily through the toes.",
    ],
  },
  {
    id: "plank",
    name: "Plank",
    muscles: ["Core", "Shoulders"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "hold",
    instructions: [
      "Place forearms on the floor with elbows under shoulders.",
      "Extend your legs and brace your core.",
      "Keep hips level and breathe throughout the hold.",
    ],
    mistakes: ["Holding your breath.", "Letting hips sag or rise too high."],
  },
  {
    id: "mountain-climbers",
    name: "Mountain climbers",
    muscles: ["Core", "Shoulders", "Cardio"],
    equipment: ["Bodyweight"],
    difficulty: "Intermediate",
    profile: "hip",
    perSide: true,
    extraLandmarks: ["rightHip", "rightKnee"],
    instructions: [
      "Start in a high plank with hands under shoulders.",
      "Bring one knee toward your chest, then switch sides.",
      "Keep your hips steady; step slowly if needed.",
    ],
    mistakes: [
      "Bouncing the hips upward.",
      "Letting shoulders drift far behind the hands.",
    ],
  },
  {
    id: "burpees",
    name: "Burpees",
    muscles: ["Cardio", "Chest", "Quads", "Core"],
    equipment: ["Bodyweight"],
    difficulty: "Advanced",
    profile: "burpee",
    extraLandmarks: ["leftShoulder", "leftWrist", "leftHip"],
    instructions: [
      "Bend your knees and place hands on the floor.",
      "Step or jump feet back to a high plank.",
      "Bring feet back toward hands and stand; add a small jump if comfortable.",
    ],
    mistakes: [
      "Dropping hips into an uncontrolled plank.",
      "Landing hard or sacrificing form for speed.",
    ],
  },
  {
    id: "biceps-curls",
    name: "Biceps curls",
    muscles: ["Biceps", "Forearms"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    profile: "elbow",
    instructions: [
      "Stand tall with palms facing forward and elbows near your sides.",
      "Curl dumbbells toward shoulders without moving upper arms.",
      "Lower slowly to the starting position.",
    ],
    mistakes: [
      "Swinging the torso to lift the weights.",
      "Letting elbows travel forward.",
    ],
  },
  {
    id: "hammer-curls",
    name: "Hammer curls",
    muscles: ["Biceps", "Forearms"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    profile: "elbow",
    instructions: [
      "Hold dumbbells with palms facing each other.",
      "Curl while keeping wrists neutral and elbows close.",
      "Lower both weights slowly.",
    ],
    mistakes: [
      "Bending wrists under the load.",
      "Using momentum instead of controlled movement.",
    ],
  },
  {
    id: "triceps-dips",
    name: "Triceps dips",
    muscles: ["Triceps", "Shoulders"],
    equipment: ["Bench"],
    difficulty: "Intermediate",
    profile: "elbow",
    instructions: [
      "Place hands on a stable bench with feet supported on the floor.",
      "Keep hips close to the bench and bend elbows to a comfortable depth.",
      "Press through your hands to return without shrugging.",
    ],
    mistakes: [
      "Lowering beyond comfortable shoulder range.",
      "Using an unstable support or drifting hips forward.",
    ],
  },
  {
    id: "shoulder-press",
    name: "Shoulder press",
    muscles: ["Shoulders", "Triceps"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    profile: "press",
    instructions: [
      "Hold light dumbbells at shoulder height and brace your core.",
      "Press overhead without arching your lower back.",
      "Lower with control to shoulder height.",
    ],
    mistakes: [
      "Overarching the lower back.",
      "Pushing the head forward or shrugging excessively.",
    ],
  },
  {
    id: "lateral-raises",
    name: "Lateral raises",
    muscles: ["Shoulders"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    profile: "shoulder",
    instructions: [
      "Stand tall with light dumbbells by your sides.",
      "Lift arms out to the sides with a small elbow bend.",
      "Stop around shoulder height and lower slowly.",
    ],
    mistakes: [
      "Swinging weights upward.",
      "Shrugging shoulders toward the ears.",
    ],
  },
  {
    id: "band-rows",
    name: "Band rows",
    muscles: ["Back", "Biceps"],
    equipment: ["Resistance band"],
    difficulty: "Beginner",
    profile: "elbow",
    instructions: [
      "Secure the band to a suitable stable anchor at chest height.",
      "Pull elbows back toward your ribs while staying tall.",
      "Release slowly without letting shoulders round forward.",
    ],
    mistakes: [
      "Using an insecure anchor.",
      "Leaning back to pull instead of moving the arms.",
    ],
  },
  {
    id: "dumbbell-rows",
    name: "Dumbbell rows",
    muscles: ["Back", "Biceps"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    profile: "elbow",
    perSide: true,
    instructions: [
      "Hinge at the hips with a neutral back and knees soft.",
      "Pull a dumbbell toward your hip with the elbow close to your body.",
      "Lower slowly and repeat on the other side.",
    ],
    mistakes: [
      "Twisting the torso to lift the weight.",
      "Rounding the lower back.",
    ],
  },
  {
    id: "reverse-fly",
    name: "Reverse fly",
    muscles: ["Back", "Shoulders"],
    equipment: ["Dumbbells"],
    difficulty: "Intermediate",
    profile: "fly",
    instructions: [
      "Hinge forward with soft knees and a neutral back.",
      "Open arms out to the sides using very light weights.",
      "Keep elbows slightly bent and lower with control.",
    ],
    mistakes: [
      "Shrugging instead of opening the arms.",
      "Using heavy weights that force body momentum.",
    ],
  },
  {
    id: "goblet-squats",
    name: "Goblet squats",
    muscles: ["Quads", "Glutes", "Core"],
    equipment: ["Dumbbells"],
    difficulty: "Intermediate",
    profile: "knee",
    instructions: [
      "Hold one dumbbell close to your chest.",
      "Sit between your hips while keeping heels grounded.",
      "Press through your feet and stand tall.",
    ],
    mistakes: [
      "Holding the weight far from the chest.",
      "Losing knee alignment or lifting heels.",
    ],
  },
  {
    id: "romanian-deadlifts",
    name: "Romanian deadlifts",
    muscles: ["Hamstrings", "Glutes", "Back"],
    equipment: ["Dumbbells"],
    difficulty: "Intermediate",
    profile: "hip",
    instructions: [
      "Stand tall with dumbbells in front of your thighs and knees soft.",
      "Push hips back, sliding weights close to your legs with a neutral back.",
      "Stop at a comfortable hamstring stretch and drive hips forward to stand.",
    ],
    mistakes: [
      "Rounding the back or reaching for the floor.",
      "Turning the hinge into a deep knee bend.",
    ],
  },
  {
    id: "calf-raises",
    name: "Calf raises",
    muscles: ["Calves"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "calf",
    extraLandmarks: ["leftHeel"],
    instructions: [
      "Stand tall near a stable support for balance.",
      "Lift your heels and rise onto the balls of your feet.",
      "Pause briefly and lower your heels with control.",
    ],
    mistakes: ["Bouncing through the movement.", "Rolling ankles outward."],
  },
  {
    id: "leg-raises",
    name: "Leg raises",
    muscles: ["Core"],
    equipment: ["Bodyweight"],
    difficulty: "Intermediate",
    profile: "hip",
    instructions: [
      "Lie on your back and keep your ribs down.",
      "Lift legs with control, bending knees if needed.",
      "Lower only as far as you can without lifting your lower back.",
    ],
    mistakes: [
      "Arching the lower back as legs lower.",
      "Swinging the legs or holding your breath.",
    ],
  },
  {
    id: "russian-twists",
    name: "Russian twists",
    muscles: ["Core"],
    equipment: ["Bodyweight"],
    difficulty: "Intermediate",
    profile: "twist",
    extraLandmarks: ["rightHip"],
    instructions: [
      "Sit with bent knees, feet grounded, and chest lifted.",
      "Rotate your torso gently to one side, then the other.",
      "Keep the movement controlled and your spine long.",
    ],
    mistakes: [
      "Rounding the back or forcing rotation.",
      "Moving only the hands instead of rotating the torso.",
    ],
  },
  {
    id: "side-plank",
    name: "Side plank",
    muscles: ["Core", "Shoulders", "Glutes"],
    equipment: ["Bodyweight"],
    difficulty: "Intermediate",
    profile: "hold",
    perSide: true,
    instructions: [
      "Lie on one side with your elbow beneath the shoulder.",
      "Lift hips into a line from head to feet; bend knees for support if needed.",
      "Hold while breathing steadily, then repeat on the other side.",
    ],
    mistakes: [
      "Letting hips drop or rotate forward.",
      "Collapsing into the supporting shoulder.",
    ],
  },
  {
    id: "triceps-extensions",
    name: "Overhead triceps extensions",
    muscles: ["Triceps"],
    equipment: ["Dumbbells"],
    difficulty: "Beginner",
    profile: "elbow",
    instructions: [
      "Hold a light dumbbell overhead with both hands.",
      "Keep elbows pointing forward while lowering behind your head.",
      "Extend elbows smoothly without arching your back.",
    ],
    mistakes: [
      "Flaring elbows too far apart.",
      "Using the lower back to move the weight.",
    ],
  },
  {
    id: "march-in-place",
    name: "Brisk march in place",
    muscles: ["Cardio", "Quads", "Calves"],
    equipment: ["Bodyweight"],
    difficulty: "Beginner",
    profile: "hip",
    perSide: true,
    extraLandmarks: ["rightHip", "rightKnee"],
    instructions: [
      "Stand tall and begin marching at a comfortable pace.",
      "Lift one knee at a time and swing arms naturally.",
      "Land softly and maintain steady breathing.",
    ],
    mistakes: [
      "Leaning backward as knees rise.",
      "Stomping or increasing pace beyond control.",
    ],
  },
];
function coachingFor(seed: Seed): CoachingDefinition {
  const prone = ["push-ups", "plank", "mountain-climbers", "burpees"].includes(
    seed.id,
  );
  const formRules: FormRule[] = prone
    ? [
        {
          id: "hips-high",
          kind: "line-offset",
          points: ["leftShoulder", "leftHip", "leftAnkle"],
          direction: "above",
          maxOffsetRatio: 0.08,
          message: "Lower your hips a bit",
          priority: 4,
          when: "always",
        },
        {
          id: "hips-sag",
          kind: "line-offset",
          points: ["leftShoulder", "leftHip", "leftAnkle"],
          direction: "below",
          maxOffsetRatio: 0.08,
          message: "Keep your back straighter",
          priority: 3,
          when: "always",
        },
        {
          id: "prone-alignment",
          kind: "angle",
          points: ["leftShoulder", "leftHip", "leftAnkle"],
          minDegrees: 150,
          maxDegrees: 180,
          message: "Keep your back straighter",
          priority: 2,
          when: "always",
        },
      ]
    : [
        {
          id: "body-alignment",
          kind: "angle",
          points: ["leftShoulder", "leftHip", "leftKnee"],
          minDegrees: 145,
          maxDegrees: 180,
          message: "Keep your back straighter",
          priority: 3,
          when: "Up",
        },
      ];
  if (
    ["dumbbell-rows", "reverse-fly", "triceps-dips", "russian-twists"].includes(
      seed.id,
    )
  ) {
    formRules.splice(0, formRules.length, {
      id: "torso-position",
      kind: "angle",
      points: ["leftShoulder", "leftHip", "leftKnee"],
      minDegrees: 45,
      maxDegrees: 140,
      message: "Control the movement",
      priority: 3,
      when: "Up",
    });
  }
  if (["squats", "goblet-squats"].includes(seed.id))
    formRules.push({
      id: "bottom-torso-position",
      kind: "angle",
      points: ["leftShoulder", "leftHip", "leftKnee"],
      minDegrees: 35,
      maxDegrees: 180,
      message: "Keep your back straighter",
      priority: 3,
      when: "Down",
    });
  const fast = [
    "jumping-jacks",
    "march-in-place",
    "mountain-climbers",
  ].includes(seed.id);
  return {
    minRepDurationMs: fast
      ? 600
      : seed.id === "burpees"
        ? 2500
        : seed.profile === "hold"
          ? 1000
          : 1200,
    maxRepDurationMs:
      seed.profile === "hold"
        ? 120000
        : fast
          ? 4000
          : seed.id === "burpees"
            ? 12000
            : 8000,
    bottomPauseMs:
      fast || seed.profile === "hold" || seed.id === "burpees" ? 0 : 350,
    formRules,
  };
}
export const exercises: Exercise[] = seeds.map((seed) => {
  const profile = definitions[seed.profile];
  const coaching = coachingFor(seed);
  return {
    id: seed.id,
    coaching,
    liveCounter: liveCounters[seed.id]
      ? {
          ...liveCounters[seed.id],
          minCycleMs: coaching.minRepDurationMs,
          maxCycleMs: coaching.maxRepDurationMs,
        }
      : undefined,
    name: seed.name,
    targetMuscles: seed.muscles,
    equipment: seed.equipment,
    difficulty: seed.difficulty,
    instructions: seed.instructions,
    commonMistakes: seed.mistakes,
    mediaPipeLandmarks: Array.from(
      new Set([
        ...profile.points,
        ...coaching.formRules.flatMap((rule) => rule.points),
        ...(seed.extraLandmarks ?? []),
      ]),
    ),
    jointAngleDefinition: {
      label: profile.label,
      points: profile.points,
      vertex: profile.points[1],
      unit: "degrees",
      cameraView: profile.view,
      notes:
        "Prototype metric: calibrate for the exercise, view, body proportions, and available range of motion before enabling automatic counting.",
    },
    repCountingRules: {
      mode: profile.mode,
      startState: profile.startState,
      activeState: profile.activeState,
      countWhen: seed.ruleNote ?? profile.countWhen,
      startAngle: profile.start,
      activeAngle: profile.active,
      minVisibility: 0.7,
      minCycleSeconds: 0.6,
      countPerSide: seed.perSide ?? false,
      validationStatus: "prototype",
    },
    youtubeVideo: exerciseVideos[seed.id],
    animationPath:
      demoAssets[seed.id]?.animationPath ??
      "/animations/stickman-placeholder.svg",
  };
});
export function findExercise(id: string) {
  return exercises.find((exercise) => exercise.id === id);
}
export type ExerciseFilters = {
  query: string;
  muscle: string;
  equipment: string;
  difficulty: string;
};
export function filterExercises(catalog: Exercise[], filters: ExerciseFilters) {
  const query = filters.query.trim().toLowerCase();
  return catalog.filter(
    (exercise) =>
      (!query ||
        [exercise.name, ...exercise.targetMuscles, ...exercise.equipment]
          .join(" ")
          .toLowerCase()
          .includes(query)) &&
      (!filters.muscle ||
        exercise.targetMuscles.some((m) => m === filters.muscle)) &&
      (!filters.equipment ||
        exercise.equipment.some((e) => e === filters.equipment)) &&
      (!filters.difficulty || exercise.difficulty === filters.difficulty),
  );
}
