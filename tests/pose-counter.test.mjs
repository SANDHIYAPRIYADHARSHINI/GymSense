import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RepCounter,
  analyzePose,
  jointAngle,
} from "../src/lib/pose/counter.ts";
import { findExercise } from "../src/data/exercises.ts";
const config = { ...findExercise("squats").liveCounter, smoothing: 1 };
const valid = (angle, phase = null, side = "left") => ({
  valid: true,
  angle,
  phase,
  side,
  message: "",
});
function harness(options = config) {
  const counter = new RepCounter(options);
  let now = 0;
  return {
    counter,
    frame(angle, phase = null, side = "left", frames = 3) {
      for (let i = 0; i < frames; i++)
        counter.update(valid(angle, phase, side), (now += 100));
      return counter.snapshot();
    },
    lost() {
      counter.update(
        { valid: false, angle: null, phase: null, side: null, message: "lost" },
        (now += 100),
      );
    },
    wait(ms) {
      now += ms;
    },
  };
}
test("angle calculation handles degenerate joints and video aspect ratio", () => {
  assert.equal(
    Math.round(jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })),
    90,
  );
  assert.equal(
    Math.round(jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })),
    180,
  );
  assert.equal(
    jointAngle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }),
    null,
  );
  assert.ok(
    Math.abs(
      jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, 2) - 63.4349,
    ) < 0.001,
  );
});
test("squats and push-ups require initial Up and complete down-up cycles", () => {
  for (const id of ["squats", "push-ups"]) {
    const h = harness({ ...findExercise(id).liveCounter, smoothing: 1 });
    h.frame(80);
    assert.equal(h.counter.snapshot().state, "Ready");
    h.frame(170);
    assert.equal(h.counter.snapshot().reps, 0);
    h.frame(80);
    assert.equal(h.counter.snapshot().state, "Down");
    h.frame(170);
    assert.equal(h.counter.snapshot().reps, 1);
    h.frame(170, null, "left", 12);
    assert.equal(h.counter.snapshot().reps, 1);
    h.frame(80);
    h.frame(170);
    assert.equal(h.counter.snapshot().reps, 2);
  }
});
test("partial reps, threshold jitter, and very short cycles do not count", () => {
  const h = harness();
  h.frame(170);
  h.frame(130, null, "left", 8);
  h.frame(170);
  assert.equal(h.counter.snapshot().reps, 0);
  h.frame(80, null, "left", 2);
  h.frame(170);
  assert.equal(h.counter.snapshot().reps, 0);
  const fast = new RepCounter({ ...config, stableFrames: 1 });
  fast.update(valid(170), 0);
  fast.update(valid(80), 1000);
  fast.update(valid(170), 1010);
  assert.equal(fast.snapshot().reps, 0);
  fast.update(valid(170), 5000);
  assert.equal(fast.snapshot().reps, 0);
});
test("tracking loss, side changes, timeouts and reset discard partial cycles", () => {
  const h = harness();
  h.frame(170);
  h.frame(80);
  h.lost();
  h.frame(170);
  assert.equal(h.counter.snapshot().reps, 0);
  h.frame(80);
  h.frame(170, null, "right");
  assert.equal(h.counter.snapshot().reps, 0);
  h.frame(80, null, "right");
  h.wait(16000);
  h.frame(170, null, "right", 4);
  assert.equal(h.counter.snapshot().reps, 0);
  h.frame(80, null, "right");
  h.frame(170, null, "right");
  assert.equal(h.counter.snapshot().reps, 1);
  assert.deepEqual(h.counter.reset(), { reps: 0, state: "Ready", angle: null });
  h.frame(170);
  assert.equal(h.counter.snapshot().reps, 0);
});
function person() {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.99,
  }));
}
function jackPose(openArms, openLegs) {
  const p = person();
  p[11] = { x: 0.4, y: 0.35, visibility: 0.99 };
  p[12] = { x: 0.6, y: 0.35, visibility: 0.99 };
  p[23] = { x: 0.43, y: 0.6, visibility: 0.99 };
  p[24] = { x: 0.57, y: 0.6, visibility: 0.99 };
  p[15] = { x: 0.25, y: openArms ? 0.1 : 0.65, visibility: 0.99 };
  p[16] = { x: 0.75, y: openArms ? 0.1 : 0.65, visibility: 0.99 };
  p[27] = { x: openLegs ? 0.25 : 0.47, y: 0.9, visibility: 0.99 };
  p[28] = { x: openLegs ? 0.75 : 0.53, y: 0.9, visibility: 0.99 };
  return p;
}
test("jumping jacks use BOTH wrist height and ankle separation", () => {
  const options = findExercise("jumping-jacks").liveCounter;
  assert.equal(analyzePose(jackPose(false, false), options).phase, "Up");
  assert.equal(analyzePose(jackPose(true, true), options).phase, "Down");
  assert.equal(analyzePose(jackPose(true, false), options).phase, null);
  assert.equal(analyzePose(jackPose(false, true), options).phase, null);
  const h = harness(options);
  h.frame(10, "Up", null);
  h.frame(170, "Down", null);
  h.frame(10, "Up", null);
  assert.equal(h.counter.snapshot().reps, 1);
  const missing = jackPose(true, true);
  missing[15].visibility = 0.2;
  assert.equal(analyzePose(missing, options).valid, false);
});
test("low visibility, missing landmarks, and cropped joints pause detection", () => {
  assert.equal(analyzePose([], config).valid, false);
  const p = person();
  p[23] = { x: 0.5, y: 0.4, visibility: 0.99 };
  p[25] = { x: 0.5, y: 0.6, visibility: 0.99 };
  p[27] = { x: 0.5, y: 0.9, visibility: 0.99 };
  p[24].visibility = 0;
  p[26].visibility = 0;
  p[28].visibility = 0;
  assert.equal(analyzePose(p, config).valid, true);
  p[27].y = 1.1;
  assert.equal(analyzePose(p, config).valid, false);
});
test("synthetic landmark streams drive real angle analysis and one complete rep", () => {
  for (const id of ["squats", "push-ups"]) {
    const options = findExercise(id).liveCounter;
    const counter = new RepCounter(options);
    let now = 0;
    function pose(angle) {
      const points = person();
      for (const index of [12, 14, 16, 24, 26, 28])
        points[index].visibility = 0;
      const radians = (angle * Math.PI) / 180;
      if (id === "squats") {
        points[11] = { x: 0.5, y: 0.2, visibility: 0.99 };
        points[23] = { x: 0.5, y: 0.4, visibility: 0.99 };
        points[25] = { x: 0.5, y: 0.6, visibility: 0.99 };
        points[27] = {
          x: 0.5 + Math.sin(radians) * 0.2,
          y: 0.6 - Math.cos(radians) * 0.2,
          visibility: 0.99,
        };
      } else {
        points[11] = { x: 0.3, y: 0.4, visibility: 0.99 };
        points[13] = { x: 0.5, y: 0.4, visibility: 0.99 };
        points[15] = {
          x: 0.5 - Math.cos(radians) * 0.2,
          y: 0.4 + Math.sin(radians) * 0.2,
          visibility: 0.99,
        };
        points[23] = { x: 0.3, y: 0.6, visibility: 0.99 };
        points[27] = { x: 0.5, y: 0.9, visibility: 0.99 };
      }
      return points;
    }
    for (const angle of [170, 80, 170])
      for (let i = 0; i < 8; i++) {
        const measurement = analyzePose(
          pose(angle),
          options,
          1,
          counter.preferredSide(),
        );
        assert.equal(measurement.valid, true);
        counter.update(measurement, (now += 100));
      }
    assert.equal(counter.snapshot().reps, 1, id);
  }
  const options = findExercise("jumping-jacks").liveCounter;
  const counter = new RepCounter(options);
  let now = 0;
  for (const open of [false, true, false])
    for (let i = 0; i < 5; i++)
      counter.update(analyzePose(jackPose(open, open), options), (now += 100));
  assert.equal(counter.snapshot().reps, 1);
});
