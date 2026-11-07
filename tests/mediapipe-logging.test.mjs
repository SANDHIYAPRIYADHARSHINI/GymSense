import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import {
  createMediaPipeErrorLogger,
  patchMediaPipeLogging,
} from "../scripts/mediapipe-logging.mjs";

test("only the exact CPU startup notice is routed to info; errors remain visible", () => {
  const infos = [],
    errors = [];
  const logger = {
    info: (...args) => infos.push(args),
    error: (...args) => errors.push(args),
  };
  const originalError = logger.error;
  const log = createMediaPipeErrorLogger(logger);
  const startup = "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.";
  log(startup);
  log(`  ${startup}\n`);
  const failure = new Error("Model execution failed");
  log(failure);
  log("ERROR: CPU initialization failed");
  log(startup, failure);
  log("An unrelated INFO message");
  assert.deepEqual(infos, [[startup], [`  ${startup}\n`]]);
  assert.deepEqual(errors, [
    [failure],
    ["ERROR: CPU initialization failed"],
    [startup, failure],
    ["An unrelated INFO message"],
  ]);
  assert.equal(logger.error, originalError);
});

test("the loader adapter runs independently and fails clearly if the SDK changes", () => {
  const infos = [],
    errors = [];
  const source = patchMediaPipeLogging(
    "var err = console.error.bind(console);",
  );
  runInNewContext(
    source +
      `\nerr("INFO: Created TensorFlow Lite XNNPACK delegate for CPU."); err("real failure");`,
    {
      console: { info: (s) => infos.push(s), error: (s) => errors.push(s) },
    },
  );
  assert.equal(infos.length, 1);
  assert.deepEqual(errors, ["real failure"]);
  assert.throws(
    () => patchMediaPipeLogging("changed loader"),
    /initialization changed/,
  );
});

test("all installed WASM loaders are prepared with the logging adapter", async () => {
  const path = new URL("../public/mediapipe/wasm/", import.meta.url);
  const loaders = (await readdir(path)).filter((name) => name.endsWith(".js"));
  assert.ok(loaders.length > 0);
  for (const name of loaders) {
    const source = await readFile(new URL(name, path), "utf8");
    assert.ok(
      source.includes(
        `var err = (${createMediaPipeErrorLogger.toString()})(console);`,
      ),
      name,
    );
    assert.ok(!source.includes("var err = console.error.bind(console);"), name);
  }
});
