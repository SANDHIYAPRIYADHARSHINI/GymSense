"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Flame,
  Footprints,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trophy,
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
export function Friends() {
  const [joined, setJoined] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="BETTER TOGETHER"
        title="Your people. Your motivation."
        description="A little friendly competition goes a long way."
      />
      <section className="challenge panel">
        <Trophy size={40} className="lime" />
        <span className="card-tag">THIS WEEK�S COMMUNITY CHALLENGE</span>
        <h2>The 20K step club.</h2>
        <p>One week. 20,000 steps. A whole lot of good energy.</p>
        <div className="progress-track">
          <span style={{ width: joined ? "42%" : "0%" }} />
        </div>
        <p>
          {joined
            ? "8,400 / 20,000 sample steps"
            : "Join Alex, Maya, and Jordan in this demo challenge."}
        </p>
        <button className="button primary" onClick={() => setJoined((v) => !v)}>
          {joined ? <Check size={17} /> : <Plus size={17} />}{" "}
          {joined ? "Joined � leave challenge" : "Join challenge"}
        </button>
        <p className="helper">
          Demo membership only. No invitations or notifications are sent.
        </p>
      </section>
      <h2 className="spaced-heading">Your training circle</h2>
      <div className="friend-grid">
        {[
          {
            name: "Maya Chen",
            initials: "MC",
            streak: 12,
            activity: "Finished a strength session",
          },
          {
            name: "Jordan Lee",
            initials: "JL",
            streak: 8,
            activity: "Ran a steady 5K",
          },
          {
            name: "Sam Rivera",
            initials: "SR",
            streak: 6,
            activity: "Hit their weekly goal",
          },
        ].map((f) => (
          <div className="panel friend" key={f.name}>
            <div className="avatar">{f.initials}</div>
            <h3>{f.name}</h3>
            <p>{f.activity}</p>
            <span className="pill">
              <Flame size={14} /> {f.streak}-day streak
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
export function Profile() {
  return (
    <>
      <PageHeading
        eyebrow="THE WORK IS ADDING UP"
        title="Look how far you�ve come."
        description="Every small effort is part of something bigger."
      />
      <div className="profile-header panel">
        <div className="avatar large">AJ</div>
        <div>
          <h2>Alex Johnson</h2>
          <p>Building strength, one day at a time.</p>
          <span className="pill">DEMO ATHLETE</span>
        </div>
        <Link href="/dashboard" className="button secondary">
          Choose a goal <ArrowRight size={16} />
        </Link>
      </div>
      <div className="profile-stats">
        {[
          ["12", "Day streak"],
          ["24", "Workouts"],
          ["18.5", "Kilometers"],
          ["8", "Active weeks"],
        ].map(([v, l]) => (
          <div className="panel" key={l}>
            <strong>{v}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONSISTENCY LOOKS GOOD ON YOU</p>
            <h2>Your activity, at a glance.</h2>
          </div>
          <span className="pill">
            <Flame size={15} /> 12-day streak
          </span>
        </div>
        <p className="muted">Last 12 weeks � sample activity</p>
        <div
          className="streak-graph"
          role="img"
          aria-label="Sample activity graph showing 12 weeks of exercise with varying activity levels"
        >
          {Array.from({ length: 84 }, (_, i) => (
            <div
              key={i}
              className={`streak-cell level-${(i * 7 + (i % 5)) % 4}`}
              title={`Sample day ${i + 1}: ${(i * 7 + (i % 5)) % 4} activities`}
            />
          ))}
        </div>
        <div className="graph-legend">
          Less{" "}
          {[0, 1, 2, 3].map((n) => (
            <i key={n} className={`level-${n}`} />
          ))}{" "}
          More
        </div>
      </section>
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
