export type Allergen =
  "nuts" | "dairy" | "gluten" | "soy" | "eggs" | "shellfish";
export type DietType =
  "vegetarian" | "vegan" | "eggetarian" | "non-vegetarian" | "pescatarian";
export type Cuisine =
  "Indian" | "Mediterranean" | "Continental" | "high-protein";
export type Budget = "budget" | "normal" | "premium";
export type MealSlot = "Breakfast" | "Lunch" | "Snack" | "Dinner";
export type FoodGroup =
  "plant" | "dairy" | "egg" | "meat" | "fish" | "shellfish";
export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
export type Food = {
  id: string;
  name: string;
  group: FoodGroup;
  allergens: Allergen[];
  per100g: Nutrition;
};
// Illustrative per-100g nutrition for a mock planner, not a clinical food database.
const food = (
  id: string,
  name: string,
  group: FoodGroup,
  allergens: Allergen[],
  values: [number, number, number, number, number],
): Food => ({
  id,
  name,
  group,
  allergens,
  per100g: {
    calories: values[0],
    protein: values[1],
    carbs: values[2],
    fat: values[3],
    fiber: values[4],
  },
});
export const foods: Food[] = [
  food("rice", "Cooked brown rice", "plant", [], [123, 2.7, 25.6, 1, 1.6]),
  food("quinoa", "Cooked quinoa", "plant", [], [120, 4.4, 21.3, 1.9, 2.8]),
  food("lentils", "Cooked lentils", "plant", [], [116, 9, 20, 0.4, 7.9]),
  food(
    "chickpeas",
    "Cooked chickpeas",
    "plant",
    [],
    [164, 8.9, 27.4, 2.6, 7.6],
  ),
  food("beans", "Cooked white beans", "plant", [], [139, 9.7, 25.1, 0.4, 6.3]),
  food("besan", "Chickpea flour", "plant", [], [387, 22, 58, 6.7, 10.8]),
  food(
    "oats",
    "Certified gluten-free oats",
    "plant",
    [],
    [389, 16.9, 66.3, 6.9, 10.6],
  ),
  food("spinach", "Spinach", "plant", [], [23, 2.9, 3.6, 0.4, 2.2]),
  food("tomato", "Tomatoes", "plant", [], [18, 0.9, 3.9, 0.2, 1.2]),
  food(
    "broccoli",
    "Ready-steamed broccoli",
    "plant",
    [],
    [35, 2.4, 7.2, 0.4, 3.3],
  ),
  food(
    "potato",
    "Ready-cooked potatoes",
    "plant",
    [],
    [87, 1.9, 20.1, 0.1, 1.8],
  ),
  food("banana", "Banana", "plant", [], [89, 1.1, 22.8, 0.3, 2.6]),
  food("orange", "Orange", "plant", [], [47, 0.9, 11.8, 0.1, 2.4]),
  food("apple", "Apple", "plant", [], [52, 0.3, 13.8, 0.2, 2.4]),
  food("seeds", "Pumpkin seeds", "plant", [], [559, 30, 11, 49, 6]),
  food("oil", "Olive oil", "plant", [], [884, 0, 0, 100, 0]),
  food(
    "roasted-gram",
    "Ready-roasted chickpeas",
    "plant",
    [],
    [370, 20, 60, 6, 17],
  ),
  food(
    "bread",
    "Whole-wheat bread",
    "plant",
    ["gluten"],
    [247, 13, 41, 4.2, 7],
  ),
  food("yogurt", "Plain Greek yogurt", "dairy", ["dairy"], [97, 9, 4, 5, 0]),
  food("paneer", "Paneer", "dairy", ["dairy"], [265, 18, 1.2, 20, 0]),
  food("tofu", "Firm tofu", "plant", ["soy"], [144, 17, 2.8, 8.7, 2.3]),
  food("almonds", "Almonds", "plant", ["nuts"], [579, 21, 22, 50, 12.5]),
  food("eggs", "Cooked eggs", "egg", ["eggs"], [155, 13, 1.1, 11, 0]),
  food(
    "chicken",
    "Ready-cooked chicken breast",
    "meat",
    [],
    [165, 31, 0, 3.6, 0],
  ),
  food("salmon", "Ready-cooked salmon", "fish", [], [208, 20, 0, 13, 0]),
  food(
    "prawns",
    "Ready-cooked prawns",
    "shellfish",
    ["shellfish"],
    [99, 24, 0.2, 0.3, 0],
  ),
];
export type MealRecipe = {
  id: string;
  name: string;
  slot: MealSlot;
  cuisines: Cuisine[];
  budget: Budget;
  minutes: number;
  mealPrep: boolean;
  ingredients: { foodId: string; grams: number }[];
  instructions: string;
};
const recipe = (
  id: string,
  name: string,
  slot: MealSlot,
  cuisine: Cuisine,
  budget: Budget,
  minutes: number,
  ingredients: [string, number][],
  instructions: string,
  mealPrep = true,
): MealRecipe => ({
  id,
  name,
  slot,
  cuisines: [cuisine],
  budget,
  minutes,
  mealPrep,
  ingredients: ingredients.map(([foodId, grams]) => ({ foodId, grams })),
  instructions,
});
export const mealRecipes: MealRecipe[] = [
  recipe(
    "indian-chilla",
    "Spinach besan chilla",
    "Breakfast",
    "Indian",
    "budget",
    14,
    [
      ["besan", 70],
      ["spinach", 50],
      ["tomato", 60],
      ["oil", 5],
    ],
    "Mix flour with water, fold in chopped vegetables, and cook thin pancakes in a lightly oiled pan.",
  ),
  recipe(
    "indian-dal",
    "Dal and brown rice bowl",
    "Lunch",
    "Indian",
    "budget",
    12,
    [
      ["lentils", 220],
      ["rice", 180],
      ["spinach", 70],
      ["oil", 5],
    ],
    "Warm the ready-cooked lentils and rice with spinach. Season to taste.",
  ),
  recipe(
    "indian-snack",
    "Roasted chana and orange",
    "Snack",
    "Indian",
    "budget",
    3,
    [
      ["roasted-gram", 45],
      ["orange", 150],
    ],
    "Portion ready-roasted chickpeas and serve with an orange.",
  ),
  recipe(
    "indian-skillet",
    "Chickpea rice skillet",
    "Dinner",
    "Indian",
    "budget",
    14,
    [
      ["chickpeas", 180],
      ["rice", 150],
      ["tomato", 100],
      ["spinach", 60],
      ["oil", 5],
    ],
    "Warm the chickpeas, rice, and vegetables in a pan with a little oil and your preferred spices.",
  ),
  recipe(
    "med-breakfast",
    "Chickpea tomato breakfast bowl",
    "Breakfast",
    "Mediterranean",
    "budget",
    10,
    [
      ["chickpeas", 160],
      ["tomato", 100],
      ["orange", 120],
      ["oil", 5],
    ],
    "Toss chickpeas with tomatoes and olive oil. Serve fruit on the side.",
  ),
  recipe(
    "med-lunch",
    "Lentil quinoa salad",
    "Lunch",
    "Mediterranean",
    "budget",
    12,
    [
      ["lentils", 200],
      ["quinoa", 170],
      ["tomato", 120],
      ["oil", 8],
    ],
    "Combine cooked lentils and quinoa with tomatoes and olive oil. Serve warm or chilled.",
  ),
  recipe(
    "med-snack",
    "Apple and pumpkin seeds",
    "Snack",
    "Mediterranean",
    "budget",
    3,
    [
      ["apple", 150],
      ["seeds", 25],
    ],
    "Pair sliced apple with a measured portion of pumpkin seeds.",
  ),
  recipe(
    "med-dinner",
    "White bean quinoa plate",
    "Dinner",
    "Mediterranean",
    "budget",
    14,
    [
      ["beans", 200],
      ["quinoa", 160],
      ["broccoli", 100],
      ["oil", 5],
    ],
    "Heat the ready-cooked beans, quinoa, and broccoli. Finish with olive oil and herbs.",
  ),
  recipe(
    "cont-oats",
    "Banana oat breakfast",
    "Breakfast",
    "Continental",
    "budget",
    10,
    [
      ["oats", 65],
      ["banana", 120],
      ["seeds", 15],
    ],
    "Cook certified gluten-free oats with water. Add banana and seeds.",
  ),
  recipe(
    "cont-potato",
    "White bean potato bowl",
    "Lunch",
    "Continental",
    "budget",
    14,
    [
      ["beans", 220],
      ["potato", 180],
      ["spinach", 60],
      ["oil", 5],
    ],
    "Warm the ready-cooked potatoes and beans, then fold in spinach and herbs.",
  ),
  recipe(
    "cont-snack",
    "Fruit and roasted chickpeas",
    "Snack",
    "Continental",
    "budget",
    3,
    [
      ["banana", 100],
      ["roasted-gram", 40],
    ],
    "Serve banana alongside ready-roasted chickpeas.",
  ),
  recipe(
    "cont-rice",
    "Herbed lentil rice plate",
    "Dinner",
    "Continental",
    "budget",
    12,
    [
      ["lentils", 220],
      ["rice", 170],
      ["broccoli", 100],
      ["oil", 5],
    ],
    "Heat cooked lentils, rice, and broccoli together and season with herbs.",
  ),
  recipe(
    "protein-chilla",
    "Lentil and chickpea pancakes",
    "Breakfast",
    "high-protein",
    "budget",
    14,
    [
      ["besan", 70],
      ["lentils", 120],
      ["spinach", 60],
      ["oil", 5],
    ],
    "Mash cooked lentils into a chickpea-flour batter with water and spinach, then pan-cook.",
  ),
  recipe(
    "protein-bowl",
    "Double-legume power bowl",
    "Lunch",
    "high-protein",
    "budget",
    12,
    [
      ["lentils", 180],
      ["chickpeas", 140],
      ["rice", 100],
      ["tomato", 100],
    ],
    "Combine warm lentils, chickpeas, and rice with chopped tomatoes.",
  ),
  recipe(
    "protein-snack",
    "Roasted chickpea seed mix",
    "Snack",
    "high-protein",
    "budget",
    3,
    [
      ["roasted-gram", 45],
      ["seeds", 20],
    ],
    "Mix ready-roasted chickpeas with pumpkin seeds and portion into a small bowl.",
  ),
  recipe(
    "protein-dinner",
    "Lentil bean quinoa bowl",
    "Dinner",
    "high-protein",
    "budget",
    14,
    [
      ["lentils", 180],
      ["beans", 150],
      ["quinoa", 140],
      ["broccoli", 100],
    ],
    "Heat the cooked legumes, quinoa, and broccoli together. Season to taste.",
  ),
  recipe(
    "indian-paneer",
    "Paneer rice bowl",
    "Lunch",
    "Indian",
    "normal",
    24,
    [
      ["paneer", 140],
      ["rice", 180],
      ["spinach", 100],
      ["oil", 5],
    ],
    "Sear paneer, fold in spinach, and serve over ready-cooked rice.",
  ),
  recipe(
    "indian-egg",
    "Egg bhurji with toast",
    "Breakfast",
    "Indian",
    "normal",
    14,
    [
      ["eggs", 150],
      ["tomato", 80],
      ["bread", 70],
      ["oil", 5],
    ],
    "Warm chopped cooked eggs and tomatoes with spices and serve with toast.",
  ),
  recipe(
    "indian-chicken",
    "Chicken and rice plate",
    "Dinner",
    "Indian",
    "normal",
    22,
    [
      ["chicken", 160],
      ["rice", 200],
      ["spinach", 100],
      ["oil", 5],
    ],
    "Warm ready-cooked chicken with spices and spinach and serve with rice.",
  ),
  recipe(
    "med-yogurt",
    "Yogurt oat almond bowl",
    "Breakfast",
    "Mediterranean",
    "normal",
    5,
    [
      ["yogurt", 220],
      ["oats", 40],
      ["almonds", 20],
      ["banana", 80],
    ],
    "Top plain Greek yogurt with oats, almonds, and banana.",
  ),
  recipe(
    "med-salmon",
    "Salmon quinoa plate",
    "Dinner",
    "Mediterranean",
    "premium",
    20,
    [
      ["salmon", 170],
      ["quinoa", 180],
      ["broccoli", 120],
    ],
    "Reheat ready-cooked salmon gently and serve with quinoa and broccoli.",
  ),
  recipe(
    "cont-eggs",
    "Egg and spinach toast",
    "Breakfast",
    "Continental",
    "normal",
    12,
    [
      ["eggs", 150],
      ["bread", 80],
      ["spinach", 80],
    ],
    "Toast the bread and serve with warmed cooked eggs and spinach.",
  ),
  recipe(
    "cont-chicken",
    "Chicken potato salad",
    "Lunch",
    "Continental",
    "normal",
    14,
    [
      ["chicken", 150],
      ["potato", 200],
      ["tomato", 120],
      ["oil", 8],
    ],
    "Toss ready-cooked chicken and potatoes with tomatoes and olive oil.",
  ),
  recipe(
    "protein-tofu",
    "Tofu breakfast scramble",
    "Breakfast",
    "high-protein",
    "normal",
    14,
    [
      ["tofu", 200],
      ["spinach", 80],
      ["tomato", 100],
      ["oil", 5],
    ],
    "Crumble tofu into a lightly oiled pan and cook with the vegetables.",
  ),
  recipe(
    "protein-prawns",
    "Prawn quinoa bowl",
    "Lunch",
    "high-protein",
    "premium",
    14,
    [
      ["prawns", 180],
      ["quinoa", 180],
      ["broccoli", 120],
      ["oil", 5],
    ],
    "Warm ready-cooked prawns with broccoli and serve over quinoa.",
  ),
  recipe(
    "protein-yogurt",
    "Greek yogurt and almonds",
    "Snack",
    "high-protein",
    "normal",
    3,
    [
      ["yogurt", 200],
      ["almonds", 20],
    ],
    "Serve plain yogurt with a small portion of almonds.",
  ),
  recipe(
    "protein-fish",
    "Salmon and lentil plate",
    "Dinner",
    "high-protein",
    "premium",
    24,
    [
      ["salmon", 160],
      ["lentils", 200],
      ["broccoli", 100],
    ],
    "Warm ready-cooked salmon and lentils and serve with broccoli.",
  ),
];
