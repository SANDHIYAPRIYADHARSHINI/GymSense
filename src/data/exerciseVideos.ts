export type ExerciseVideo = {
  url: `https://www.youtube.com/watch?v=${string}`;
  title: string;
  channel: string;
  verifiedOn: string;
};
// Direct video links checked against YouTube metadata; no video is embedded or downloaded.
export const exerciseVideos: Record<string, ExerciseVideo> = {
  "jumping-jacks": {
    url: "https://www.youtube.com/watch?v=c4DAnQ6DtF8",
    title: "Jumping Jacks",
    channel: "FitnessBlender",
    verifiedOn: "2026-11-07",
  },
  squats: {
    url: "https://www.youtube.com/watch?v=P-yaD24bUE8",
    title: "Bodyweight Squat Tutorial - Proper Form and Technique",
    channel: "Runna",
    verifiedOn: "2026-11-07",
  },
  "push-ups": {
    url: "https://www.youtube.com/watch?v=WDIpL0pjun0",
    title: "How to do a Push-Up | Proper Form & Technique | NASM",
    channel: "National Academy of Sports Medicine (NASM)",
    verifiedOn: "2026-11-07",
  },
  lunges: {
    url: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    title: "Bowflex® How-To | Lunges for Beginners",
    channel: "BowFlex",
    verifiedOn: "2026-11-07",
  },
  "glute-bridge": {
    url: "https://www.youtube.com/watch?v=wPM8icPu6H8",
    title: "How To Do A Glute Bridge | The Right Way | Well+Good",
    channel: "Well+Good",
    verifiedOn: "2026-11-07",
  },
  plank: {
    url: "https://www.youtube.com/watch?v=u6ZelKyUM6g",
    title: "How to Plank | The Right Way | Well+Good",
    channel: "Well+Good",
    verifiedOn: "2026-11-07",
  },
  "mountain-climbers": {
    url: "https://www.youtube.com/watch?v=nmwgirgXLYM",
    title: "How to Do a Mountain Climber | Boot Camp Workout",
    channel: "Howcast",
    verifiedOn: "2026-11-07",
  },
  burpees: {
    url: "https://www.youtube.com/watch?v=qLBImHhCXSw",
    title: "How To Do A Burpee | The Right Way | Well+Good",
    channel: "Well+Good",
    verifiedOn: "2026-11-07",
  },
  "biceps-curls": {
    url: "https://www.youtube.com/watch?v=Nkl8WnH6tDU",
    title: "Bowflex® How-To | Biceps Curls for Beginners",
    channel: "BowFlex",
    verifiedOn: "2026-11-07",
  },
  "hammer-curls": {
    url: "https://www.youtube.com/watch?v=zC3nLlEvin4",
    title: "How To: Dumbbell Hammer Curl",
    channel: "ScottHermanFitness",
    verifiedOn: "2026-11-07",
  },
  "triceps-dips": {
    url: "https://www.youtube.com/watch?v=0326dy_-CzM",
    title: "How to Do Triceps Bench Dips",
    channel: "LIVESTRONG",
    verifiedOn: "2026-11-07",
  },
  "shoulder-press": {
    url: "https://www.youtube.com/watch?v=qEwKCR5JCog",
    title: "How To: Dumbbell Shoulder Press",
    channel: "ScottHermanFitness",
    verifiedOn: "2026-11-07",
  },
  "lateral-raises": {
    url: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
    title: "How To: Dumbbell Side Lateral Raise",
    channel: "ScottHermanFitness",
    verifiedOn: "2026-11-07",
  },
  "band-rows": {
    url: "https://www.youtube.com/watch?v=3DzjYvsAU8Y",
    title:
      "How to Do a Standing Shoulder Row with Anchored Resistance | MedBridge",
    channel: "Medbridge",
    verifiedOn: "2026-11-07",
  },
  "dumbbell-rows": {
    url: "https://www.youtube.com/watch?v=pYcpY20QaE8",
    title: "How To: Dumbbell Bent-Over Row (Single-Arm)",
    channel: "ScottHermanFitness",
    verifiedOn: "2026-11-07",
  },
  "reverse-fly": {
    url: "https://www.youtube.com/watch?v=3ab5egHsnRk",
    title: "Master the Dumbbell Reverse Fly: DOs & DON'Ts!",
    channel: "Crossrope Jump Ropes",
    verifiedOn: "2026-11-07",
  },
  "goblet-squats": {
    url: "https://www.youtube.com/watch?v=MeIiIdhvXT4",
    title: "How To: Goblet Squat",
    channel: "ScottHermanFitness",
    verifiedOn: "2026-11-07",
  },
  "romanian-deadlifts": {
    url: "https://www.youtube.com/watch?v=hQgFixeXdZo",
    title: "Dumbbell Romanian (RDL) Deadlift |TECHNIQUE for Beginners",
    channel: "Mike | J2FIT Strength & Conditioning",
    verifiedOn: "2026-11-07",
  },
  "calf-raises": {
    url: "https://www.youtube.com/watch?v=-M4-G8p8fmc",
    title: "How to Do a Calf Raise | Sexy Legs Workout",
    channel: "Howcast",
    verifiedOn: "2026-11-07",
  },
  "leg-raises": {
    url: "https://www.youtube.com/watch?v=JB2oyawG9KI",
    title: "How to Do Leg Raises",
    channel: "LIVESTRONG",
    verifiedOn: "2026-11-07",
  },
  "russian-twists": {
    url: "https://www.youtube.com/watch?v=wkD8rjkodUI",
    title: "How to Do a Russian Twist | Ab Workout",
    channel: "Howcast",
    verifiedOn: "2026-11-07",
  },
  "side-plank": {
    url: "https://www.youtube.com/watch?v=K2VljzCC16g",
    title: "How to Do a Perfect Side Plank | Abs Workout",
    channel: "Howcast",
    verifiedOn: "2026-11-07",
  },
  "triceps-extensions": {
    url: "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q",
    title: "How To: Dumbbell Seated Overhead Tricep Extension",
    channel: "ScottHermanFitness",
    verifiedOn: "2026-11-07",
  },
  "march-in-place": {
    url: "https://www.youtube.com/watch?v=ynbWNnrijkA",
    title: "March In Place Exercise",
    channel: "FitClick2",
    verifiedOn: "2026-11-07",
  },
};
