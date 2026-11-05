import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { demoAssets, resolveDemoAsset } from "../src/data/animationAssets.ts";
import { findExercise } from "../src/data/exercises.ts";
const file = (path) => new URL("../public" + path, import.meta.url);
test("six exercise demos resolve to optimized local SVGs and static posters", () => {
  assert.deepEqual(
    Object.keys(demoAssets).sort(),
    [
      "squats",
      "push-ups",
      "jumping-jacks",
      "lunges",
      "plank",
      "biceps-curls",
    ].sort(),
  );
  let total = 0;
  for (const [id, asset] of Object.entries(demoAssets)) {
    const exercise = findExercise(id);
    assert.equal(exercise.animationPath, asset.animationPath);
    assert.equal(resolveDemoAsset(id, exercise.animationPath), asset);
    for (const path of [asset.animationPath, asset.posterPath]) {
      const bytes = statSync(file(path)).size;
      total += bytes;
      assert.ok(bytes < 5000);
      const svg = readFileSync(file(path), "utf8");
      assert.ok(svg.includes('viewBox="0 0 320 240"'));
      assert.ok(
        !/<script|<foreignObject|<image|https?:\/\//i.test(
          svg.replace("http://www.w3.org/2000/svg", ""),
        ),
      );
    }
    const animated = readFileSync(file(asset.animationPath), "utf8");
    assert.ok(animated.includes("prefers-reduced-motion:reduce"));
    assert.ok(animated.includes('class="still"'));
    assert.ok(animated.includes('repeatCount="indefinite"'));
    const poster = readFileSync(file(asset.posterPath), "utf8");
    assert.ok(!poster.includes("<animate"));
  }
  assert.ok(total < 24000, `Demos and posters total ${total} bytes`);
});
test("animation timelines return to their start with compatible path commands", () => {
  for (const asset of Object.values(demoAssets)) {
    const svg = readFileSync(file(asset.animationPath), "utf8");
    const tags = svg.match(/<animate(?:Transform)?\b[^>]*\/>/g);
    assert.ok(tags.length);
    for (const tag of tags) {
      const values = tag.match(/values="([^"]+)"/)[1].split(";");
      assert.equal(values[0], values.at(-1));
      assert.ok(tag.includes('calcMode="spline"'));
      const times = tag
        .match(/keyTimes="([^"]+)"/)[1]
        .split(";")
        .map(Number);
      assert.equal(times.length, values.length);
      assert.equal(times[0], 0);
      assert.equal(times.at(-1), 1);
      if (tag.includes('attributeName="d"')) {
        const commands = values.map((value) =>
          (value.match(/[A-Za-z]/g) || []).join(""),
        );
        assert.ok(commands.every((value) => value === commands[0]));
      }
    }
  }
});
test("missing or mismatched animation paths resolve to the placeholder without a request", () => {
  assert.equal(
    resolveDemoAsset("burpees", findExercise("burpees").animationPath),
    null,
  );
  assert.equal(resolveDemoAsset("squats", "/animations/missing.svg"), null);
  assert.equal(resolveDemoAsset("missing", "/animations/missing.svg"), null);
});
