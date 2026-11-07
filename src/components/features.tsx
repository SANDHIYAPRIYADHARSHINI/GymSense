"use client";
import Link from "next/link";
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
