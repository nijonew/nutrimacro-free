// ============================================================
// calc.js — shared calculation logic (no secrets, pure math)
// Replaces: Utilities.gs (calculateMacros, unit tables) and
//           the summing portion of Recipes.gs (calculateRecipeSummary)
// ============================================================

const WEIGHT_TO_GRAMS = { "g": 1, "kg": 1000, "oz": 28.3495, "lb": 453.592 };
const VOLUME_TO_ML = { "ml": 1, "l": 1000, "tsp": 4.92892, "tbsp": 14.7868, "cup": 236.588, "fl_oz": 29.5735 };

function round2(n) {
  return Math.round(n * 100) / 100;
}

function getUnitCategory(unit) {
  const u = unit.toLowerCase().trim();
  if (WEIGHT_TO_GRAMS[u]) return "weight";
  if (VOLUME_TO_ML[u]) return "volume";
  return "other";
}

/**
 * Scales a food's stored macros (per its native serving) to whatever
 * amount/unit was actually logged. Accepts an optional SECOND serving
 * basis (altServingSize/altServingUnit) — e.g. a food listed as both
 * "30g" and "5 pieces" — which is tried if the primary basis can't
 * convert the logged unit (rather than immediately erroring out).
 */
function calculateMacros(amount, unit, servingSize, servingUnit, macros, altServingSize, altServingUnit) {

  const loggedUnit = unit.toLowerCase().trim();
  const nativeUnit = servingUnit.toLowerCase().trim();

  let ratio;

  if (loggedUnit === "serving" || loggedUnit === "servings") {

    ratio = amount;

  } else if (loggedUnit === nativeUnit) {

    ratio = amount / servingSize;

  } else {

    const loggedCategory = getUnitCategory(loggedUnit);
    const nativeCategory = getUnitCategory(nativeUnit);

    if (loggedCategory === "weight" && nativeCategory === "weight") {
      const loggedGrams = amount * WEIGHT_TO_GRAMS[loggedUnit];
      const nativeGrams = servingSize * WEIGHT_TO_GRAMS[nativeUnit];
      ratio = loggedGrams / nativeGrams;
    } else if (loggedCategory === "volume" && nativeCategory === "volume") {
      const loggedMl = amount * VOLUME_TO_ML[loggedUnit];
      const nativeMl = servingSize * VOLUME_TO_ML[nativeUnit];
      ratio = loggedMl / nativeMl;
    } else if (altServingSize && altServingUnit) {

      // Primary basis didn't work — try the food's second serving basis
      // before giving up (e.g. native is "30g" but this food is also
      // listed as "5 pieces", and the person logged in pieces).
      const altUnit = altServingUnit.toLowerCase().trim();

      if (loggedUnit === altUnit) {
        ratio = amount / altServingSize;
      } else {
        const altCategory = getUnitCategory(altUnit);
        if (loggedCategory === "weight" && altCategory === "weight") {
          ratio = (amount * WEIGHT_TO_GRAMS[loggedUnit]) / (altServingSize * WEIGHT_TO_GRAMS[altUnit]);
        } else if (loggedCategory === "volume" && altCategory === "volume") {
          ratio = (amount * VOLUME_TO_ML[loggedUnit]) / (altServingSize * VOLUME_TO_ML[altUnit]);
        } else {
          throw new Error(
            "Can't convert '" + unit + "' to '" + servingUnit + "' or '" + altServingUnit + "' for this food. " +
            "Try logging in " + servingUnit + " or " + altServingUnit + " instead."
          );
        }
      }

    } else {
      throw new Error(
        "Can't convert '" + unit + "' to '" + servingUnit + "' for this food. " +
        "Try logging in " + servingUnit + " instead."
      );
    }

  }

  const carbs = macros.carbs * ratio;
  const fiber = macros.fiber * ratio;

  return {
    calories: round2(macros.calories * ratio),
    protein: round2(macros.protein * ratio),
    fat: round2(macros.fat * ratio),
    carbs: round2(carbs),
    fiber: round2(fiber),
    netCarbs: round2(Math.max(0, carbs - fiber))
  };

}

/**
 * Computes a recipe's totals live, by pulling its ingredients (each a
 * food_id + amount + unit) and the underlying foods' macros, then
 * summing via calculateMacros for each ingredient.
 *
 * Replaces: Recipes.gs's calculateRecipeSummary + writeRecipeSummary.
 * Unlike the old version, nothing gets written back anywhere — this
 * always reflects the recipe's CURRENT ingredients, computed fresh
 * every time it's called. There's no separate summary row to keep in
 * sync, so there's no "did I remember to recalculate" bug possible.
 *
 * @param {SupabaseClient} supabase - an authenticated Supabase client
 * @param {string} recipeId - uuid of the recipe
 * @returns {Promise<object>} summary: { totalWeight, weightIsPartial,
 *   calories, protein, fat, carbs, fiber, calPerGram, proteinPerGram }
 */
async function calculateRecipeSummary(supabase, recipeId) {

  const { data: ingredients, error: ingError } = await supabase
    .from("recipe_ingredients")
    .select("amount, unit, food_id, foods ( calories, protein, fat, carbs, fiber, serving_size, serving_unit, alt_serving_size, alt_serving_unit )")
    .eq("recipe_id", recipeId);

  if (ingError) throw new Error(ingError.message);
  if (!ingredients || ingredients.length === 0) {
    throw new Error("No ingredients found for this recipe.");
  }

  let totalWeight = 0;
  let weightIsPartial = false;
  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

  for (const row of ingredients) {

    const food = row.foods;
    if (!food) throw new Error("An ingredient's food record is missing.");

    const macros = { calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs, fiber: food.fiber };
    const scaled = calculateMacros(row.amount, row.unit, food.serving_size, food.serving_unit, macros, food.alt_serving_size, food.alt_serving_unit);

    totals.calories += scaled.calories;
    totals.protein += scaled.protein;
    totals.fat += scaled.fat;
    totals.carbs += scaled.carbs;
    totals.fiber += scaled.fiber;

    const loggedUnit = row.unit.toLowerCase().trim();
    if (getUnitCategory(loggedUnit) === "weight") {
      totalWeight += row.amount * WEIGHT_TO_GRAMS[loggedUnit];
    } else {
      weightIsPartial = true;
    }

  }

  return {
    totalWeight: round2(totalWeight),
    weightIsPartial: weightIsPartial,
    calories: round2(totals.calories),
    protein: round2(totals.protein),
    fat: round2(totals.fat),
    carbs: round2(totals.carbs),
    fiber: round2(totals.fiber),
    calPerGram: totalWeight > 0 ? round2(totals.calories / totalWeight) : 0,
    proteinPerGram: totalWeight > 0 ? round2(totals.protein / totalWeight) : 0
  };

}
