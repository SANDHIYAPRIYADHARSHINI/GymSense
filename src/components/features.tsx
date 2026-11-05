"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Footprints,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { PageHeading, GoalCards } from "./landing";
export function Dashboard() {
  return (
    <>
      <PageHeading
        eyebrow="YOUR NEXT CHAPTER"
        title="One goal. A thousand possibilities."
        description="Pick your focus. We�ll bring the plan. You bring the energy."
      />
      <GoalCards />
      <div className="panel callout">
        <Zap className="lime" />
        <div>
          <h3>Start where you are.</h3>
          <p>
            Every plan includes three balanced sessions, guided exercises, and
            time to recover. All plans are sample routines.
          </p>
        </div>
      </div>
      <Link className="button secondary" href="/diet">
        Explore nutrition <ArrowRight size={17} />
      </Link>
    </>
  );
}
export function Run() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [speed, setSpeed] = useState(8);
  const [distance, setDistance] = useState(0);
  const [mode, setMode] = useState("Outdoor demo");
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
      setDistance((d) => d + speed / 3600);
    }, 1000);
    return () => clearInterval(interval);
  }, [running, speed]);
  return (
    <>
      <PageHeading
        eyebrow="FIND YOUR STRIDE"
        title="Your only limit is your next step."
        description="A simple running companion. Set your pace and get moving."
      />
      <div className="tabs">
        {["Outdoor demo", "Treadmill"].map((m) => (
          <button
            key={m}
            className={mode === m ? "active" : ""}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="run-panel panel">
        <div className={`run-orbit ${running ? "running" : ""}`}>
          <Footprints size={36} />
          <strong>{formatTime(seconds)}</strong>
          <span>{running ? "YOU�RE MOVING" : "READY WHEN YOU ARE"}</span>
        </div>
        <div className="run-stats">
          <div>
            <strong>{distance.toFixed(2)}</strong>
            <span>KILOMETERS</span>
          </div>
          <div>
            <strong>{speed.toFixed(1)}</strong>
            <span>KM / H</span>
          </div>
          <div>
            <strong>{formatTime(Math.round(3600 / speed))}</strong>
            <span>MIN / KM</span>
          </div>
        </div>
        <label className="speed-label" htmlFor="speed">
          {mode === "Treadmill" ? "Treadmill speed" : "Simulated pace"}{" "}
          <span>{speed} km/h</span>
        </label>
        <input
          id="speed"
          type="range"
          min="3"
          max="18"
          step="0.5"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <div className="button-row">
          <button
            className="button primary"
            onClick={() => setRunning((v) => !v)}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}{" "}
            {running ? "Pause run" : seconds ? "Resume run" : "Start run"}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setRunning(false);
              setSeconds(0);
              setDistance(0);
            }}
          >
            <RotateCcw size={17} /> Reset
          </button>
        </div>
        <p className="helper">
          Demo tracker: distance is calculated from the selected speed. No GPS,
          treadmill connection, or background tracking.
        </p>
      </div>
    </>
  );
}
export function Login() {
  const [message, setMessage] = useState("");
  return (
    <div className="login-wrap">
      <PageHeading
        eyebrow="WELCOME TO YOUR NEXT LEVEL"
        title="Good to see you."
        description="Your goals are right where you left them."
      />
      <form
        className="panel login-form"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(
            "This is a UI demo. No account is created and credentials are not sent or stored.",
          );
        }}
      >
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          minLength={6}
          required
        />
        <button className="button primary full" type="submit">
          Sign in (demo) <ArrowRight size={17} />
        </button>
        {message && (
          <p role="status" className="helper">
            {message}
          </p>
        )}
        <div className="login-divider">JUST EXPLORING?</div>
        <Link href="/dashboard" className="button secondary full">
          Continue with demo
        </Link>
        <p className="helper">Mock workspace � No authentication connected</p>
      </form>
    </div>
  );
}
