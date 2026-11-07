"use client";
import Link from "next/link";
import { exercises as exerciseLibrary } from "@/data/exercises";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  LockKeyhole,
  Plus,
  Trash2,
} from "lucide-react";
import { type PlanExercise, type WorkoutPlan } from "@/data/workoutPlans";
import {
  canCompleteDay,
  completeDay,
  editCustomDay,
  emptyProgress,
  getDay,
  isDayUnlocked,
  restoreProgress,
  toggleExercise,
  type PlanProgress,
} from "@/lib/workoutProgress";
import { useAuth } from "./auth-provider";
import { mutatePlan } from "@/lib/firestore/workouts";
import { cloudError } from "@/lib/firebase";
import type { Goal } from "@/lib/firestore/types";
import { PageHeading } from "./landing";
import { ExerciseDemo } from "./exercise-demo";
const libraryIds = new Set(exerciseLibrary.map((ex) => ex.id));
export function WorkoutPlanView({ plan }: { plan: WorkoutPlan }) {
  const { user, progress: cloudProgress, isDemo } = useAuth();
  const progress = restoreProgress(
    JSON.stringify(cloudProgress.plans[plan.id as Goal] ?? emptyProgress()),
    plan,
    libraryIds,
  );
  const [busy, setBusy] = useState(false);
  const ready = !!user && !busy;
  const [storageError, setStorageError] = useState("");
  const [selectedDay, setSelectedDay] = useState(
    () =>
      plan.days.find((d) => !progress.completedDays.includes(d.day))?.day ?? 3,
  );
  const [exerciseId, setExerciseId] = useState(exerciseLibrary[0].id);
  const [sets, setSets] = useState(3);
  const [target, setTarget] = useState(10);
  const [mode, setMode] = useState("reps");
  const [rest, setRest] = useState(60);
  async function save(change: (previous: PlanProgress) => PlanProgress) {
    if (!ready || !user) return;
    setBusy(true);
    setStorageError("");
    try {
      await mutatePlan(user.uid, plan, change);
    } catch (e) {
      setStorageError(cloudError(e));
    } finally {
      setBusy(false);
    }
  }
  const day = getDay(plan, progress, selectedDay);
  const completed = progress.completedDays.includes(selectedDay);
  const completedIds = progress.completedExercises[selectedDay] ?? [];
  const available = exerciseLibrary.filter(
    (ex) => !day.exercises.some((item) => item.exerciseId === ex.id),
  );
  const selected = available.find((ex) => ex.id === exerciseId) ?? available[0];
  const customMuscles = Array.from(
    new Set(
      day.exercises.flatMap(
        (item) =>
          exerciseLibrary.find((ex) => ex.id === item.exerciseId)
            ?.targetMuscles ?? [],
      ),
    ),
  );
  const focus = plan.editable ? customMuscles : day.focusMuscles;
  const duration = plan.editable
    ? Math.ceil(
        day.exercises.reduce(
          (total, ex) =>
            total +
            ex.sets * (ex.durationSeconds ?? (ex.reps ?? 0) * 3) +
            Math.max(0, ex.sets - 1) * ex.restSeconds,
          0,
        ) / 60,
      )
    : day.estimatedMinutes;
  const editable = ready && plan.editable && !completed;
  function addExercise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || !selected) return;
    const item: PlanExercise = {
      exerciseId: selected.id,
      sets,
      restSeconds: rest,
      ...(mode === "reps" ? { reps: target } : { durationSeconds: target }),
    };
    save((previous) =>
      editCustomDay(plan, previous, selectedDay, [
        ...getDay(plan, previous, selectedDay).exercises,
        item,
      ]),
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR 3-DAY WORKOUT PLAN"
        title={plan.title}
        description={plan.description}
      />
      {storageError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-200"
        >
          {storageError}
        </p>
      )}
      <p className="mb-4 text-xs text-[#a5b09b]" role="status">
        {ready
          ? `${progress.completedDays.length} of 3 days complete. ${isDemo ? "Demo progress saved in this tab." : "Progress synced to your account."}`
          : "Loading or saving progress..."}
      </p>
      <nav
        aria-label="Workout days"
        className="mb-7 grid grid-cols-3 gap-2 sm:gap-4"
      >
        {plan.days.map((item) => {
          const unlocked = isDayUnlocked(progress, item.day);
          const done = progress.completedDays.includes(item.day);
          return (
            <button
              type="button"
              key={item.day}
              disabled={!ready || !unlocked}
              aria-current={selectedDay === item.day ? "step" : undefined}
              aria-label={`Day ${item.day}: ${item.title}. ${done ? "Completed" : unlocked ? "Available" : `Locked, complete Day ${item.day - 1} first`}`}
              onClick={() => setSelectedDay(item.day)}
              className={`flex min-h-24 flex-col items-start justify-between gap-3 rounded-xl border p-3 text-left sm:p-5 ${selectedDay === item.day ? "border-[#ccf66b] bg-[#ccf66b]/10" : "border-[#36412d] bg-[#1b2118]"} disabled:cursor-not-allowed disabled:opacity-45`}
            >
              <span className="flex w-full items-center justify-between gap-2 text-sm font-bold">
                Day {item.day}
                {done ? (
                  <CheckCircle2
                    size={18}
                    className="text-green-400"
                    aria-hidden="true"
                  />
                ) : !unlocked ? (
                  <LockKeyhole size={17} aria-hidden="true" />
                ) : null}
              </span>
              <span className="text-xs text-[#b7c1ac]">
                {plan.editable ? "Your routine" : item.title}
              </span>
            </button>
          );
        })}
      </nav>
      <section
        aria-labelledby="day-heading"
        className="mb-6 rounded-2xl border border-[#53633c] bg-linear-to-r from-[#303e23] to-[#1b2317] p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Dumbbell className="lime" size={32} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="card-tag">DAY {day.day} / 3</p>
            <h2 id="day-heading">{day.title}</h2>
          </div>
          {completed && (
            <span className="flex items-center gap-2 text-sm font-bold text-green-400">
              <CheckCircle2 size={19} /> Completed
            </span>
          )}
        </div>
        <p className="mt-4 text-sm">
          <strong className="text-[#dce6d3]">Focus: </strong>
          {focus.length
            ? focus.join(", ")
            : "Choose exercises to set your focus muscles."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#c0cfaf]">
          <span className="flex items-center gap-2">
            <Clock3 size={15} />
            {duration
              ? `About ${duration} min`
              : "Duration updates as you add exercises"}
          </span>
          <span>{day.exercises.length} exercises</span>
        </div>
        <p className="mt-4 text-xs">
          Warm up for 5 minutes. Rest a day between sessions. Row and lunge reps
          are per side.
        </p>
      </section>
      <section aria-labelledby="exercise-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="exercise-heading">Your exercises</h2>
          <span className="text-xs text-[#a5b09b]">
            {completedIds.length} / {day.exercises.length} completed
          </span>
        </div>
        {!day.exercises.length && (
          <div className="mb-5 rounded-xl border border-dashed border-[#50613b] p-7 text-center">
            <Dumbbell className="lime mx-auto mb-3" />
            <h3>Your routine starts here.</h3>
            <p className="mt-2 text-sm">
              Add an exercise from the library below to build this day.
            </p>
          </div>
        )}
        <div className="mb-6 space-y-3">
          {day.exercises.map((item, index) => {
            const exercise = exerciseLibrary.find(
              (ex) => ex.id === item.exerciseId,
            )!;
            const done = completedIds.includes(item.exerciseId);
            return (
              <article
                key={item.exerciseId}
                className={`rounded-xl border p-4 sm:p-5 ${done ? "border-green-400/35 bg-green-400/5" : "border-[#303a29] bg-[#1a2017]"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-xs text-[#879976]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/workout/${item.exerciseId}?goal=${plan.id}&day=${selectedDay}`}
                      className="inline-flex min-h-7 items-center gap-2 font-bold hover:text-[#ccf66b]"
                    >
                      {exercise.name}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                    <p className="mt-1 text-xs">
                      {exercise.targetMuscles.join(", ")}
                    </p>
                    <p className="mt-3 text-xs text-[#c4d5b3]">
                      {item.sets} sets &times;{" "}
                      {item.reps !== undefined
                        ? `${item.reps} reps`
                        : `${item.durationSeconds} sec`}{" "}
                      &middot; Rest {item.restSeconds} sec
                    </p>
                  </div>
                  {editable && (
                    <button
                      type="button"
                      onClick={() =>
                        save((previous) =>
                          editCustomDay(
                            plan,
                            previous,
                            selectedDay,
                            getDay(
                              plan,
                              previous,
                              selectedDay,
                            ).exercises.filter(
                              (ex) => ex.exerciseId !== item.exerciseId,
                            ),
                          ),
                        )
                      }
                      aria-label={`Remove ${exercise.name}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#485439] text-[#b6c2aa] hover:bg-red-400/10 hover:text-red-300"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
                <ExerciseDemo exercise={exercise} triggerOnly />
                <label className="mt-4 flex min-h-11 w-fit cursor-pointer items-center gap-3 text-xs text-[#d0dcc5]">
                  <input
                    type="checkbox"
                    className="size-5 accent-[#ccf66b]"
                    checked={done}
                    disabled={!ready || completed}
                    onChange={() =>
                      save((previous) =>
                        toggleExercise(
                          plan,
                          previous,
                          selectedDay,
                          item.exerciseId,
                        ),
                      )
                    }
                  />
                  {done ? "Exercise completed" : "Mark exercise complete"}
                </label>
              </article>
            );
          })}
        </div>
      </section>
      {plan.editable && (
        <section
          aria-labelledby="library-heading"
          className="mb-7 rounded-2xl border border-[#35412c] bg-[#1a2017] p-5 sm:p-6"
        >
          <h2 id="library-heading">Exercise library</h2>
          <Link
            href="/exercises"
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-xs text-[#ccf66b]"
          >
            Search the full catalog <ArrowUpRight size={15} />
          </Link>
          <p className="mt-2 mb-5 text-xs">
            {completed
              ? "This day is complete and read-only. Select the next unlocked day to build another routine."
              : "Choose an exercise and set its prescription. You can remove it before completing the day."}
          </p>
          {!completed && (
            <form onSubmit={addExercise} className="space-y-4">
              <label className="block text-xs text-[#c5d3b9]">
                Exercise
                <select
                  className="mt-2 block min-h-11 w-full rounded-lg border border-[#4a593c] bg-[#10160d] p-3 text-sm text-[#e5eddc]"
                  value={selected?.id ?? ""}
                  disabled={!editable || !available.length}
                  onChange={(e) => setExerciseId(e.target.value)}
                >
                  {!available.length && (
                    <option value="">All exercises added</option>
                  )}
                  {available.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} - {ex.targetMuscles.join(", ")}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="text-xs">
                  Sets
                  <input
                    className="plan-input"
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={sets}
                    disabled={!editable}
                    onChange={(e) => setSets(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs">
                  Target type
                  <select
                    className="plan-input"
                    value={mode}
                    disabled={!editable}
                    onChange={(e) => {
                      setMode(e.target.value);
                      setTarget(e.target.value === "reps" ? 10 : 30);
                    }}
                  >
                    <option value="reps">Repetitions</option>
                    <option value="duration">Duration</option>
                  </select>
                </label>
                <label className="text-xs">
                  {mode === "reps" ? "Reps per set" : "Seconds per set"}
                  <input
                    className="plan-input"
                    type="number"
                    min="1"
                    max="600"
                    required
                    value={target}
                    disabled={!editable}
                    onChange={(e) => setTarget(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs">
                  Rest (seconds)
                  <input
                    className="plan-input"
                    type="number"
                    min="0"
                    max="600"
                    required
                    value={rest}
                    disabled={!editable}
                    onChange={(e) => setRest(Number(e.target.value))}
                  />
                </label>
              </div>
              <button
                type="submit"
                className="button secondary disabled:opacity-40"
                disabled={!editable || !available.length}
              >
                <Plus size={17} />
                Add exercise
              </button>
            </form>
          )}
        </section>
      )}
      <button
        type="button"
        className="button primary disabled:cursor-not-allowed disabled:opacity-40"
        disabled={
          !ready || completed || !canCompleteDay(plan, progress, selectedDay)
        }
        onClick={() =>
          save((previous) => completeDay(plan, previous, selectedDay))
        }
      >
        <Check size={18} />
        {completed ? "Day Completed" : "Mark Day Complete"}
      </button>
      <p className="helper" role="status">
        {completed
          ? selectedDay < 3
            ? `Day ${selectedDay + 1} is unlocked. Select it above when you are ready.`
            : "All three days complete. Great consistency!"
          : day.exercises.length
            ? "Complete every exercise above to finish this day and unlock the next."
            : "Add at least one exercise and complete it to finish this day."}
      </p>
    </>
  );
}
