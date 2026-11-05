import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseTreadmillData,
  FTMS_SERVICE,
  TREADMILL_DATA,
} from "../src/lib/bluetooth/ftms.ts";
import { FtmsClient } from "../src/lib/bluetooth/client.ts";
import { GpsDistanceTracker, haversineMeters } from "../src/lib/run/gps.ts";
import { RunEngine, formatPace, averagePace } from "../src/lib/run/engine.ts";
import { StepDetector } from "../src/lib/run/steps.ts";
import {
  appendRun,
  completedRun,
  restoreRuns,
} from "../src/lib/run/storage.ts";
function packet() {
  const data = new DataView(new ArrayBuffer(34));
  let offset = 0;
  const u8 = (value) => {
    data.setUint8(offset++, value);
  };
  const u16 = (value) => {
    data.setUint16(offset, value, true);
    offset += 2;
  };
  const i16 = (value) => {
    data.setInt16(offset, value, true);
    offset += 2;
  };
  u16(0x1ffe);
  u16(1234);
  u16(1000);
  u8(0x56);
  u16(0x1234);
  i16(-25);
  i16(15);
  u16(10);
  u16(2);
  u8(60);
  u8(65);
  u16(500);
  u16(300);
  u8(5);
  u8(140);
  u8(80);
  u16(321);
  u16(100);
  i16(20);
  i16(300);
  assert.equal(offset, 34);
  return data;
}
test("FTMS parser follows optional-field flags, units, signed incline and elapsed offset", () => {
  const result = parseTreadmillData(packet());
  assert.deepEqual(result, {
    speedKph: 12.34,
    averageSpeedKph: 10,
    distanceMeters: 0x123456,
    inclinePercent: -2.5,
    elapsedSeconds: 321,
  });
  const wrapped = new Uint8Array(40);
  wrapped.set(new Uint8Array(packet().buffer), 4);
  assert.deepEqual(
    parseTreadmillData(new DataView(wrapped.buffer, 4, 34)),
    result,
  );
  assert.throws(
    () => parseTreadmillData(new DataView(packet().buffer, 0, 33)),
    RangeError,
  );
  const partial = new DataView(new ArrayBuffer(5));
  partial.setUint16(0, 5, true);
  partial.setUint8(2, 100);
  assert.deepEqual(parseTreadmillData(partial), { distanceMeters: 100 });
  const absent = new DataView(new ArrayBuffer(4));
  absent.setUint16(2, 0xffff, true);
  assert.deepEqual(parseTreadmillData(absent), {});
});
test("manual run timer, distance, pace, pause and resume use active time", () => {
  const engine = new RunEngine();
  engine.reset("manual");
  engine.setManualSpeed(9, 0);
  engine.start(0);
  engine.tick(60000);
  assert.equal(engine.snapshot(60000).distanceMeters, 150);
  assert.equal(formatPace(engine.snapshot(60000).currentPaceSeconds), "6:40");
  engine.pause(60000);
  engine.tick(120000);
  assert.equal(engine.snapshot(120000).elapsedSeconds, 60);
  engine.resume(120000);
  engine.tick(180000);
  engine.stop(180000);
  assert.equal(engine.snapshot(180000).distanceMeters, 300);
  assert.equal(engine.snapshot(180000).elapsedSeconds, 120);
  assert.equal(engine.snapshot(180000).averagePaceSeconds, 400);
  assert.equal(engine.snapshot(180000).status, "stopped");
  assert.equal(formatPace(null), "—");
  assert.equal(averagePace(60, 0), null);
});
test("speed changes and manual distance corrections do not rewrite earlier intervals", () => {
  const engine = new RunEngine();
  engine.reset("manual");
  engine.setManualSpeed(3.6, 0);
  engine.start(0);
  engine.setManualSpeed(7.2, 10000);
  engine.tick(20000);
  assert.equal(engine.snapshot(20000).distanceMeters, 30);
  engine.setDistance(100, 20000);
  engine.tick(30000);
  assert.equal(engine.snapshot(30000).distanceMeters, 120);
  engine.setSteps(130);
  engine.addStep();
  assert.equal(engine.snapshot(30000).steps, 131);
  assert.equal(engine.snapshot(30000).stepSource, "motion + manual");
});
const fix = (latitude, timestamp, accuracy = 5) => ({
  latitude,
  longitude: 0,
  accuracy,
  timestamp,
  speed: null,
});
test("GPS computes real segments and rejects poor accuracy, stale fixes, jumps and paused gaps", () => {
  assert.ok(
    Math.abs(
      haversineMeters(
        { latitude: 0, longitude: 0 },
        { latitude: 0.001, longitude: 0 },
      ) - 111.195,
    ) < 0.1,
  );
  const tracker = new GpsDistanceTracker();
  assert.equal(tracker.push(fix(0, 1000), 1000).meters, 0);
  const next = tracker.push(fix(0.00005, 2000), 2000);
  assert.ok(next.meters > 5 && next.meters < 6);
  assert.equal(tracker.push(fix(5, 3000), 3000).meters, 0);
  assert.equal(tracker.push(fix(0, 4000, 100), 4000).meters, 0);
  assert.equal(tracker.push(fix(0, 5000), 90000).meters, 0);
  const engine = new RunEngine();
  engine.start(0);
  engine.gpsFix(fix(0, 1000), 1000, 1000);
  engine.gpsFix(fix(0.00005, 2000), 2000, 2000);
  const distance = engine.snapshot(2000).distanceMeters;
  engine.pause(2000);
  engine.resume(60000);
  engine.gpsFix(fix(0.01, 61000), 61000, 61000);
  assert.equal(engine.snapshot(61000).distanceMeters, distance);
});
test("FTMS cumulative distance is baselined, excludes pause gaps and handles counter reset", () => {
  const engine = new RunEngine();
  engine.reset("ftms");
  engine.start(0);
  engine.telemetry(
    {
      distanceMeters: 5000,
      speedKph: 10,
      inclinePercent: 2,
      elapsedSeconds: 300,
    },
    0,
  );
  engine.telemetry({ distanceMeters: 5010, speedKph: 10 }, 1000);
  assert.equal(engine.snapshot(1000).distanceMeters, 10);
  engine.pause(1000);
  engine.telemetry({ distanceMeters: 5100 }, 20000);
  engine.resume(30000);
  engine.telemetry({ distanceMeters: 5200, speedKph: 10 }, 30000);
  assert.equal(engine.snapshot(30000).distanceMeters, 10);
  engine.telemetry({ distanceMeters: 5210 }, 31000);
  assert.equal(engine.snapshot(31000).distanceMeters, 20);
  engine.telemetry({ distanceMeters: 0 }, 32000);
  engine.telemetry({ distanceMeters: 5 }, 33000);
  assert.equal(engine.snapshot(33000).distanceMeters, 25);
  assert.equal(engine.snapshot(33000).inclinePercent, 2);
});
test("FTMS speed-only distance stops extrapolating when telemetry is stale", () => {
  const engine = new RunEngine();
  engine.reset("ftms");
  engine.start(0);
  engine.telemetry({ speedKph: 3.6 }, 0);
  engine.tick(10000);
  assert.equal(engine.snapshot(10000).distanceMeters, 3);
  assert.equal(engine.snapshot(10000).currentPaceSeconds, null);
});
test("step estimation requires calibration, a peak and refractory interval", () => {
  const detector = new StepDetector();
  for (let i = 0; i < 12; i++)
    assert.equal(detector.sample(0, 0, 9.8, i * 20), false);
  assert.equal(detector.sample(0, 0, 12, 400), true);
  assert.equal(detector.sample(0, 0, 12.2, 450), false);
  detector.sample(0, 0, 9, 500);
  assert.equal(detector.sample(0, 0, 12, 600), false);
  detector.sample(0, 0, 9, 750);
  assert.equal(detector.sample(0, 0, 12, 900), true);
  assert.equal(detector.sample(null, 0, 0, 1200), false);
});
test("completed run summaries round-trip locally, deduplicate and exclude malformed data", () => {
  const engine = new RunEngine();
  engine.reset("manual");
  engine.start(0);
  engine.tick(60000);
  engine.stop(60000);
  const run = completedRun(
    "one",
    "2026-11-05T10:00:00.000Z",
    "2026-11-05T10:01:00.000Z",
    engine.snapshot(60000),
  );
  const raw = appendRun(null, run);
  const restored = restoreRuns(raw);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].durationSeconds, 60);
  assert.equal(restoreRuns(appendRun(raw, run)).length, 1);
  assert.deepEqual(restoreRuns("broken"), []);
  assert.deepEqual(
    restoreRuns(JSON.stringify({ version: 1, runs: [{ ...run, steps: -1 }] })),
    [],
  );
  assert.ok(!raw.includes("latitude"));
  assert.ok(!raw.includes("longitude"));
});
class Characteristic extends EventTarget {
  properties = { notify: true, read: false };
  value = packet();
  async startNotifications() {
    return this;
  }
  async stopNotifications() {
    return this;
  }
  async readValue() {
    return this.value;
  }
}
class Device extends EventTarget {
  name = "Test treadmill";
  characteristic = new Characteristic();
  gatt = {
    connected: false,
    connect: async () => {
      this.gatt.connected = true;
      return this.gatt;
    },
    disconnect: () => {
      this.gatt.connected = false;
    },
    getPrimaryService: async (uuid) => {
      assert.equal(uuid, FTMS_SERVICE);
      return {
        getCharacteristic: async (id) => {
          assert.equal(id, TREADMILL_DATA);
          return this.characteristic;
        },
      };
    },
  };
}
test("Bluetooth chooser uses only FTMS advertising filter and notifications stop on disconnect", async () => {
  const client = new FtmsClient();
  const device = new Device();
  const states = [],
    values = [];
  let requested;
  await client.connect(
    {
      state: (state) => states.push(state),
      data: (value) => values.push(value),
      error: (message) => assert.fail(message),
      disconnected: () => {},
    },
    {
      requestDevice: async (options) => {
        requested = options;
        return device;
      },
    },
  );
  assert.deepEqual(requested, { filters: [{ services: [0x1826] }] });
  assert.deepEqual(states, ["Connecting", "Connected"]);
  device.characteristic.dispatchEvent(new Event("characteristicvaluechanged"));
  assert.equal(values.length, 1);
  client.disconnect();
  device.characteristic.dispatchEvent(new Event("characteristicvaluechanged"));
  assert.equal(values.length, 1);
  assert.equal(states.at(-1), "Disconnected");
  assert.equal(device.gatt.connected, false);
});
test("unsupported Bluetooth and cancellation before selection resolve without connecting", async () => {
  const client = new FtmsClient();
  const states = [];
  await client.connect(
    {
      state: (state) => states.push(state),
      data: () => {},
      error: () => {},
      disconnected: () => {},
    },
    null,
  );
  assert.equal(states.at(-1), "Unsupported browser/device");
  let select;
  const device = new Device();
  const pending = client.connect(
    {
      state: () => {},
      data: () => {},
      error: () => {},
      disconnected: () => {},
    },
    {
      requestDevice: () =>
        new Promise((resolve) => {
          select = resolve;
        }),
    },
  );
  client.disconnect();
  select(device);
  await pending;
  assert.equal(device.gatt.connected, false);
});
