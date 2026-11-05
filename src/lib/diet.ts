import {
  foods,
  mealRecipes,
  type Allergen,
  type Budget,
  type Cuisine,
  type DietType,
  type FoodGroup,
  type MealRecipe,
  type MealSlot,
  type Nutrition,
} from "../data/foods.ts";
export const dietGoals = ["gain muscle", "lose fat", "maintain"] as const;
export const dietTypes: DietType[] = [
  "vegetarian",
  "vegan",
  "eggetarian",
  "non-vegetarian",
  "pescatarian",
];
export const allergens: Allergen[] = [
  "nuts",
  "dairy",
  "gluten",
  "soy",
  "eggs",
  "shellfish",
];
export const cuisines: Cuisine[] = [
  "Indian",
  "Mediterranean",
  "Continental",
  "high-protein",
];
export const budgets: Budget[] = ["budget", "normal", "premium"];
export const cookingTimes = [
  "under 15 minutes",
  "under 30 minutes",
  "meal prep",
] as const;
export type DietPreferences = {
  goal: (typeof dietGoals)[number];
  dietType: DietType;
  allergies: Allergen[];
  cuisine: Cuisine;
  meals: "3 meals" | "3 meals plus snacks";
  budget: Budget;
  cookingTime: (typeof cookingTimes)[number];
};
export const defaultPreferences: DietPreferences = {
  goal: "maintain",
  dietType: "vegetarian",
  allergies: [],
  cuisine: "Indian",
  meals: "3 meals plus snacks",
  budget: "normal",
  cookingTime: "under 30 minutes",
};
export const DIET_PREFERENCES_KEY = "gymsense:diet:preferences:v1";
const foodById = new Map(foods.map((food) => [food.id, food]));
const groups: Record<DietType, FoodGroup[]> = {
  vegetarian: ["plant", "dairy"],
  vegan: ["plant"],
  eggetarian: ["plant", "dairy", "egg"],
  "non-vegetarian": ["plant", "dairy", "egg", "meat", "fish", "shellfish"],
  pescatarian: ["plant", "dairy", "egg", "fish", "shellfish"],
};
export const emptyNutrition = (): Nutrition => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
});
const round = (n: number) => Math.round((n + Number.EPSILON) * 10) / 10;
export function recipeAllergens(recipe: MealRecipe): Allergen[] {
  return [
    ...new Set(
      recipe.ingredients.flatMap(
        (item) => foodById.get(item.foodId)?.allergens ?? [],
      ),
    ),
  ];
}
export function matchesPreferences(recipe: MealRecipe, prefs: DietPreferences) {
  if (
    !recipe.ingredients.length ||
    recipe.ingredients.some((item) => {
      const food = foodById.get(item.foodId);
      return (
        !food ||
        !groups[prefs.dietType].includes(food.group) ||
        food.allergens.some((allergen) => prefs.allergies.includes(allergen))
      );
    })
  )
    return false;
  return (
    recipe.cuisines.includes(prefs.cuisine) &&
    budgets.indexOf(recipe.budget) <= budgets.indexOf(prefs.budget) &&
    (prefs.cookingTime === "meal prep"
      ? recipe.mealPrep
      : recipe.minutes < (prefs.cookingTime === "under 15 minutes" ? 15 : 30))
  );
}
export function recipeNutrition(recipe: MealRecipe, factor = 1): Nutrition {
  const result = emptyNutrition();
  for (const item of recipe.ingredients) {
    const food = foodById.get(item.foodId);
    if (!food) throw new Error(`Unknown food: ${item.foodId}`);
    for (const key of Object.keys(result) as (keyof Nutrition)[])
      result[key] += ((food.per100g[key] * item.grams) / 100) * factor;
  }
  for (const key of Object.keys(result) as (keyof Nutrition)[])
    result[key] =
      key === "calories" ? Math.round(result[key]) : round(result[key]);
  return result;
}
export function nutritionTotals(values: Nutrition[]): Nutrition {
  const total = emptyNutrition();
  for (const value of values)
    for (const key of Object.keys(total) as (keyof Nutrition)[])
      total[key] += value[key];
  for (const key of Object.keys(total) as (keyof Nutrition)[])
    total[key] = round(total[key]);
  return total;
}
export type PlannedMeal = {
  slot: MealSlot;
  recipe: MealRecipe | null;
  nutrition: Nutrition;
  portionFactor: number;
};
export function generateDailyPlan(
  prefs: DietPreferences,
  variation = 0,
  catalog: MealRecipe[] = mealRecipes,
) {
  const slots: MealSlot[] =
    prefs.meals === "3 meals plus snacks"
      ? ["Breakfast", "Lunch", "Snack", "Dinner"]
      : ["Breakfast", "Lunch", "Dinner"];
  const portionFactor =
    prefs.goal === "gain muscle" ? 1.2 : prefs.goal === "lose fat" ? 0.9 : 1;
  const meals: PlannedMeal[] = slots.map((slot, index) => {
    const candidates = catalog.filter(
      (recipe) => recipe.slot === slot && matchesPreferences(recipe, prefs),
    );
    const recipe = candidates.length
      ? candidates[
          (Math.abs(Math.floor(variation)) + index) % candidates.length
        ]
      : null;
    return {
      slot,
      recipe,
      nutrition: recipe
        ? recipeNutrition(recipe, portionFactor)
        : emptyNutrition(),
      portionFactor,
    };
  });
  return {
    meals,
    totals: nutritionTotals(meals.map((meal) => meal.nutrition)),
    complete: meals.every((meal) => meal.recipe !== null),
  };
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function member<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}
export function restorePreferences(raw: string | null): DietPreferences {
  try {
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (!object(saved) || saved.version !== 1 || !object(saved.preferences))
      return { ...defaultPreferences, allergies: [] };
    const p = saved.preferences;
    const savedAllergies = Array.isArray(p.allergies) ? p.allergies : [];
    return {
      goal: member(p.goal, dietGoals, defaultPreferences.goal),
      dietType: member(p.dietType, dietTypes, defaultPreferences.dietType),
      allergies: allergens.filter((a) => savedAllergies.includes(a)),
      cuisine: member(p.cuisine, cuisines, defaultPreferences.cuisine),
      meals: member(
        p.meals,
        ["3 meals", "3 meals plus snacks"],
        defaultPreferences.meals,
      ),
      budget: member(p.budget, budgets, defaultPreferences.budget),
      cookingTime: member(
        p.cookingTime,
        cookingTimes,
        defaultPreferences.cookingTime,
      ),
    };
  } catch {
    return { ...defaultPreferences, allergies: [] };
  }
}
export function serializePreferences(preferences: DietPreferences) {
  return JSON.stringify({ version: 1, preferences });
}
export type DailyTrackers = {
  protein: number;
  fiber: number;
  water: number;
  proteinTarget: number;
  fiberTarget: number;
  waterTarget: number;
};
export const defaultTrackers: DailyTrackers = {
  protein: 0,
  fiber: 0,
  water: 0,
  proteinTarget: 100,
  fiberTarget: 25,
  waterTarget: 2000,
};
export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function trackerStorageKey(day: string) {
  return `gymsense:diet:trackers:v1:${day}`;
}
export function restoreTrackers(raw: string | null): DailyTrackers {
  const clean = { ...defaultTrackers };
  try {
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (!object(saved) || saved.version !== 1 || !object(saved.trackers))
      return clean;
    for (const key of Object.keys(clean) as (keyof DailyTrackers)[]) {
      const value = saved.trackers[key];
      if (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100000 &&
        (!key.endsWith("Target") || value > 0)
      )
        clean[key] = value;
    }
    return clean;
  } catch {
    return clean;
  }
}
export function mealIngredients(recipe: MealRecipe, factor: number) {
  return recipe.ingredients.map((item) => ({
    name: foodById.get(item.foodId)!.name,
    grams: round(item.grams * factor),
  }));
}
