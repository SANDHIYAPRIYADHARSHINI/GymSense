"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import type { Exercise } from "@/data/exercises";
import { PageHeading } from "./landing";
import { PoseCounter } from "./pose-counter";
import { ExerciseDemo } from "./exercise-demo";
type LoggedSet = { id: number; value: number; unit: "reps" | "seconds" };
export function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const [unit, setUnit] = useState<"reps" | "seconds">(
    exercise.repCountingRules.mode === "hold" ? "seconds" : "reps",
  );
  const [count, setCount] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const nextId = useRef(1);
  function logSet(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isInteger(count) || count < 1 || count > 9999) return;
    setLoggedSets((current) => [
      ...current,
      { id: nextId.current++, value: count, unit },
    ]);
    setCount(0);
  }
  return (
    <>
      <Link
        href="/exercises"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-xs text-[#ccf66b]"
      >
        <ArrowLeft size={16} />
        Back to exercise library
      </Link>
      <PageHeading
        eyebrow="FORM FIRST. PROGRESS FOLLOWS."
        title={exercise.name}
        description={exercise.targetMuscles.join(" / ")}
      />
      <div className="mb-7 flex flex-wrap gap-3">
        <span className="pill">{exercise.difficulty}</span>
        {exercise.equipment.map((item) => (
          <span className="pill" key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ExerciseDemo exercise={exercise} />
          <PoseCounter
            exercise={exercise}
            onUseCount={(reps) => {
              setUnit("reps");
              setCount(reps);
            }}
          />
        </div>
        <div className="space-y-6">
          <section className="panel" aria-labelledby="instructions-heading">
            <h2 id="instructions-heading">How to do it</h2>
            <h3 className="mt-5 text-base">Target muscles</h3>
            <p className="mt-2 text-sm">{exercise.targetMuscles.join(", ")}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-[#929a8c]">Difficulty</dt>
                <dd className="mt-2">{exercise.difficulty}</dd>
              </div>
              <div>
                <dt className="text-[#929a8c]">Equipment</dt>
                <dd className="mt-2">{exercise.equipment.join(", ")}</dd>
              </div>
            </dl>
            <h3 className="mt-7 text-base">Instructions</h3>
            <ol className="instruction-list list-decimal">
              {exercise.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <h3 className="mb-3 text-base">Common mistakes</h3>
            <ul className="list-disc space-y-3 pl-5 text-sm text-[#b9c6ad]">
              {exercise.commonMistakes.map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </section>
          <section className="panel" aria-labelledby="logger-heading">
            <h2 id="logger-heading">Manual set &amp; rep logger</h2>
            <p className="mt-2 text-xs">
              Log what you completed. Entries last for this page visit and do
              not complete plan exercises automatically.
            </p>
            <form onSubmit={logSet} className="mt-5">
              <label className="text-xs" htmlFor="log-unit">
                What are you logging?
                <select
                  id="log-unit"
                  value={unit}
                  className="plan-input"
                  onChange={(e) => {
                    setUnit(e.target.value as "reps" | "seconds");
                    setCount(0);
                  }}
                >
                  <option value="reps">Repetitions</option>
                  <option value="seconds">Hold duration (seconds)</option>
                </select>
              </label>
              <label htmlFor="set-count" className="mt-5 block text-xs">
                {unit === "reps" ? "Reps in this set" : "Seconds held"}
              </label>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="icon-button shrink-0"
                  disabled={count === 0}
                  aria-label={`Decrease ${unit}`}
                  onClick={() => setCount((value) => Math.max(0, value - 1))}
                >
                  <Minus size={18} />
                </button>
                <input
                  id="set-count"
                  className="plan-input mt-0 text-center"
                  type="number"
                  min="0"
                  max="9999"
                  step="1"
                  required
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
                <button
                  type="button"
                  className="icon-button plus shrink-0"
                  aria-label={`Increase ${unit}`}
                  disabled={count >= 9999}
                  onClick={() => setCount((value) => Math.min(9999, value + 1))}
                >
                  <Plus size={18} />
                </button>
              </div>
              <button
                type="submit"
                className="button primary full mt-5 disabled:opacity-40"
                disabled={!Number.isInteger(count) || count < 1 || count > 9999}
              >
                <Plus size={17} />
                Log set
              </button>
            </form>
            <p
              role="status"
              aria-live="polite"
              className="mt-5 text-xs text-[#ccf66b]"
            >
              {loggedSets.length} sets logged /{" "}
              {loggedSets
                .filter((set) => set.unit === "reps")
                .reduce((sum, set) => sum + set.value, 0)}{" "}
              reps /{" "}
              {loggedSets
                .filter((set) => set.unit === "seconds")
                .reduce((sum, set) => sum + set.value, 0)}{" "}
              sec
            </p>
            <ol className="mt-4 space-y-2">
              {loggedSets.map((set, index) => (
                <li
                  key={set.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2 text-xs"
                >
                  <span>
                    Set {index + 1}:{" "}
                    <strong>
                      {set.value} {set.unit}
                    </strong>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove set ${index + 1}`}
                    className="flex min-h-11 min-w-11 items-center justify-center text-[#a9b99b] hover:text-red-300"
                    onClick={() =>
                      setLoggedSets((current) =>
                        current.filter((item) => item.id !== set.id),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
