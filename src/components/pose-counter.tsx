"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { CoachMessage, Exercise } from "@/data/exercises";
import {
  analyzePose,
  RepCounter,
  type CounterSnapshot,
} from "@/lib/pose/counter";
import { createPoseLandmarker } from "@/lib/pose/landmarker";
import { drawSkeleton, isFrameDark } from "@/lib/pose/drawing";
import { CoachSession, evaluateForm, type SetScore } from "@/lib/pose/coaching";
import { CoachSpeech } from "@/lib/pose/speech";
import { DEMO_OPEN_EVENT } from "@/lib/demo";
const initial: CounterSnapshot = { reps: 0, state: "Ready", angle: null };
export function PoseCounter({
  exercise,
  onUseCount,
}: {
  exercise: Exercise;
  onUseCount: (reps: number) => void;
}) {
  const config = exercise.liveCounter;
  const engine = useMemo(
    () => (config ? new RepCounter(config) : null),
    [config],
  );
  const coach = useMemo(() => new CoachSession(), []);
  const speech = useMemo(() => new CoachSpeech(), []);
  const voiceEnabled = useRef(false);
  const [spoken, setSpoken] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [feedback, setFeedback] = useState<CoachMessage | null>(null);
  const [setScores, setSetScores] = useState<SetScore[]>([]);
  const [emptySet, setEmptySet] = useState(false);
  const [snapshot, setSnapshot] = useState(initial);
  const [target, setTarget] = useState(config?.targetReps ?? 12);
  const [stage, setStage] = useState<"idle" | "starting" | "running">("idle");
  const [hasVideo, setHasVideo] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    "Start when you are ready. Camera access is requested only after you click.",
  );
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const detector = useRef<PoseLandmarker | null>(null);
  const abort = useRef<AbortController | null>(null);
  const frame = useRef<number | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const release = useCallback(() => {
    speech.cancel();
    generation.current++;
    busy.current = false;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    abort.current?.abort();
    abort.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    detector.current?.close();
    detector.current = null;
    if (video.current) {
      video.current.pause();
      video.current.srcObject = null;
    }
    const overlay = canvas.current;
    overlay?.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
  }, [speech]);
  const stop = useCallback(() => {
    release();
    setStage("idle");
    setHasVideo(false);
    setSnapshot(engine?.invalidate() ?? initial);
    coach.record(
      engine?.lastEvent() ?? null,
      exercise.coaching,
      performance.now(),
    );
    setFeedback(null);
    setMessage(
      "Camera stopped. Your count is kept until you reset or leave this page.",
    );
  }, [release, engine, coach, exercise.coaching]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", stop);
    window.addEventListener(DEMO_OPEN_EVENT, stop);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener(DEMO_OPEN_EVENT, stop);
      release();
    };
  }, [release, stop]);
  async function start() {
    if (busy.current || stream.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access needs HTTPS or localhost in a supported browser such as Chrome.",
      );
      return;
    }
    busy.current = true;
    const session = ++generation.current;
    const controller = new AbortController();
    abort.current = controller;
    setStage("starting");
    setError("");
    setMessage("Waiting for camera permission...");
    setSnapshot(engine?.invalidate() ?? initial);
    setFeedback(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      });
      if (session !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const input = video.current;
      if (!input)
        throw new Error(
          "Camera preview is unavailable. Retry starting the camera.",
        );
      input.srcObject = media;
      await input.play();
      if (session !== generation.current) return;
      setHasVideo(true);
      media.getVideoTracks()[0]?.addEventListener(
        "ended",
        () => {
          if (session === generation.current) {
            stop();
            setError(
              "The camera was disconnected. Reconnect it and start again.",
            );
          }
        },
        { once: true },
      );
      if (!config || !engine) {
        setStage("running");
        setMessage(
          "Preview only for this exercise. Live counting supports squats, push-ups, and jumping jacks; use the manual logger below.",
        );
        return;
      }
      setMessage("Loading the local pose model...");
      const model = await createPoseLandmarker(controller.signal);
      if (session !== generation.current) {
        model.close();
        return;
      }
      detector.current = model;
      setStage("running");
      const sample = document.createElement("canvas");
      sample.width = 24;
      sample.height = 18;
      let lastVideoTime = -1,
        lastTick = -Infinity,
        lastUi = -Infinity,
        lastLight = -Infinity,
        dark = false;
      const tick = (now: number) => {
        if (session !== generation.current) return;
        try {
          if (
            input.readyState >= 2 &&
            input.videoWidth > 0 &&
            input.currentTime !== lastVideoTime &&
            now - lastTick >= 80
          ) {
            lastTick = now;
            lastVideoTime = input.currentTime;
            const overlay = canvas.current;
            if (overlay) {
              if (overlay.width !== input.videoWidth)
                overlay.width = input.videoWidth;
              if (overlay.height !== input.videoHeight)
                overlay.height = input.videoHeight;
            }
            if (now - lastLight > 1000) {
              dark = isFrameDark(input, sample);
              lastLight = now;
            }
            let guidance: string;
            let current: CounterSnapshot;
            let cue: CoachMessage | null = null;
            if (dark) {
              if (overlay) drawSkeleton(overlay, []);
              current = engine.invalidate();
              cue = coach.update(
                [],
                engine.lastEvent(),
                exercise.coaching,
                now,
                false,
              );
              guidance =
                "Too dark to track reliably. Add light in front of you; counting is paused.";
            } else {
              const result = model.detectForVideo(input, now);
              try {
                const points = result.landmarks[0] ?? [];
                const measurement = analyzePose(
                  points,
                  config,
                  input.videoWidth / input.videoHeight,
                  engine.preferredSide(),
                );
                if (overlay)
                  drawSkeleton(overlay, points, config.minVisibility);
                const wasMoving = engine.isMoving();
                current = engine.update(measurement, now);
                const warnings = measurement.valid
                  ? evaluateForm(
                      points,
                      exercise.coaching.formRules,
                      current.state === "Up" && engine.isMoving()
                        ? "Ready"
                        : current.state,
                      measurement.side,
                      input.videoWidth / input.videoHeight,
                      config.minVisibility,
                    )
                  : [];
                cue = coach.update(
                  warnings,
                  engine.lastEvent(),
                  exercise.coaching,
                  now,
                  measurement.valid,
                  wasMoving || engine.isMoving(),
                );
                if (cue && voiceEnabled.current)
                  setVoiceStatus(
                    speech.speak(cue, now)
                      ? "Spoken cues enabled."
                      : "No local English voice is available yet. Visual coaching remains active.",
                  );
                if (!measurement.valid) speech.cancel();
                guidance = measurement.valid
                  ? measurement.message
                  : "Tracking paused. Keep your whole body visible, improve lighting, and avoid covering your joints.";
              } finally {
                result.close();
              }
            }
            if (now - lastUi >= 150) {
              setSnapshot(current);
              setFeedback(cue);
              setMessage(guidance);
              lastUi = now;
            }
          }
          frame.current = requestAnimationFrame(tick);
        } catch {
          release();
          setStage("idle");
          setHasVideo(false);
          setSnapshot(engine.invalidate());
          coach.record(
            engine.lastEvent(),
            exercise.coaching,
            performance.now(),
          );
          setFeedback(null);
          setError(
            "Pose detection stopped unexpectedly. Reset your position and start again. Manual logging remains available.",
          );
        }
      };
      frame.current = requestAnimationFrame(tick);
    } catch (cause) {
      if (session !== generation.current) return;
      release();
      setStage("idle");
      setHasVideo(false);
      const name = cause instanceof DOMException ? cause.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in Chrome’s site settings, then retry."
          : name === "NotFoundError"
            ? "No camera was found. Connect a webcam and retry."
            : name === "NotReadableError"
              ? "The camera is busy or unavailable. Close other camera apps and retry."
              : cause instanceof Error && cause.message.includes("local pose")
                ? cause.message
                : "Unable to start the camera or local pose model. Check camera access and run npm install to prepare local assets, then retry.",
      );
    } finally {
      if (session === generation.current) {
        busy.current = false;
      }
    }
  }
  function reset() {
    setSnapshot(engine?.reset() ?? initial);
    coach.reset();
    speech.cancel();
    setFeedback(null);
    setEmptySet(false);
    setMessage(
      stage === "running"
        ? "Count reset. Return to the starting position to begin a new cycle."
        : "Count reset. Start your camera when ready.",
    );
  }
  function finishSet() {
    if (!engine) return;
    engine.invalidate();
    coach.record(engine.lastEvent(), exercise.coaching, performance.now());
    const score = coach.score();
    if (score.score === null) {
      setEmptySet(true);
      return;
    }
    setSetScores((previous) => [...previous, score]);
    setEmptySet(false);
    coach.reset();
    setSnapshot(engine.reset());
    setFeedback(null);
    speech.cancel();
  }
  function toggleSpeech(enabled: boolean) {
    if (enabled && !("speechSynthesis" in window)) {
      setVoiceStatus("Speech synthesis is unavailable in this browser.");
      return;
    }
    voiceEnabled.current = enabled;
    setSpoken(enabled);
    speech.cancel();
    if (enabled) {
      window.speechSynthesis.getVoices();
      setVoiceStatus(
        "Spoken cues enabled when an on-device English voice is available.",
      );
    } else setVoiceStatus("");
  }
  return (
    <section className="panel camera-panel" aria-labelledby="camera-heading">
      <h2 id="camera-heading" className="mb-4">
        Camera rep counter
      </h2>
      <div
        className="relative overflow-hidden rounded-xl bg-[#10170d]"
        style={{ aspectRatio: "4 / 3" }}
      >
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          aria-label="Live webcam feed"
          className={`absolute inset-0 h-full w-full -scale-x-100 object-contain ${hasVideo ? "" : "invisible"}`}
        />
        <canvas
          ref={canvas}
          aria-label="Detected body skeleton overlay"
          className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-contain"
        />
        {!hasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera size={42} className="lime" aria-hidden="true" />
            <h3>Your space. Your pace.</h3>
            <p className="text-xs">
              {config
                ? "Full-body tracking. Every complete rep."
                : "Camera preview with manual logging."}
            </p>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 text-[9px] tracking-wider text-[#ccf66b]">
          {config ? "ON-DEVICE POSE TRACKING" : "LOCAL CAMERA PREVIEW"}
        </span>
      </div>
      {config && (
        <>
          <div className="my-5 grid grid-cols-3 gap-2 text-center">
            <div>
              <strong
                className="block text-4xl font-bold text-[#ccf66b]"
                aria-live="polite"
              >
                {snapshot.reps}
              </strong>
              <span className="text-[10px] text-[#a5b09b]">REP COUNT</span>
            </div>
            <div>
              <strong className="block text-2xl font-bold">
                {snapshot.angle === null
                  ? "—"
                  : `${Math.round(snapshot.angle)}°`}
              </strong>
              <span className="text-[10px] text-[#a5b09b]">
                {config.metric === "knee"
                  ? "KNEE"
                  : config.metric === "elbow"
                    ? "ELBOW"
                    : "SHOULDER"}{" "}
                ANGLE
              </span>
            </div>
            <div>
              <strong className="block text-2xl font-bold">
                {snapshot.state}
              </strong>
              <span className="text-[10px] text-[#a5b09b]">STATE</span>
            </div>
          </div>
          <label
            className="mb-4 flex items-center justify-between gap-4 text-xs"
            htmlFor="target-reps"
          >
            Target reps
            <input
              id="target-reps"
              className="plan-input max-w-24"
              type="number"
              min="1"
              max="999"
              step="1"
              value={target}
              onChange={(e) =>
                setTarget(
                  Math.min(
                    999,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                )
              }
            />
          </label>
          <p className="mb-3 text-xs text-[#b9cca7]">
            {snapshot.reps >= target
              ? "Target reached."
              : `${Math.max(0, target - snapshot.reps)} reps to your target.`}
          </p>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="button primary grow"
          onClick={stage === "idle" ? start : stop}
        >
          <Camera size={17} />
          {stage === "starting"
            ? "Cancel startup"
            : stage === "running"
              ? "Stop Camera"
              : "Start Camera Rep Counter"}
        </button>
        {config && (
          <button type="button" className="button secondary" onClick={reset}>
            <RotateCcw size={17} />
            Reset Count
          </button>
        )}
      </div>
      {config && (
        <div className="mt-5 space-y-4">
          <div
            className="min-h-14 rounded-xl border border-[#ccf66b]/20 bg-[#ccf66b]/5 p-4 text-sm text-[#d9f7b0]"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {feedback ?? "Live coaching will appear here when there is a cue."}
          </div>
          <p className="text-xs text-[#a5b09b]">
            Rep tempo: {exercise.coaching.minRepDurationMs / 1000}?
            {exercise.coaching.maxRepDurationMs / 1000} seconds. Too-fast reps
            do not count.
          </p>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-xs">
            <input
              type="checkbox"
              className="size-5 accent-[#ccf66b]"
              checked={spoken}
              onChange={(event) => toggleSpeech(event.target.checked)}
            />
            Spoken coaching (optional)
          </label>
          {voiceStatus && (
            <p className="text-xs text-[#a5b09b]">{voiceStatus}</p>
          )}
          <button
            type="button"
            className="button secondary full"
            onClick={finishSet}
          >
            Finish Set &amp; Show Score
          </button>
          {emptySet && (
            <p className="text-xs text-[#a5b09b]">
              No movement attempts to score yet. Start your camera and complete
              a rep first.
            </p>
          )}
          {setScores.map((score, index) => (
            <section
              key={index}
              className="rounded-xl border border-[#425631] bg-[#202a19] p-4"
              aria-label={"Set " + (index + 1) + " form score"}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base">Set {index + 1}</h3>
                <strong className="text-2xl text-[#ccf66b]">
                  {score.score}/100
                </strong>
              </div>
              <p className="mt-2 text-xs">
                {score.acceptedReps} counted / {score.attempts} attempts
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-[#a5b09b]">Completeness</dt>
                  <dd className="mt-1">{score.completeness}%</dd>
                </div>
                <div>
                  <dt className="text-[#a5b09b]">Tempo</dt>
                  <dd className="mt-1">{score.tempoConsistency}%</dd>
                </div>
                <div>
                  <dt className="text-[#a5b09b]">Form</dt>
                  <dd className="mt-1">{score.form}%</dd>
                </div>
              </dl>
              <button
                type="button"
                className="mt-3 min-h-11 text-xs text-[#ccf66b] disabled:opacity-40"
                disabled={!score.acceptedReps}
                onClick={() => onUseCount(score.acceptedReps)}
              >
                Use set reps in manual logger
              </button>
            </section>
          ))}
          <p className="text-[10px] text-[#929a8c]">
            Score uses visible camera observations: 40% completed attempts, 30%
            tempo consistency, 30% time without form warnings. This is a
            training estimate. Reset Count discards the current set; finished
            scores remain for this visit.
          </p>
        </div>
      )}
      <p className="helper" role="status">
        {message}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-400/10 p-3 text-xs text-red-200"
        >
          {error}
        </p>
      )}
      {config && (
        <>
          <p className="helper">
            {config.metric === "jumping-jack"
              ? "Face forward. Up = arms down, feet together. Down = arms overhead, feet apart. Return to Up to count."
              : "Stand side-on with your full body visible. Start extended (Up), move Down, then return to Up to count."}
          </p>
          <button
            type="button"
            className="mt-3 min-h-11 text-xs text-[#ccf66b] disabled:opacity-40"
            disabled={!snapshot.reps}
            onClick={() => onUseCount(snapshot.reps)}
          >
            Use camera count in manual logger
          </button>
        </>
      )}
      <p className="helper">
        Video and landmarks stay in this browser. No footage is recorded or
        uploaded. Switching tabs stops the camera.
      </p>
    </section>
  );
}
