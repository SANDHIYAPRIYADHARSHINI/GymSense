"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bluetooth,
  Footprints,
  MapPin,
  Pause,
  Play,
  Square,
} from "lucide-react";
import {
  bluetoothAccess,
  FtmsClient,
  type ConnectionState,
} from "@/lib/bluetooth/client";
import type { TreadmillTelemetry } from "@/lib/bluetooth/ftms";
import {
  formatPace,
  formatRunTime,
  RunEngine,
  type RunMode,
} from "@/lib/run/engine";
import { requestMotionAccess, StepDetector } from "@/lib/run/steps";
import { completedRun, type SavedRun } from "@/lib/run/storage";
import { saveRun } from "@/lib/firestore/records";
import { useAuth } from "./auth-provider";
import { cloudError } from "@/lib/firebase";
import { PageHeading } from "./landing";
import { RunHistory } from "./run-history";
const modes = [
  { id: "outdoor", label: "Outdoor GPS" },
  { id: "ftms", label: "Bluetooth treadmill" },
] as const;
export function RunTracker() {
  const { user, isDemo } = useAuth();
  const saving = useRef(false);
  const engine = useMemo(() => new RunEngine(), []);
  const client = useMemo(() => new FtmsClient(), []);
  const [view, setView] = useState(() => engine.snapshot(0));
  const [btState, setBtState] = useState<ConnectionState>("Disconnected");
  const [btSupported, setBtSupported] = useState(false);
  const [consent, setConsent] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [btError, setBtError] = useState("");
  const [telemetry, setTelemetry] = useState<TreadmillTelemetry>({});
  const [notice, setNotice] = useState("");
  const [gpsStatus, setGpsStatus] = useState(
    "GPS permission is requested when you start an outdoor run.",
  );
  const [stepsDraft, setStepsDraft] = useState("");
  const [stride, setStride] = useState(0.75);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionStatus, setMotionStatus] = useState(
    "Motion steps are optional; manual entry and distance estimates are also available.",
  );
  const [motionPending, setMotionPending] = useState(false);
  const [pendingSave, setPendingSave] = useState<SavedRun | null>(null);
  const mounted = useRef(true);
  const startedAt = useRef("");
  const active = view.status === "running" || view.status === "paused";
  const refresh = () => setView(engine.snapshot(performance.now()));
  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => {
      if (!mounted.current) return;
      const supported = !!bluetoothAccess();
      setBtSupported(supported);
      if (!supported) setBtState("Unsupported browser/device");
    });
    const interval = setInterval(() => {
      if (engine.status !== "running") return;
      const now = performance.now();
      engine.tick(now);
      if (engine.mode === "ftms" && engine.telemetryAge(now) > 5000) {
        engine.pause(now);
        setNotice(
          "Treadmill data stopped arriving. Tracking is paused; reconnect or wait for data, then Resume.",
        );
      }
      setView(engine.snapshot(now));
    }, 250);
    const hidden = () => {
      if (document.hidden && engine.status === "running") {
        engine.pause(performance.now());
        setView(engine.snapshot(performance.now()));
        setNotice(
          "Tracking paused while this page was hidden. Resume when you are ready.",
        );
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", hidden);
      engine.pause(performance.now());
      client.disconnect();
    };
  }, [engine, client]);
  useEffect(() => {
    if (view.status !== "running" || view.mode !== "outdoor") return;
    if (!window.isSecureContext || !navigator.geolocation) {
      queueMicrotask(() => {
        if (!mounted.current) return;
        engine.pause(performance.now());
        setView(engine.snapshot(performance.now()));
        setGpsStatus(
          "GPS is unavailable. Use HTTPS on mobile and enable location services, or connect a compatible Bluetooth treadmill.",
        );
      });
      return;
    }
    let alive = true;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (!alive || engine.status !== "running") return;
        const coords = position.coords;
        const message = engine.gpsFix(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp: position.timestamp,
            speed: coords.speed,
          },
          performance.now(),
          Date.now(),
        );
        setGpsStatus(message);
        setView(engine.snapshot(performance.now()));
      },
      (error) => {
        if (!alive) return;
        engine.pause(performance.now());
        setView(engine.snapshot(performance.now()));
        setGpsStatus(
          error.code === 1
            ? "Location permission was denied. Allow it in your browser settings, then Resume to retry."
            : error.code === 3
              ? "GPS timed out. Move to a clearer location, then Resume."
              : "Position is unavailable. Move to a clearer location, then Resume.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    return () => {
      alive = false;
      navigator.geolocation.clearWatch(watch);
    };
  }, [view.status, view.mode, engine]);
  useEffect(() => {
    if (!motionEnabled || view.status !== "running") return;
    const detector = new StepDetector();
    let samples = false;
    const timeout = setTimeout(() => {
      if (!samples)
        setMotionStatus(
          "No motion data received. Sensors may be unavailable; manual step entry is still available.",
        );
    }, 10000);
    const motion = (event: DeviceMotionEvent) => {
      if (engine.status !== "running") return;
      const gravity = event.accelerationIncludingGravity;
      const acceleration =
        gravity &&
        gravity.x !== null &&
        gravity.y !== null &&
        gravity.z !== null
          ? gravity
          : event.acceleration;
      if (!acceleration) return;
      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;
      if (!samples) {
        samples = true;
        clearTimeout(timeout);
        setMotionStatus(
          "Motion step estimation active. Keep your phone with you; shaking can affect estimates.",
        );
      }
      if (detector.sample(x, y, z, performance.now())) engine.addStep();
    };
    window.addEventListener("devicemotion", motion);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("devicemotion", motion);
    };
  }, [motionEnabled, view.status, engine]);
  function configure(mode: RunMode) {
    if (active || pendingSave) return;
    client.disconnect();
    engine.reset(mode);
    setView(engine.snapshot(0));
    setTelemetry({});
    setDeviceName("");
    setNotice("");
    setBtError("");
    setStepsDraft("");
    if (!btSupported) setBtState("Unsupported browser/device");
  }
  function start() {
    if (
      engine.status !== "idle" ||
      (engine.mode === "ftms" && btState !== "Connected")
    )
      return;
    if (engine.mode === "outdoor")
      setGpsStatus("Waiting for a fresh GPS fix...");
    startedAt.current = new Date().toISOString();
    engine.start(performance.now());
    setNotice("");
    refresh();
  }
  function pause() {
    engine.pause(performance.now());
    refresh();
  }
  function resume() {
    if (engine.mode === "ftms" && btState !== "Connected") {
      setNotice(
        "Reconnect the treadmill before resuming, or Stop to save this run.",
      );
      return;
    }
    if (engine.mode === "outdoor")
      setGpsStatus("Waiting for a fresh GPS fix...");
    engine.resume(performance.now());
    setNotice("");
    refresh();
  }
  async function save(run: SavedRun) {
    if (!user || saving.current) return;
    saving.current = true;
    setPendingSave(run);
    setNotice("Saving your run...");
    try {
      await saveRun(user.uid, run);
      setPendingSave(null);
      setNotice(
        isDemo
          ? "Demo run saved in this tab and profile history."
          : "Run saved to your account and profile history.",
      );
    } catch (e) {
      setNotice(cloudError(e) + " Keep this page open and retry saving.");
    } finally {
      saving.current = false;
    }
  }
  function stop() {
    if (!["running", "paused"].includes(engine.status)) return;
    engine.stop(performance.now());
    const snapshot = engine.snapshot(performance.now());
    setView(snapshot);
    client.disconnect();
    if (snapshot.elapsedSeconds < 1) {
      setNotice("This run was too short to save. Start a new run when ready.");
      return;
    }
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    save(
      completedRun(id, startedAt.current, new Date().toISOString(), snapshot),
    );
  }
  async function connect() {
    if (!consent || btState === "Connecting") return;
    setBtError("");
    setDeviceName("");
    setTelemetry({});
    await client.connect({
      state: (state, name) => {
        if (mounted.current) {
          setBtState(state);
          if (name) setDeviceName(name);
        }
      },
      data: (data) => {
        if (!mounted.current) return;
        setTelemetry((previous) => ({ ...previous, ...data }));
        engine.telemetry(data, performance.now());
        refresh();
      },
      error: (message) => {
        if (mounted.current) setBtError(message);
      },
      disconnected: () => {
        if (!mounted.current) return;
        if (engine.mode === "ftms" && engine.status === "running") {
          engine.pause(performance.now());
          refresh();
          setNotice(
            "Treadmill disconnected. Tracking paused; reconnect before resuming.",
          );
        }
      },
    });
  }
  function disconnect() {
    client.disconnect();
    if (engine.mode === "ftms" && engine.status === "running") {
      engine.pause(performance.now());
      refresh();
      setNotice("Treadmill disconnected. Tracking paused.");
    }
  }
  async function enableMotion() {
    if (motionPending) return;
    setMotionPending(true);
    const result = await requestMotionAccess();
    if (!mounted.current) return;
    setMotionPending(false);
    if (result === "granted") {
      setMotionEnabled(true);
      setMotionStatus(
        "Motion permission enabled. Step estimation runs during active tracking.",
      );
    } else
      setMotionStatus(
        result === "denied"
          ? "Motion permission was denied. You can enter steps manually."
          : "Motion sensors are unsupported here. You can enter steps manually or use a distance estimate.",
      );
  }
  function applySteps(event: React.FormEvent) {
    event.preventDefault();
    if (stepsDraft === "") return;
    engine.setSteps(Number(stepsDraft));
    setStepsDraft("");
    refresh();
  }
  return (
    <>
      <PageHeading
        eyebrow="FIND YOUR STRIDE"
        title="One step. Then the next."
        description="Track an outdoor run with GPS or connect a compatible FTMS Bluetooth treadmill."
      />
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Run tracking mode"
      >
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            disabled={active || !!pendingSave}
            aria-pressed={view.mode === mode.id}
            onClick={() => configure(mode.id)}
            className={`min-h-11 rounded-xl border px-4 py-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${view.mode === mode.id ? "border-[#ccf66b] bg-[#ccf66b] text-[#1b2710]" : "border-[#3a4c2e] bg-[#1c2616] text-[#bfd4ab]"}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {view.mode === "outdoor" && (
        <div className="mb-6 rounded-xl border border-[#38502a] bg-[#1a2614] p-4">
          <span className="flex items-center gap-2 text-xs font-bold text-[#ccf66b]">
            <MapPin size={17} />
            Outdoor location
          </span>
          <p className="mt-2 text-xs" role="status">
            {gpsStatus}
          </p>
          <p className="mt-2 text-[10px]">
            Starting or resuming requests GPS access. GPS coordinates stay in
            memory and are not saved or uploaded.
          </p>
        </div>
      )}
      {view.mode === "ftms" && (
        <section className="mb-6 rounded-2xl border border-[#3e5230] bg-[#1b2615] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2">
              <Bluetooth size={24} className="lime" />
              Treadmill connection
            </h2>
            <span className="pill" role="status">
              {btState}
            </span>
          </div>
          <p className="mt-3 text-xs">
            Choose an FTMS-advertising treadmill and allow read-only access to
            its supported measurements.
          </p>
          <label className="my-4 flex min-h-11 cursor-pointer items-start gap-3 text-xs">
            <input
              className="mt-0.5 size-5 shrink-0 accent-[#ccf66b]"
              type="checkbox"
              checked={consent}
              disabled={btState === "Connecting" || btState === "Connected"}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I allow GymSense to connect to the FTMS treadmill I choose.
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="button primary disabled:opacity-40"
              disabled={
                !btSupported ||
                !consent ||
                btState === "Connecting" ||
                btState === "Connected"
              }
              onClick={() => {
                void connect();
              }}
            >
              <Bluetooth size={17} />
              Choose &amp; connect treadmill
            </button>
            {(btState === "Connected" || btState === "Connecting") && (
              <button
                type="button"
                className="button secondary"
                onClick={disconnect}
              >
                {btState === "Connecting" ? "Cancel connection" : "Disconnect"}
              </button>
            )}
          </div>
          {deviceName && <p className="mt-3 text-xs">Device: {deviceName}</p>}
          {btError && (
            <p className="mt-3 text-xs text-amber-200" role="alert">
              {btError}
            </p>
          )}
          {!btSupported && (
            <p className="mt-3 text-xs">
              Web Bluetooth is unavailable in this browser or context. Choose
              Outdoor GPS above, or use a browser and device that support Web
              Bluetooth.
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
            {[
              [
                "Speed",
                telemetry.speedKph === undefined
                  ? "Not provided"
                  : `${telemetry.speedKph.toFixed(2)} km/h`,
              ],
              [
                "Incline",
                telemetry.inclinePercent === undefined
                  ? "Not provided"
                  : `${telemetry.inclinePercent}%`,
              ],
              [
                "Device elapsed",
                telemetry.elapsedSeconds === undefined
                  ? "Not provided"
                  : formatRunTime(telemetry.elapsedSeconds),
              ],
              [
                "Device distance",
                telemetry.distanceMeters === undefined
                  ? "Not provided"
                  : `${(telemetry.distanceMeters / 1000).toFixed(2)} km`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[#a1b68d]">{label}</dt>
                <dd className="mt-2">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[10px]">
            Use the treadmill’s own belt controls. App Start / Pause / Stop
            manage session tracking. Device totals may include activity before
            this session; only new distance during active tracking is recorded.
          </p>
        </section>
      )}
      <section
        className="rounded-2xl border border-[#3d502d] bg-linear-to-br from-[#29391e] to-[#172012] p-5 text-center sm:p-8"
        aria-labelledby="run-session-heading"
      >
        <h2 id="run-session-heading" className="text-lg">
          Your run session
        </h2>
        <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-[#b4ce99]">
          {view.status}
        </span>
        <div className="mx-auto my-7 flex size-48 flex-col items-center justify-center rounded-full border-2 border-[#789c50] bg-[#ccf66b]/5 sm:size-56">
          <Footprints className="lime mb-3" size={30} />
          <strong className="text-4xl font-bold tabular-nums sm:text-5xl">
            {formatRunTime(view.elapsedSeconds)}
          </strong>
          <span className="mt-3 text-[9px] tracking-widest text-[#a9c28e]">
            ACTIVE TIME
          </span>
        </div>
        <dl className="mb-7 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          {[
            ["Distance", `${(view.distanceMeters / 1000).toFixed(2)} km`],
            ["Current pace", `${formatPace(view.currentPaceSeconds)} / km`],
            ["Average pace", `${formatPace(view.averagePaceSeconds)} / km`],
            ["Steps", view.steps.toLocaleString("en")],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] text-[#a9bf94]">{label}</dt>
              <dd className="mt-2 text-xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mb-5 text-[10px]">
          Distance source: {view.distanceSource} / steps: {view.stepSource}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {view.status === "idle" && (
            <button
              type="button"
              className="button primary"
              disabled={view.mode === "ftms" && btState !== "Connected"}
              onClick={start}
            >
              <Play size={17} />
              Start run
            </button>
          )}
          {view.status === "running" && (
            <button type="button" className="button primary" onClick={pause}>
              <Pause size={17} />
              Pause
            </button>
          )}
          {view.status === "paused" && (
            <button
              type="button"
              className="button primary"
              disabled={view.mode === "ftms" && btState !== "Connected"}
              onClick={resume}
            >
              <Play size={17} />
              Resume
            </button>
          )}
          {active && (
            <button type="button" className="button secondary" onClick={stop}>
              <Square size={17} />
              Stop &amp; save run
            </button>
          )}
          {view.status === "stopped" && !pendingSave && (
            <button
              type="button"
              className="button primary"
              onClick={() => configure(view.mode)}
            >
              New run
            </button>
          )}
          {pendingSave && (
            <button
              type="button"
              className="button primary"
              onClick={() => save(pendingSave)}
            >
              Retry saving run
            </button>
          )}
        </div>
        <p className="mt-5 text-xs" role="status">
          {notice ||
            (isDemo
              ? "Stop saves a demo run in this tab. Keep this page visible while tracking."
              : "Stop saves a completed run to your account. Keep this page open and visible while tracking.")}
        </p>
      </section>
      <section className="mt-6 rounded-2xl border border-[#35472a] bg-[#192315] p-5">
        <h2>Steps, your way</h2>
        <p className="mt-2 text-xs" role="status">
          {motionEnabled && view.status !== "running"
            ? "Motion estimation is enabled and will run during active tracking."
            : motionStatus}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="button secondary disabled:opacity-40"
            type="button"
            disabled={motionPending || motionEnabled}
            onClick={() => {
              void enableMotion();
            }}
          >
            {motionPending
              ? "Requesting motion permission..."
              : motionEnabled
                ? "Motion estimation enabled"
                : "Enable motion step estimation"}
          </button>
          {motionEnabled && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setMotionEnabled(false);
                setMotionStatus(
                  "Motion estimation disabled. Existing steps are kept.",
                );
              }}
            >
              Disable motion
            </button>
          )}
        </div>
        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={applySteps}
        >
          <label htmlFor="manual-steps" className="grow text-xs">
            Manual step count
            <input
              id="manual-steps"
              type="number"
              min="0"
              max="2000000"
              step="1"
              className="plan-input"
              required
              disabled={!active}
              value={stepsDraft}
              onChange={(event) => setStepsDraft(event.target.value)}
            />
          </label>
          <button
            className="button secondary disabled:opacity-40"
            type="submit"
            disabled={!active || stepsDraft === ""}
          >
            Apply steps
          </button>
        </form>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label htmlFor="stride-length" className="grow text-xs">
            Estimated step length (meters)
            <input
              id="stride-length"
              type="number"
              min="0.3"
              max="1.5"
              step="0.01"
              className="plan-input"
              value={stride}
              onChange={(event) =>
                setStride(
                  Math.max(
                    0.3,
                    Math.min(1.5, Number(event.target.value) || 0.75),
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="button secondary disabled:opacity-40"
            disabled={!active || view.distanceMeters === 0}
            onClick={() => {
              engine.setSteps(
                Math.round(view.distanceMeters / stride),
                "distance estimate",
              );
              refresh();
            }}
          >
            Estimate steps from distance
          </button>
        </div>
        <p className="mt-4 text-[10px]">
          Motion and distance-based steps are estimates. A phone held still on a
          treadmill cannot measure your steps from motion.
        </p>
      </section>
      <RunHistory compact />
    </>
  );
}
