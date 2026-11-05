"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
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
