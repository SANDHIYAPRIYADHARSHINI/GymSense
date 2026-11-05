import { test } from "node:test";
import assert from "node:assert/strict";
import { exercises, findExercise } from "../src/data/exercises.ts";
import { RepCounter } from "../src/lib/pose/counter.ts";
import {
  evaluateForm,
  FeedbackDebouncer,
  CoachSession,
  scoreSet,
} from "../src/lib/pose/coaching.ts";
import { CoachSpeech } from "../src/lib/pose/speech.ts";
const definition = findExercise("squats").coaching;
const event = (
  id,
  outcome = "counted",
  durationMs = 2000,
  bottomPauseMs = 500,
) => ({
  id,
  outcome,
  durationMs,
  bottomPauseMs,
  completeness: outcome === "incomplete" ? 0.5 : 1,
});
const measurement = (angle) => ({
  valid: true,
  angle,
  phase: null,
  side: "left",
  message: "",
});
test("every exercise defines tempo and valid form rules; live counter limits agree", () => {
  for (const exercise of exercises) {
    const coach = exercise.coaching;
    assert.ok(coach.minRepDurationMs > 0);
    assert.ok(coach.maxRepDurationMs > coach.minRepDurationMs);
    assert.ok(coach.formRules.length > 0);
    for (const rule of coach.formRules) {
      assert.equal(rule.points.length, 3);
      assert.ok(rule.message);
    }
    if (exercise.liveCounter) {
      assert.equal(exercise.liveCounter.minCycleMs, coach.minRepDurationMs);
      assert.equal(exercise.liveCounter.maxCycleMs, coach.maxRepDurationMs);
    }
  }
});
test("tempo uses movement duration, not standing time; fast cycles never count later", () => {
  const counter = new RepCounter({
    ...findExercise("squats").liveCounter,
    smoothing: 1,
    stableFrames: 1,
  });
  counter.update(measurement(170), 0);
  counter.update(measurement(170), 9000);
  counter.update(measurement(80), 9100);
  counter.update(measurement(170), 9300);
  assert.equal(counter.snapshot().reps, 0);
  assert.equal(counter.lastEvent().outcome, "too-fast");
  assert.equal(counter.lastEvent().durationMs, 200);
  counter.update(measurement(170), 20000);
  assert.equal(counter.snapshot().reps, 0);
  counter.update(measurement(80), 21000);
  counter.update(measurement(170), 23000);
  assert.equal(counter.snapshot().reps, 1);
  assert.equal(counter.lastEvent().outcome, "counted");
});
test("partial, timed-out and interrupted attempts are recorded once", () => {
  const counter = new RepCounter({
    ...findExercise("squats").liveCounter,
    smoothing: 1,
    stableFrames: 1,
  });
  counter.update(measurement(170), 0);
  counter.update(measurement(130), 500);
  counter.update(measurement(170), 1500);
  assert.equal(counter.lastEvent().outcome, "incomplete");
  counter.update(measurement(80), 2000);
  counter.update(measurement(80), 11000);
  assert.equal(counter.lastEvent().outcome, "too-slow");
  counter.update(measurement(170), 12000);
  counter.update(measurement(80), 13000);
  counter.invalidate();
  const id = counter.lastEvent().id;
  assert.equal(counter.lastEvent().outcome, "incomplete");
  counter.invalidate();
  assert.equal(counter.lastEvent().id, id);
});
function body(hipY) {
  const points = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
  points[11] = { x: 0.2, y: 0.5, visibility: 0.99 };
  points[23] = { x: 0.5, y: hipY, visibility: 0.99 };
  points[27] = { x: 0.8, y: 0.5, visibility: 0.99 };
  return points;
}
test("form cues distinguish raised hips and sagging back; hidden joints do not warn", () => {
  const rules = findExercise("push-ups").coaching.formRules;
  assert.deepEqual(evaluateForm(body(0.5), rules, "Up", "left"), []);
  assert.equal(
    evaluateForm(body(0.25), rules, "Down", "left")[0].message,
    "Lower your hips a bit",
  );
  assert.equal(
    evaluateForm(body(0.75), rules, "Down", "left")[0].message,
    "Keep your back straighter",
  );
  const hidden = body(0.25);
  hidden[23].visibility = 0.1;
  assert.deepEqual(evaluateForm(hidden, rules, "Down", "left"), []);
  const points = body(0.25);
  points[11].x = 0.5;
  points[23].x = 0.5;
  points[27].x = 0.5;
  assert.ok(
    !evaluateForm(
      points,
      rules.filter((rule) => rule.kind === "line-offset"),
      "Up",
      "left",
    ).length,
  );
});
test("phase-gated angle rules do not mistake a squat descent for poor upright form", () => {
  const points = body(0.5);
  points[11] = { x: 0.5, y: 0.2, visibility: 0.99 };
  points[25] = { x: 0.8, y: 0.5, visibility: 0.99 };
  assert.deepEqual(
    evaluateForm(points, definition.formRules, "Down", "left"),
    [],
  );
  assert.ok(
    evaluateForm(points, definition.formRules, "Up", "left").length > 0,
  );
});
test("feedback must persist before display, holds one cue, and clears after correction", () => {
  const gate = new FeedbackDebouncer();
  assert.equal(gate.update("Lower your hips a bit", 0), null);
  assert.equal(gate.update("Lower your hips a bit", 399), null);
  assert.equal(
    gate.update("Lower your hips a bit", 400),
    "Lower your hips a bit",
  );
  gate.update("Keep your back straighter", 500);
  assert.equal(
    gate.update("Keep your back straighter", 1000),
    "Lower your hips a bit",
  );
  assert.equal(
    gate.update("Keep your back straighter", 1800),
    "Keep your back straighter",
  );
  gate.update(null, 1900);
  assert.equal(gate.update(null, 2150), null);
  assert.equal(gate.clear(), null);
});
test("coaching emits relevant tempo, pause and praise cues, once per event", () => {
  for (const [outcome, bottom, message] of [
    ["too-fast", 500, "Go a little slower"],
    ["too-slow", 500, "Control the movement"],
    ["incomplete", 500, "Control the movement"],
    ["counted", 0, "Pause at the bottom"],
    ["counted", 500, "Great rep!"],
  ]) {
    const session = new CoachSession();
    const rep = event(1, outcome, 2000, bottom);
    session.update([], rep, definition, 0, true);
    assert.equal(session.update([], rep, definition, 500, true), message);
    assert.equal(session.score().attempts, 1);
    assert.equal(session.update([], rep, definition, 600, false), null);
  }
});
test("scores are bounded and reflect completeness, consistency, and warning exposure", () => {
  assert.equal(scoreSet([], 0, 0).score, null);
  assert.equal(scoreSet([event(1), event(2)], 20, 0).score, 100);
  assert.equal(
    scoreSet([event(1), event(2, "too-fast", 200)], 20, 0).score,
    65,
  );
  assert.equal(
    scoreSet([event(1, "counted", 1000), event(2, "counted", 3000)], 20, 0)
      .score,
    85,
  );
  assert.equal(scoreSet([event(1), event(2)], 20, 10).score, 85);
  assert.equal(scoreSet([event(1, "too-fast", 100)], 20, 0).score, 0);
  const session = new CoachSession();
  session.update(
    [{ id: "sag", message: "Keep your back straighter", priority: 3 }],
    event(1),
    definition,
    0,
    true,
  );
  assert.equal(session.score().form, 0);
  session.reset();
  assert.equal(session.score().score, null);
});
test("speech is optional, uses a local voice, throttles repeats, and cancels", () => {
  const oldWindow = globalThis.window,
    oldUtterance = globalThis.SpeechSynthesisUtterance;
  let spoken = 0,
    cancelled = 0;
  globalThis.window = {
    speechSynthesis: {
      getVoices: () => [{ localService: true, lang: "en-US" }],
      speak: () => spoken++,
      cancel: () => cancelled++,
    },
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  try {
    const speech = new CoachSpeech();
    assert.equal(speech.speak("Great rep!", 0), true);
    speech.speak("Great rep!", 1000);
    assert.equal(spoken, 1);
    speech.speak("Great rep!", 9000);
    assert.equal(spoken, 2);
    speech.cancel();
    assert.ok(cancelled > 0);
    window.speechSynthesis.getVoices = () => [
      { localService: false, lang: "en-US" },
    ];
    assert.equal(new CoachSpeech().speak("Great rep!", 0), false);
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldUtterance === undefined) delete globalThis.SpeechSynthesisUtterance;
    else globalThis.SpeechSynthesisUtterance = oldUtterance;
  }
});
