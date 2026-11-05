"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Dumbbell,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { exercises, filterExercises } from "@/data/exercises";
import { PageHeading } from "./landing";
const muscles = Array.from(
  new Set(exercises.flatMap((ex) => ex.targetMuscles)),
).sort();
const equipment = Array.from(
  new Set(exercises.flatMap((ex) => ex.equipment)),
).sort();
export function ExerciseCatalog() {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [gear, setGear] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const matches = useMemo(
    () =>
      filterExercises(exercises, {
        query,
        muscle,
        equipment: gear,
        difficulty,
      }),
    [query, muscle, gear, difficulty],
  );
  const active = Boolean(query || muscle || gear || difficulty);
  function reset() {
    setQuery("");
    setMuscle("");
    setGear("");
    setDifficulty("");
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR MOVEMENT TOOLKIT"
        title="The exercise library."
        description="Find your next move. Explore technique, equipment, and the muscles behind every rep."
      />
      <section
        aria-label="Search and filter exercises"
        className="mb-6 rounded-2xl border border-[#35412b] bg-[#1b2118] p-5 sm:p-6"
      >
        <label
          htmlFor="exercise-search"
          className="mb-2 flex items-center gap-2 text-xs font-bold text-[#c9d9b8]"
        >
          <Search size={16} />
          Search exercises
        </label>
        <input
          id="exercise-search"
          type="search"
          className="plan-input"
          placeholder="Try squats, shoulders, or dumbbells"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-xs" htmlFor="muscle-filter">
            Muscle group
            <select
              id="muscle-filter"
              className="plan-input"
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
            >
              <option value="">All muscle groups</option>
              {muscles.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="text-xs" htmlFor="equipment-filter">
            Equipment
            <select
              id="equipment-filter"
              className="plan-input"
              value={gear}
              onChange={(e) => setGear(e.target.value)}
            >
              <option value="">All equipment</option>
              {equipment.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="text-xs" htmlFor="difficulty-filter">
            Difficulty
            <select
              id="difficulty-filter"
              className="plan-input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">All difficulties</option>
              {["Beginner", "Intermediate", "Advanced"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p role="status" aria-live="polite" className="text-xs">
            {matches.length} of {exercises.length} exercises
          </p>
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 text-xs text-[#ccf66b] disabled:opacity-40"
            disabled={!active}
            onClick={reset}
          >
            <SlidersHorizontal size={15} />
            Clear filters
          </button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {matches.map((ex) => (
          <Link
            key={ex.id}
            href={`/workout/${ex.id}`}
            className="group flex min-h-56 flex-col rounded-2xl border border-[#34402b] bg-linear-to-br from-[#242f1d] to-[#171c16] p-6 hover:-translate-y-1 hover:border-[#ccf66b]/70 motion-reduce:transform-none"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="icon-box">
                <Dumbbell size={21} aria-hidden="true" />
              </span>
              <span className="pill">{ex.difficulty}</span>
            </div>
            <h2 className="text-xl">{ex.name}</h2>
            <p className="mt-2 text-xs">{ex.targetMuscles.join(", ")}</p>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-[#ccf66b]">
              <span className="mt-4">{ex.equipment.join(", ")}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
      {!matches.length && (
        <div className="rounded-2xl border border-dashed border-[#53643d] p-8 text-center">
          <Search className="lime mx-auto mb-3" />
          <h2>No matching moves.</h2>
          <p className="my-3 text-sm">
            Try a broader search or clear a filter.
          </p>
          <button className="button secondary" type="button" onClick={reset}>
            Show all exercises
          </button>
        </div>
      )}
      <Link href="/plan/custom" className="button secondary mt-7">
        Build a custom routine <ArrowUpRight size={17} />
      </Link>
    </>
  );
}
