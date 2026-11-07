"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Apple,
  Check,
  Droplets,
  Flame,
  Leaf,
  Minus,
  Plus,
  RefreshCw,
  Utensils,
} from "lucide-react";
import {
  allergens,
  budgets,
  cookingTimes,
  cuisines,
  defaultPreferences,
  defaultTrackers,
  dietGoals,
  dietTypes,
  generateDailyPlan,
  localDayKey,
  mealIngredients,
  recipeAllergens,
  type DailyTrackers,
  type DietPreferences,
} from "@/lib/diet";
import { useAuth } from "./auth-provider";
import {
  watchDiet,
  saveDiet,
  getIntake,
  saveIntake,
} from "@/lib/firestore/records";
import { cloudError } from "@/lib/firebase";
import { PageHeading } from "./landing";
const trackerDefinitions = [
  {
    key: "protein",
    target: "proteinTarget",
    label: "Protein",
    unit: "g",
    step: 10,
    Icon: Flame,
  },
  {
    key: "fiber",
    target: "fiberTarget",
    label: "Fiber",
    unit: "g",
    step: 5,
    Icon: Leaf,
  },
  {
    key: "water",
    target: "waterTarget",
    label: "Water",
    unit: "ml",
    step: 250,
    Icon: Droplets,
  },
] as const;
export function DietPlanner() {
  const [preferences, setPreferences] =
    useState<DietPreferences>(defaultPreferences);
  const [trackers, setTrackers] = useState<DailyTrackers>(defaultTrackers);
  const { user, isDemo } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = loaded && !busy;
  const [storageError, setStorageError] = useState("");
  const [status, setStatus] = useState("");
  const [variation, setVariation] = useState(0);
  const day = useRef("");
  const draftPreferences = useRef<DietPreferences | null>(null);
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function loadDay() {
      const today = localDayKey();
      if (day.current === today) return;
      try {
        const saved = await getIntake(user!.uid, today);
        if (active) {
          day.current = today;
          setTrackers(saved ?? { ...defaultTrackers });
        }
      } catch (e) {
        if (active) setStorageError(cloudError(e));
      }
    }
    const stop = watchDiet(
      user.uid,
      (p) => {
        if (!draftPreferences.current) setPreferences(p);
        setLoaded(true);
      },
      (e) => setStorageError(cloudError(e)),
    );
    void loadDay();
    const interval = setInterval(() => void loadDay(), 60000);
    return () => {
      active = false;
      stop();
      clearInterval(interval);
    };
  }, [user]);
  const plan = useMemo(
    () => generateDailyPlan(preferences, variation),
    [preferences, variation],
  );
  async function updatePreferences(next: DietPreferences) {
    if (!ready || !user) return;
    draftPreferences.current = next;
    setPreferences(next);
    setVariation(0);
    setBusy(true);
    setStorageError("");
    setStatus("Saving preferences...");
    try {
      await saveDiet(user.uid, next);
      draftPreferences.current = null;
      setStatus(
        isDemo
          ? "Demo preferences saved in this tab."
          : "Preferences synced to your account.",
      );
    } catch (e) {
      setStorageError(cloudError(e));
      setStatus("Not saved. Retry below.");
    } finally {
      setBusy(false);
    }
  }
  async function updateTracker(
    key: keyof DailyTrackers,
    value: number | ((current: number) => number),
  ) {
    if (!ready || !user) return;
    setBusy(true);
    setStorageError("");
    try {
      const today = localDayKey();
      let base = trackers;
      if (day.current !== today) {
        base = (await getIntake(user.uid, today)) ?? { ...defaultTrackers };
        day.current = today;
      }
      const amount = typeof value === "function" ? value(base[key]) : value;
      const next = {
        ...base,
        [key]: Math.min(
          100000,
          Math.max(
            key.endsWith("Target") ? 1 : 0,
            Number.isFinite(amount) ? amount : 0,
          ),
        ),
      };
      await saveIntake(user.uid, today, next);
      setTrackers(next);
      setStatus("Daily intake saved.");
    } catch (e) {
      setStorageError(cloudError(e));
    } finally {
      setBusy(false);
    }
  }
  function select<K extends keyof DietPreferences>(
    key: K,
    value: DietPreferences[K],
  ) {
    updatePreferences({ ...preferences, [key]: value });
  }
  return (
    <>
      <PageHeading
        eyebrow="FUEL YOUR NEXT GOOD DAY"
        title="Your plate. Your preferences."
        description="Build a simple daily menu around the food you enjoy, then track what you actually consume."
      />
      {storageError && (
        <button
          className="button secondary mb-4"
          disabled={!ready}
          onClick={() => void updatePreferences(preferences)}
        >
          Retry saving preferences
        </button>
      )}
      {storageError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-xs text-amber-100"
        >
          {storageError}
        </p>
      )}
      <section
        className="rounded-2xl border border-[#3d4b30] bg-linear-to-br from-[#232f1b] to-[#171c15] p-5 sm:p-7"
        aria-labelledby="preferences-heading"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="preferences-heading">Make it your kind of fuel.</h2>
          <span className="pill">MOCK DAILY PLANNER</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setVariation((value) => value + 1);
            setStatus("Daily plan generated using your current preferences.");
          }}
        >
          <fieldset disabled={!ready} className="space-y-5 disabled:opacity-50">
            <legend className="sr-only">Dietary preferences</legend>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label htmlFor="diet-goal" className="text-xs">
                Goal
                <select
                  id="diet-goal"
                  className="plan-input capitalize"
                  value={preferences.goal}
                  onChange={(event) =>
                    select(
                      "goal",
                      event.target.value as DietPreferences["goal"],
                    )
                  }
                >
                  {dietGoals.map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="diet-type" className="text-xs">
                Diet type
                <select
                  id="diet-type"
                  className="plan-input capitalize"
                  value={preferences.dietType}
                  onChange={(event) =>
                    select(
                      "dietType",
                      event.target.value as DietPreferences["dietType"],
                    )
                  }
                >
                  {dietTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="diet-cuisine" className="text-xs">
                Cuisine
                <select
                  id="diet-cuisine"
                  className="plan-input"
                  value={preferences.cuisine}
                  onChange={(event) =>
                    select(
                      "cuisine",
                      event.target.value as DietPreferences["cuisine"],
                    )
                  }
                >
                  {cuisines.map((cuisine) => (
                    <option key={cuisine}>{cuisine}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="diet-meals" className="text-xs">
                Meals
                <select
                  id="diet-meals"
                  className="plan-input"
                  value={preferences.meals}
                  onChange={(event) =>
                    select(
                      "meals",
                      event.target.value as DietPreferences["meals"],
                    )
                  }
                >
                  <option>3 meals</option>
                  <option>3 meals plus snacks</option>
                </select>
              </label>
              <label htmlFor="diet-budget" className="text-xs">
                Budget
                <select
                  id="diet-budget"
                  className="plan-input capitalize"
                  value={preferences.budget}
                  onChange={(event) =>
                    select(
                      "budget",
                      event.target.value as DietPreferences["budget"],
                    )
                  }
                >
                  {budgets.map((budget) => (
                    <option key={budget}>{budget}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="diet-time" className="text-xs">
                Cooking time
                <select
                  id="diet-time"
                  className="plan-input"
                  value={preferences.cookingTime}
                  onChange={(event) =>
                    select(
                      "cookingTime",
                      event.target.value as DietPreferences["cookingTime"],
                    )
                  }
                >
                  {cookingTimes.map((time) => (
                    <option key={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset>
              <legend className="mb-3 text-xs">
                Allergies — exclude any that apply
              </legend>
              <div className="flex flex-wrap gap-2">
                {allergens.map((allergen) => (
                  <label
                    key={allergen}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs capitalize ${preferences.allergies.includes(allergen) ? "border-[#ccf66b]/70 bg-[#ccf66b]/10" : "border-[#3b4930] bg-[#141c10]"}`}
                  >
                    <input
                      className="size-4 accent-[#ccf66b]"
                      type="checkbox"
                      checked={preferences.allergies.includes(allergen)}
                      onChange={() =>
                        select(
                          "allergies",
                          preferences.allergies.includes(allergen)
                            ? preferences.allergies.filter(
                                (value) => value !== allergen,
                              )
                            : [...preferences.allergies, allergen],
                        )
                      }
                    />
                    {allergen}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" className="button primary">
                <RefreshCw size={17} />
                Generate daily plan
              </button>
              <p className="text-xs">
                Changing a preference updates the plan immediately.
              </p>
            </div>
          </fieldset>
        </form>
        <p
          role="status"
          aria-live="polite"
          className="mt-4 min-h-5 text-xs text-[#bbd69d]"
        >
          {ready
            ? status ||
              (isDemo
                ? "Demo preferences stay in this tab."
                : "Preferences sync to your account as you make changes.")
            : "Loading your saved preferences..."}
        </p>
      </section>
      <section aria-labelledby="meal-plan-heading" className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">ONE DAY. SIMPLE CHOICES.</p>
            <h2 id="meal-plan-heading">Your daily meal plan</h2>
          </div>
          <span className="text-xs text-[#a5b09b]">
            Approximate mock nutrition / per sample serving
          </span>
        </div>
        {!ready ? (
          <div className="panel">
            <p>Loading your saved meal preferences...</p>
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {Object.entries(plan.totals).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-[#34402b] bg-[#1b2117] p-4"
                >
                  <span className="block text-[10px] tracking-wider text-[#9baa8d]">
                    {key.toUpperCase()}
                  </span>
                  <strong className="mt-2 block text-2xl">
                    {value}
                    <span className="ml-1 text-xs font-normal text-[#a5b09b]">
                      {key === "calories" ? "kcal" : "g"}
                    </span>
                  </strong>
                </div>
              ))}
            </div>
            {!plan.complete && (
              <p
                role="status"
                className="mb-5 rounded-xl border border-[#58663d] p-4 text-sm"
              >
                Some meal slots have no matching recipe. Change cuisine, budget,
                or cooking time. Diet and allergen exclusions are always
                respected; totals include available meals only.
              </p>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              {plan.meals.map((meal, index) => (
                <article
                  className="rounded-2xl border border-[#34452b] bg-[#1a2116] p-5 sm:p-6"
                  key={meal.slot}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ccf66b]">
                      {index === 0 ? (
                        <Apple size={18} />
                      ) : (
                        <Utensils size={18} />
                      )}{" "}
                      {meal.slot}
                    </span>
                    {meal.recipe && (
                      <span className="pill">{meal.recipe.minutes} min</span>
                    )}
                  </div>
                  {meal.recipe ? (
                    <>
                      <h3 className="text-2xl">{meal.recipe.name}</h3>
                      <p className="mt-2 text-xs capitalize">
                        {meal.recipe.cuisines.join(", ")} / {meal.recipe.budget}
                        {meal.recipe.mealPrep ? " / batch-friendly" : ""}
                      </p>
                      <div className="my-5 grid grid-cols-3 gap-x-3 gap-y-4 text-xs sm:grid-cols-5">
                        {Object.entries(meal.nutrition).map(([key, value]) => (
                          <div key={key}>
                            <strong className="block text-base text-[#e5f0dc]">
                              {value}
                              {key === "calories" ? "" : "g"}
                            </strong>
                            <span className="text-[10px] text-[#a5b09b]">
                              {key === "calories" ? "kcal" : key}
                            </span>
                          </div>
                        ))}
                      </div>
                      <details className="border-t border-[#35442b] pt-3">
                        <summary className="min-h-11 cursor-pointer py-3 text-xs text-[#ccf66b]">
                          Ingredients &amp; preparation
                        </summary>
                        <ul className="mb-3 list-disc space-y-2 pl-4 text-xs text-[#b8c9aa]">
                          {mealIngredients(meal.recipe, meal.portionFactor).map(
                            (ingredient) => (
                              <li key={ingredient.name}>
                                {ingredient.name}: {ingredient.grams} g
                              </li>
                            ),
                          )}
                        </ul>
                        <p className="text-xs">{meal.recipe.instructions}</p>
                      </details>
                      <p className="mt-3 flex items-start gap-2 text-[11px] text-[#aabd96]">
                        <Check size={14} className="shrink-0" />
                        {recipeAllergens(meal.recipe).length
                          ? `Tagged allergens: ${recipeAllergens(meal.recipe).join(", ")}.`
                          : "No listed allergens in the sample ingredients."}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>No matching {meal.slot.toLowerCase()} option</h3>
                      <p className="mt-3 text-sm">
                        Try another cuisine, budget, or cooking-time option to
                        expand the recipe selection.
                      </p>
                    </>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs">
              Times assume washed vegetables and ready-cooked grains, legumes,
              and proteins where listed. Selected allergens are excluded using
              ingredient tags; check actual product labels. Sample portions vary
              by goal and are not a personalized calorie prescription.
            </p>
          </>
        )}
      </section>
      <section aria-labelledby="trackers-heading" className="mt-9">
        <div className="mb-5">
          <p className="eyebrow">SMALL HABITS ADD UP</p>
          <h2 id="trackers-heading">Today’s protein, fiber &amp; water</h2>
          <p className="mt-2 text-xs">
            Track what you consume. Generating a meal plan does not log intake.
            Targets are editable examples; daily entries reset by your local
            calendar date.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {trackerDefinitions.map(
            ({ key, target, label, unit, step, Icon }) => (
              <div
                className="rounded-2xl border border-[#36462d] bg-[#1a2116] p-5"
                key={key}
              >
                <div className="mb-4 flex items-center gap-3">
                  <Icon className="lime" size={21} />
                  <h3>{label}</h3>
                </div>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <strong className="text-3xl">
                    {trackers[key]}
                    <span className="ml-1 text-xs text-[#a5b09b]">{unit}</span>
                  </strong>
                  <span className="text-xs text-[#a5b09b]">
                    / {trackers[target]} {unit}
                  </span>
                </div>
                <div
                  className="mb-5 h-2 overflow-hidden rounded-full bg-black/30"
                  role="progressbar"
                  aria-label={`${label} daily intake`}
                  aria-valuemin={0}
                  aria-valuemax={trackers[target]}
                  aria-valuenow={Math.min(trackers[key], trackers[target])}
                >
                  <div
                    className="h-full rounded-full bg-[#ccf66b] transition-all"
                    style={{
                      width: `${Math.min(100, (trackers[key] / trackers[target]) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mb-4 flex gap-2">
                  <button
                    className="button secondary flex-1 disabled:opacity-40"
                    type="button"
                    disabled={!ready || trackers[key] === 0}
                    aria-label={`Remove ${step} ${unit} ${label.toLowerCase()}`}
                    onClick={() =>
                      updateTracker(key, (current) => current - step)
                    }
                  >
                    <Minus size={16} />
                    {step}
                    {unit}
                  </button>
                  <button
                    className="button primary flex-1 disabled:opacity-40"
                    type="button"
                    disabled={!ready}
                    aria-label={`Add ${step} ${unit} ${label.toLowerCase()}`}
                    onClick={() =>
                      updateTracker(key, (current) => current + step)
                    }
                  >
                    <Plus size={16} />
                    {step}
                    {unit}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label htmlFor={`${key}-intake`} className="text-[11px]">
                    Logged ({unit})
                    <input
                      id={`${key}-intake`}
                      className="plan-input"
                      type="number"
                      min="0"
                      max="100000"
                      step={unit === "g" ? "0.1" : "1"}
                      disabled={!ready}
                      value={trackers[key]}
                      onChange={(event) =>
                        updateTracker(key, Number(event.target.value))
                      }
                    />
                  </label>
                  <label htmlFor={`${key}-target`} className="text-[11px]">
                    Target ({unit})
                    <input
                      id={`${key}-target`}
                      className="plan-input"
                      type="number"
                      min="1"
                      max="100000"
                      step="1"
                      disabled={!ready}
                      value={trackers[target]}
                      onChange={(event) =>
                        updateTracker(target, Number(event.target.value))
                      }
                    />
                  </label>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
      <p className="mt-8 rounded-xl border border-[#3d4a33] bg-[#1b2117] p-5 text-xs text-[#c5d2bb]">
        General guidance only. Consult a qualified professional for medical or
        clinical nutrition advice.
      </p>
    </>
  );
}
