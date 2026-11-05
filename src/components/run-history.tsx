"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import { formatPace, formatRunTime } from "@/lib/run/engine";
import {
  restoreRuns,
  RUN_STORAGE_KEY,
  RUNS_UPDATED_EVENT,
  type SavedRun,
} from "@/lib/run/storage";
const modeLabels = {
  outdoor: "Outdoor GPS",
  manual: "Manual treadmill",
  ftms: "FTMS treadmill",
};
export function RunHistory({ compact = false }: { compact?: boolean }) {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [all, setAll] = useState(false);
  useEffect(() => {
    let active = true;
    function read() {
      if (!active) return;
      try {
        setRuns(restoreRuns(localStorage.getItem(RUN_STORAGE_KEY)));
        setError("");
      } catch {
        setError(
          "Saved runs are unavailable because browser storage is blocked.",
        );
      }
      setReady(true);
    }
    queueMicrotask(read);
    const storage = (event: StorageEvent) => {
      if (event.key === RUN_STORAGE_KEY || event.key === null) read();
    };
    window.addEventListener("storage", storage);
    window.addEventListener(RUNS_UPDATED_EVENT, read);
    return () => {
      active = false;
      window.removeEventListener("storage", storage);
      window.removeEventListener(RUNS_UPDATED_EVENT, read);
    };
  }, []);
  const visible = runs.slice(0, compact ? 3 : all ? 100 : 10);
  return (
    <section className="mt-8" aria-labelledby="run-history-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">YOUR RECORDED MILES</p>
          <h2 id="run-history-heading">Completed run history</h2>
        </div>
        <span className="pill">SAVED ON THIS BROWSER</span>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-xs text-amber-200">
          {error}
        </p>
      )}
      {!ready ? (
        <p className="panel">Loading saved runs...</p>
      ) : !runs.length ? (
        <div className="rounded-2xl border border-dashed border-[#425635] p-7">
          <Footprints className="lime mb-3" />
          <h3>Your first run starts a story.</h3>
          <p className="mt-2 text-sm">Stop a tracked run to save it here.</p>
          <Link
            href="/run"
            className="mt-3 inline-flex min-h-11 items-center text-xs text-[#ccf66b]"
          >
            Open run tracker
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((run) => (
            <article
              key={run.id}
              className="rounded-xl border border-[#36472a] bg-[#192114] p-5"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base">{modeLabels[run.mode]}</h3>
                  <p className="mt-1 text-xs">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(run.endedAt))}
                  </p>
                </div>
                <strong className="text-xl text-[#ccf66b]">
                  {(run.distanceMeters / 1000).toFixed(2)} km
                </strong>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-[#9fb48d]">Active time</dt>
                  <dd className="mt-1">{formatRunTime(run.durationSeconds)}</dd>
                </div>
                <div>
                  <dt className="text-[#9fb48d]">Average pace</dt>
                  <dd className="mt-1">
                    {formatPace(run.averagePaceSeconds)} / km
                  </dd>
                </div>
                <div>
                  <dt className="text-[#9fb48d]">Steps</dt>
                  <dd className="mt-1">{run.steps.toLocaleString("en")}</dd>
                </div>
                <div>
                  <dt className="text-[#9fb48d]">Step source</dt>
                  <dd className="mt-1">{run.stepSource}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[10px]">Distance: {run.distanceSource}</p>
            </article>
          ))}
        </div>
      )}
      {compact && runs.length > 0 && (
        <Link
          href="/profile"
          className="mt-4 inline-flex min-h-11 items-center text-xs text-[#ccf66b]"
        >
          View profile run history
        </Link>
      )}
      {!compact && runs.length > 10 && !all && (
        <button
          type="button"
          className="button secondary mt-4"
          onClick={() => setAll(true)}
        >
          Show all {runs.length} saved runs
        </button>
      )}
      <p className="mt-4 text-[10px]">
        Run summaries stay on this browser. GPS coordinates are not saved. These
        sessions are separate from the sample profile streaks and challenges.
      </p>
    </section>
  );
}
