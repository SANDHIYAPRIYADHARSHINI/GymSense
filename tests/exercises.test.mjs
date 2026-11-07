import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  exercises,
  findExercise,
  filterExercises,
  poseLandmarks,
} from "../src/data/exercises.ts";
import { workoutPlans } from "../src/data/workoutPlans.ts";
const all = { query: "", muscle: "", equipment: "", difficulty: "" };
test("all requested exercises exist with unique stable IDs and full metadata", () => {
  const required = [
    "Jumping jacks",
    "Bodyweight squats",
    "Push-ups",
    "Lunges",
    "Glute bridges",
    "Plank",
    "Mountain climbers",
    "Burpees",
    "Biceps curls",
    "Hammer curls",
    "Triceps dips",
    "Shoulder press",
    "Lateral raises",
    "Band rows",
    "Dumbbell rows",
    "Reverse fly",
    "Goblet squats",
    "Romanian deadlifts",
    "Calf raises",
    "Leg raises",
    "Russian twists",
    "Side plank",
  ];
  assert.equal(new Set(exercises.map((ex) => ex.id)).size, exercises.length);
  for (const name of required)
    assert.ok(
      exercises.some((ex) => ex.name === name),
      name,
    );
  for (const exercise of exercises) {
    assert.equal(findExercise(exercise.id), exercise);
    assert.ok(exercise.targetMuscles.length);
    assert.ok(exercise.equipment.length);
    assert.ok(
      ["Beginner", "Intermediate", "Advanced"].includes(exercise.difficulty),
    );
    assert.ok(exercise.instructions.length >= 3);
    assert.ok(exercise.commonMistakes.length >= 2);
    for (const point of exercise.mediaPipeLandmarks)
      assert.ok(point in poseLandmarks);
    for (const point of exercise.jointAngleDefinition.points)
      assert.ok(exercise.mediaPipeLandmarks.includes(point));
    assert.equal(
      exercise.jointAngleDefinition.vertex,
      exercise.jointAngleDefinition.points[1],
    );
    assert.equal(exercise.repCountingRules.validationStatus, "prototype");
    assert.ok(exercise.repCountingRules.countWhen);
    for (const range of [
      exercise.repCountingRules.startAngle,
      exercise.repCountingRules.activeAngle,
    ])
      assert.ok(range[0] >= 0 && range[1] <= 180 && range[0] <= range[1]);
    assert.ok(
      existsSync(
        new URL("../public" + exercise.animationPath, import.meta.url),
      ),
      exercise.animationPath,
    );
  }
  assert.equal(findExercise("missing"), undefined);
});
test("all plan exercises resolve through the canonical catalog", () => {
  for (const plan of workoutPlans)
    for (const day of plan.days)
      for (const item of day.exercises)
        assert.ok(
          findExercise(item.exerciseId),
          `${plan.id} Day ${day.day}: ${item.exerciseId}`,
        );
  for (const id of [
    "squats",
    "push-ups",
    "lunges",
    "glute-bridge",
    "march-in-place",
    "triceps-extensions",
  ])
    assert.ok(findExercise(id));
});
test("search is case insensitive, trims whitespace, and matches names, muscles, equipment", () => {
  assert.ok(
    filterExercises(exercises, { ...all, query: "  SQUATS  " }).some(
      (ex) => ex.id === "squats",
    ),
  );
  assert.ok(
    filterExercises(exercises, { ...all, query: "hamstrings" }).every((ex) =>
      ex.targetMuscles.includes("Hamstrings"),
    ),
  );
  assert.ok(
    filterExercises(exercises, { ...all, query: "resistance band" }).some(
      (ex) => ex.id === "band-rows",
    ),
  );
  assert.equal(
    filterExercises(exercises, { ...all, query: "no-such-movement" }).length,
    0,
  );
  assert.equal(filterExercises(exercises, all).length, exercises.length);
});
test("muscle, equipment, difficulty filters intersect with search and can yield no results", () => {
  const filtered = filterExercises(exercises, {
    query: "curl",
    muscle: "Biceps",
    equipment: "Dumbbells",
    difficulty: "Beginner",
  });
  assert.deepEqual(
    filtered.map((ex) => ex.id),
    ["biceps-curls", "hammer-curls"],
  );
  assert.deepEqual(
    filterExercises(exercises, {
      ...all,
      equipment: "Resistance band",
      difficulty: "Advanced",
    }),
    [],
  );
  assert.deepEqual(
    filterExercises(exercises, { ...all, difficulty: "Advanced" }).map(
      (ex) => ex.id,
    ),
    ["burpees"],
  );
  assert.ok(
    filterExercises(exercises, {
      ...all,
      muscle: "Core",
      equipment: "Bodyweight",
    }).length > 1,
  );
});

test("every exercise has a direct matching YouTube video with attribution", () => {
  const ids = new Set();
  for (const exercise of exercises) {
    const video = exercise.youtubeVideo;
    const url = new URL(video.url);
    assert.equal(url.origin, "https://www.youtube.com");
    assert.equal(url.pathname, "/watch");
    assert.match(url.searchParams.get("v"), /^[A-Za-z0-9_-]{11}$/);
    assert.ok(
      !ids.has(url.searchParams.get("v")),
      exercise.id + " must use its own demonstration",
    );
    ids.add(url.searchParams.get("v"));
    assert.ok(video.title.length > 5);
    assert.ok(video.channel.length > 0);
    assert.match(video.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!exercise.animationPath.includes("placeholder"), exercise.id);
  }
});
