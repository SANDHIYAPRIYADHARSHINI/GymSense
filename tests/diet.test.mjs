import { test } from "node:test";
import assert from "node:assert/strict";
import { foods, mealRecipes } from "../src/data/foods.ts";
import {
  allergens,
  budgets,
  cookingTimes,
  cuisines,
  defaultPreferences,
  defaultTrackers,
  dietTypes,
  generateDailyPlan,
  localDayKey,
  matchesPreferences,
  nutritionTotals,
  recipeNutrition,
  restorePreferences,
  restoreTrackers,
  serializePreferences,
  trackerStorageKey,
} from "../src/lib/diet.ts";
const foodById = new Map(foods.map((food) => [food.id, food]));
const allowed = {
  vegetarian: ["plant", "dairy"],
  vegan: ["plant"],
  eggetarian: ["plant", "dairy", "egg"],
  "non-vegetarian": ["plant", "dairy", "egg", "meat", "fish", "shellfish"],
  pescatarian: ["plant", "dairy", "egg", "fish", "shellfish"],
};
test("recipe catalog has unique IDs, positive portions, and complete nutrition references", () => {
  assert.equal(new Set(foods.map((food) => food.id)).size, foods.length);
  assert.equal(
    new Set(mealRecipes.map((recipe) => recipe.id)).size,
    mealRecipes.length,
  );
  for (const recipe of mealRecipes) {
    assert.ok(recipe.ingredients.length);
    for (const item of recipe.ingredients) {
      assert.ok(item.grams > 0);
      assert.ok(foodById.has(item.foodId));
    }
  }
  for (const food of foods)
    for (const value of Object.values(food.per100g))
      assert.ok(Number.isFinite(value) && value >= 0);
});
test("all diet types and all 64 allergen combinations retain safe matching meals across other preferences", () => {
  let checked = 0;
  for (const dietType of dietTypes)
    for (let mask = 0; mask < 64; mask++)
      for (const cuisine of cuisines)
        for (const budget of budgets)
          for (const cookingTime of cookingTimes) {
            const allergies = allergens.filter(
              (_, index) => mask & (1 << index),
            );
            const prefs = {
              ...defaultPreferences,
              dietType,
              allergies,
              cuisine,
              budget,
              cookingTime,
              goal: ["gain muscle", "lose fat", "maintain"][mask % 3],
            };
            const plan = generateDailyPlan(prefs, mask);
            assert.equal(plan.complete, true, JSON.stringify(prefs));
            for (const meal of plan.meals) {
              assert.ok(meal.recipe);
              assert.ok(meal.recipe.cuisines.includes(cuisine));
              assert.ok(
                budgets.indexOf(meal.recipe.budget) <= budgets.indexOf(budget),
              );
              assert.ok(
                cookingTime === "meal prep"
                  ? meal.recipe.mealPrep
                  : meal.recipe.minutes <
                      (cookingTime === "under 15 minutes" ? 15 : 30),
              );
              for (const item of meal.recipe.ingredients) {
                const food = foodById.get(item.foodId);
                assert.ok(allowed[dietType].includes(food.group));
                assert.ok(
                  !food.allergens.some((allergen) =>
                    allergies.includes(allergen),
                  ),
                );
              }
            }
            checked++;
          }
  assert.equal(checked, 11520);
});
test("eggs, fish, meat, dairy and shellfish follow explicit diet/allergen rules", () => {
  const recipe = (id) => mealRecipes.find((meal) => meal.id === id);
  const prefs = { ...defaultPreferences, cuisine: "Indian", budget: "premium" };
  assert.equal(
    matchesPreferences(recipe("indian-egg"), {
      ...prefs,
      dietType: "vegetarian",
    }),
    false,
  );
  assert.equal(
    matchesPreferences(recipe("indian-egg"), {
      ...prefs,
      dietType: "eggetarian",
    }),
    true,
  );
  assert.equal(
    matchesPreferences(recipe("indian-paneer"), {
      ...prefs,
      dietType: "vegan",
    }),
    false,
  );
  assert.equal(
    matchesPreferences(recipe("indian-chicken"), {
      ...prefs,
      dietType: "pescatarian",
    }),
    false,
  );
  assert.equal(
    matchesPreferences(recipe("med-salmon"), {
      ...prefs,
      cuisine: "Mediterranean",
      dietType: "pescatarian",
    }),
    true,
  );
  assert.equal(
    matchesPreferences(recipe("protein-prawns"), {
      ...prefs,
      cuisine: "high-protein",
      dietType: "non-vegetarian",
      allergies: ["shellfish"],
    }),
    false,
  );
  assert.equal(
    matchesPreferences(recipe("protein-tofu"), {
      ...prefs,
      cuisine: "high-protein",
      dietType: "vegan",
      allergies: ["soy"],
    }),
    false,
  );
});
test("nutrition uses ingredient weights and day totals sum displayed meal values", () => {
  const fixture = {
    ...mealRecipes[0],
    ingredients: [
      { foodId: "rice", grams: 100 },
      { foodId: "lentils", grams: 200 },
    ],
  };
  assert.deepEqual(recipeNutrition(fixture), {
    calories: 355,
    protein: 20.7,
    carbs: 65.6,
    fat: 1.8,
    fiber: 17.4,
  });
  const plan = generateDailyPlan(defaultPreferences);
  for (const key of ["calories", "protein", "carbs", "fat", "fiber"]) {
    const expected =
      Math.round(
        plan.meals.reduce((sum, meal) => sum + meal.nutrition[key], 0) * 10,
      ) / 10;
    assert.equal(plan.totals[key], expected);
  }
  assert.deepEqual(nutritionTotals([]), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
});
test("goal adjusts sample portions and three-meal mode omits snacks", () => {
  const fixture = {
    ...mealRecipes[0],
    ingredients: [{ foodId: "rice", grams: 100 }],
  };
  assert.deepEqual(
    generateDailyPlan({ ...defaultPreferences, goal: "gain muscle" }, 0, [
      fixture,
    ]).meals[0].nutrition,
    { calories: 148, protein: 3.2, carbs: 30.7, fat: 1.2, fiber: 1.9 },
  );
  const plan = generateDailyPlan({ ...defaultPreferences, meals: "3 meals" });
  assert.deepEqual(
    plan.meals.map((meal) => meal.slot),
    ["Breakfast", "Lunch", "Dinner"],
  );
  assert.equal(
    generateDailyPlan(defaultPreferences).meals.filter(
      (meal) => meal.slot === "Snack",
    ).length,
    1,
  );
});
test("no matching recipes never bypass dietary exclusions or invent nutrition", () => {
  const tofu = mealRecipes.find((meal) => meal.id === "protein-tofu");
  const plan = generateDailyPlan(
    {
      ...defaultPreferences,
      dietType: "vegan",
      allergies: ["soy"],
      cuisine: "high-protein",
    },
    0,
    [tofu],
  );
  assert.equal(plan.complete, false);
  assert.ok(plan.meals.every((meal) => meal.recipe === null));
  assert.equal(plan.totals.calories, 0);
  const invalid = {
    ...mealRecipes[0],
    ingredients: [{ foodId: "missing", grams: 100 }],
  };
  assert.equal(matchesPreferences(invalid, defaultPreferences), false);
});
test("preferences round-trip and invalid stored fields safely restore", () => {
  const prefs = {
    ...defaultPreferences,
    dietType: "vegan",
    allergies: ["nuts", "dairy", "gluten", "soy", "eggs", "shellfish"],
    cuisine: "Mediterranean",
    cookingTime: "meal prep",
    budget: "premium",
  };
  assert.deepEqual(restorePreferences(serializePreferences(prefs)), prefs);
  for (const raw of [null, "broken", "null", '{"version":2}'])
    assert.deepEqual(restorePreferences(raw), defaultPreferences);
  const restored = restorePreferences(
    JSON.stringify({
      version: 1,
      preferences: {
        dietType: "invalid",
        allergies: ["nuts", "nuts", "unknown"],
        budget: "invalid",
      },
    }),
  );
  assert.equal(restored.dietType, "vegetarian");
  assert.deepEqual(restored.allergies, ["nuts"]);
});
test("daily trackers validate saved values and isolate local calendar dates", () => {
  const values = {
    ...defaultTrackers,
    protein: 45.5,
    fiber: 12,
    water: 1250,
    proteinTarget: 120,
  };
  assert.deepEqual(
    restoreTrackers(JSON.stringify({ version: 1, trackers: values })),
    values,
  );
  const bad = restoreTrackers(
    JSON.stringify({
      version: 1,
      trackers: { protein: -3, waterTarget: 0, fiber: "many" },
    }),
  );
  assert.deepEqual(bad, defaultTrackers);
  assert.equal(localDayKey(new Date(2026, 10, 5, 23, 59)), "2026-11-05");
  assert.notEqual(
    trackerStorageKey("2026-11-05"),
    trackerStorageKey("2026-11-06"),
  );
});
