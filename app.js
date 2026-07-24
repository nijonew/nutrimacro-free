// ============================================================
// Shared app config + Supabase client
// Replaces: the Apps Script API_URL/token system entirely.
// Requires these two <script> tags BEFORE this one, in every page:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="./calc.js"></script>
// ============================================================

const SUPABASE_URL = "https://kfoiujnlgrhurzfhypsh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fSPn9AXfIIi9GuDpE05zfg_VmOSnycm";

// `supabase` here is the global object injected by the CDN script tag.
// `sb` is OUR client instance — keep these names distinct.
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const USDA_FUNCTION_URL = SUPABASE_URL + "/functions/v1/usda";

// ============================================================
// Auth — replaces Auth.gs entirely. Supabase handles password
// hashing, sessions, and token validation; nothing custom needed.
// ============================================================

async function signUp(email, password) {
  const { data, error } = await sb.auth.signUp({ email: email, password: password });
  if (error) throw new Error(error.message);
  return data;
}

async function logIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email: email, password: password });
  if (error) throw new Error(error.message);
  return data;
}

async function logOut() {
  await sb.auth.signOut();
}

async function sendPasswordReset(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

/**
 * Call at the top of every page's load handler. Redirects to the
 * login page if there's no active session, otherwise returns it.
 * Replaces the old synchronous isConfigured() check.
 */
async function requireAuth() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = "./index.html";
    return null;
  }
  return data.session;
}

async function getCurrentUserId() {
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new Error("Not signed in.");
  return data.session.user.id;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function(err) {
      console.log("Service worker registration failed:", err);
    });
  }
}

/**
 * Returns a YYYY-MM-DD string for the given Date using LOCAL calendar
 * components. Fixes a real bug: `input.valueAsDate = new Date()` and
 * `date.toISOString().slice(0,10)` both convert through UTC internally,
 * which silently rolls the date forward for anyone west of UTC (all of
 * the US) once it's evening — logging "today" would land on tomorrow.
 * This is the one safe way to get/set a date input's "today".
 */
function localDateString(date) {
  date = date || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// ============================================================
// apiGet / apiPost — compatibility shim.
// Every existing page keeps calling these exactly as before;
// only the implementation underneath has changed.
// ============================================================

async function apiGet(action, params) {
  params = params || {};
  try {
    const data = await routeAction(action, params);
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function apiPost(action, body) {
  body = body || {};
  try {
    const data = await routeAction(action, body);
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function routeAction(action, params) {

  switch (action) {

    case "getFoodNames": return getFoodNames();
    case "getFoodDetails": return getFoodDetails(params.name);
    case "updateFood": return updateFood(params.originalName, params.fields);
    case "addManualFood": return addManualFood(params.fields);

    case "searchFoods": return callUsdaFunction("search", { query: params.query });
    case "importFood": return callUsdaFunction("import", { fdcId: params.fdcId });

    case "getRecipeNames": return getRecipeNames();
    case "saveRecipe": return saveRecipe(params.recipeName, params.ingredients, params.servings);
    case "recalculateRecipe": return recalculateRecipe(params.recipeName);
    case "getRecipeForEditing": return getRecipeForEditing(params.name);

    case "getDailyLogEntries": return getDailyLogEntries(params.date);
    case "batchLogEntries": return batchLogEntries(params.entries);
    case "repeatMeal": return repeatMeal(params.sourceDate, params.meal, params.targetDate);
    case "getRecentFoods": return getRecentFoods(params.limit);
    case "deleteDailyLogEntry": return deleteDailyLogEntry(params.id);
    case "updateDailyLogEntry": return updateDailyLogEntry(params.id, params.amount, params.unit, params.meal, params.notes);
    case "recalculatePastLogsForFood": return recalculatePastLogsForFood(params.name);
    case "recalculatePastLogsForRecipe": return recalculatePastLogsForRecipe(params.name);

    case "getFavoriteMealNames": return getFavoriteMealNames();
    case "saveFavoriteMeal": return saveFavoriteMeal(params.name, params.items);
    case "getFavoriteMeal": return getFavoriteMeal(params.name);
    case "deleteFavoriteMeal": return deleteFavoriteMeal(params.name);

    case "getExerciseNames": return getExerciseNames();
    case "addExercise": return addExercise(params.name, params.category, params.notes);
    case "getExerciseHistory": return getExerciseHistory(params.exercise, params.sessionLimit);
    case "getWorkoutEntries": return getWorkoutEntries(params.date);
    case "deleteWorkoutSet": return deleteWorkoutSet(params.id);
    case "batchLogWorkoutSets": return batchLogWorkoutSets(params.sets);
    case "getWorkoutTemplateNames": return getWorkoutTemplateNames();
    case "getWorkoutTemplate": return getWorkoutTemplate(params.name);
    case "saveWorkoutTemplate": return saveWorkoutTemplate(params.templateName, params.exercises);

    default:
      throw new Error("Unknown or not-yet-migrated action: " + action);
  }

}

async function callUsdaFunction(usdaAction, payload) {
  const session = await requireAuth();
  const response = await fetch(USDA_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + session.access_token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(Object.assign({ action: usdaAction }, payload))
  });
  const json = await response.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

// ============================================================
// Foods
// ============================================================

async function getFoodNames() {
  const { data, error } = await sb.from("foods").select("name").eq("active", true)
    .order("favorite", { ascending: false }).order("name");
  if (error) throw new Error(error.message);
  return data.map(function(row) { return row.name; });
}

async function getFoodDetails(name) {
  const { data, error } = await sb.from("foods").select("*").ilike("name", name).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Food not found: " + name);
  return {
    name: data.name, brand: data.brand, servingSize: data.serving_size, servingUnit: data.serving_unit,
    altServingSize: data.alt_serving_size, altServingUnit: data.alt_serving_unit,
    calories: data.calories, protein: data.protein, fat: data.fat, carbs: data.carbs, fiber: data.fiber,
    notes: data.notes, favorite: data.favorite, active: data.active
  };
}

async function updateFood(originalName, fields) {
  const { data: existing, error: findError } = await sb.from("foods").select("id").ilike("name", originalName).maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!existing) throw new Error("Food not found: " + originalName);

  const { data, error } = await sb.from("foods").update({
    name: fields.name, brand: fields.brand || null,
    serving_size: Number(fields.servingSize) || 100, serving_unit: fields.servingUnit || "g",
    alt_serving_size: fields.altServingSize ? Number(fields.altServingSize) : null,
    alt_serving_unit: fields.altServingSize ? (fields.altServingUnit || null) : null,
    calories: Number(fields.calories) || 0, protein: Number(fields.protein) || 0,
    fat: Number(fields.fat) || 0, carbs: Number(fields.carbs) || 0, fiber: Number(fields.fiber) || 0,
    notes: fields.notes || null, favorite: !!fields.favorite, updated_at: new Date().toISOString()
  }).eq("id", existing.id).select("name").single();

  if (error) throw new Error(error.message);
  return { name: data.name };
}

async function addManualFood(fields) {
  if (!fields.name) throw new Error("Food name is required.");

  const { data: existing } = await sb.from("foods").select("id").ilike("name", fields.name).maybeSingle();
  if (existing) throw new Error("A food with that name already exists.");

  const userId = await getCurrentUserId();

  const { data, error } = await sb.from("foods").insert({
    user_id: userId, name: fields.name, source: "Manual", brand: fields.brand || null,
    serving_size: Number(fields.servingSize) || 100, serving_unit: fields.servingUnit || "g",
    alt_serving_size: fields.altServingSize ? Number(fields.altServingSize) : null,
    alt_serving_unit: fields.altServingSize ? (fields.altServingUnit || null) : null,
    calories: Number(fields.calories) || 0, protein: Number(fields.protein) || 0,
    fat: Number(fields.fat) || 0, carbs: Number(fields.carbs) || 0, fiber: Number(fields.fiber) || 0,
    notes: fields.notes || null, favorite: !!fields.favorite, active: true
  }).select("name").single();

  if (error) throw new Error(error.message);
  return { name: data.name };
}

// ============================================================
// Recipes
// ============================================================

async function getRecipeNames() {
  const { data, error } = await sb.from("recipes").select("name").order("name");
  if (error) throw new Error(error.message);
  return [...new Set(data.map(function(row) { return row.name; }))];
}

async function findOrCreateRecipe(recipeName) {
  const userId = await getCurrentUserId();
  const { data: existing } = await sb.from("recipes").select("id").ilike("name", recipeName).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await sb.from("recipes").insert({ user_id: userId, name: recipeName }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function saveRecipe(recipeName, ingredients, servings) {

  if (!recipeName || !ingredients || ingredients.length === 0) {
    throw new Error("Recipe name and at least one ingredient are required.");
  }

  const recipeId = await findOrCreateRecipe(recipeName);

  // Full replace, not append — this is what makes editing an existing
  // recipe (remove/change ingredients, then re-save) actually work,
  // instead of silently piling up duplicate ingredient rows.
  const { error: deleteError } = await sb.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
  if (deleteError) throw new Error(deleteError.message);

  for (const ing of ingredients) {
    const { data: food, error: foodError } = await sb.from("foods").select("id").ilike("name", ing.ingredient).maybeSingle();
    if (foodError) throw new Error(foodError.message);
    if (!food) throw new Error("Ingredient not found in your Foods: " + ing.ingredient);

    const { error: insertError } = await sb.from("recipe_ingredients").insert({
      recipe_id: recipeId, food_id: food.id, amount: ing.amount, unit: ing.unit
    });
    if (insertError) throw new Error(insertError.message);
  }

  if (servings !== undefined && servings !== null && servings !== "") {
    await sb.from("recipes").update({ servings: Number(servings) }).eq("id", recipeId);
  }

  return calculateRecipeSummary(sb, recipeId);

}

/**
 * Loads an existing recipe's servings + ingredient list, so the Recipe
 * screen can populate its editor with a saved recipe instead of only
 * building new ones from scratch.
 */
async function getRecipeForEditing(recipeName) {

  const { data: recipe, error } = await sb.from("recipes").select("id, servings").ilike("name", recipeName).maybeSingle();
  if (error) throw new Error(error.message);
  if (!recipe) throw new Error("Recipe not found: " + recipeName);

  const { data: rows, error: ingError } = await sb
    .from("recipe_ingredients")
    .select("amount, unit, foods(name)")
    .eq("recipe_id", recipe.id);

  if (ingError) throw new Error(ingError.message);

  const ingredients = (rows || []).map(function(row) {
    return { name: row.foods ? row.foods.name : "", amount: row.amount, unit: row.unit };
  });

  return { servings: recipe.servings || 1, ingredients: ingredients };

}

async function recalculateRecipe(recipeName) {
  const { data: recipe, error } = await sb.from("recipes").select("id").ilike("name", recipeName).maybeSingle();
  if (error) throw new Error(error.message);
  if (!recipe) throw new Error("Recipe not found: " + recipeName);
  return calculateRecipeSummary(sb, recipe.id);
}

// ============================================================
// Daily Log
// ============================================================

async function resolveRecipeServingBasis(recipeId) {
  const { data: recipe, error } = await sb.from("recipes").select("servings").eq("id", recipeId).single();
  if (error) throw new Error(error.message);
  const servings = recipe.servings || 1;

  const summary = await calculateRecipeSummary(sb, recipeId);
  return {
    servingSize: summary.totalWeight / servings,
    servingUnit: "g",
    macros: {
      calories: summary.calories / servings, protein: summary.protein / servings,
      fat: summary.fat / servings, carbs: summary.carbs / servings, fiber: summary.fiber / servings
    }
  };
}

async function logOneEntry(userId, e) {

  let servingSize, servingUnit, macros, foodId = null, recipeId = null, altServingSize = null, altServingUnit = null;

  if (e.type === "Food") {
    const { data: food, error } = await sb.from("foods").select("*").ilike("name", e.name).maybeSingle();
    if (error) throw new Error(error.message);
    if (!food) throw new Error("Food not found: " + e.name);
    foodId = food.id;
    servingSize = food.serving_size; servingUnit = food.serving_unit;
    altServingSize = food.alt_serving_size; altServingUnit = food.alt_serving_unit;
    macros = { calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs, fiber: food.fiber };
  } else if (e.type === "Recipe") {
    const { data: recipe, error } = await sb.from("recipes").select("id").ilike("name", e.name).maybeSingle();
    if (error) throw new Error(error.message);
    if (!recipe) throw new Error("Recipe not found: " + e.name);
    recipeId = recipe.id;
    const basis = await resolveRecipeServingBasis(recipe.id);
    servingSize = basis.servingSize; servingUnit = basis.servingUnit; macros = basis.macros;
  } else {
    throw new Error("Type must be 'Food' or 'Recipe'.");
  }

  const result = calculateMacros(e.amount, e.unit, servingSize, servingUnit, macros, altServingSize, altServingUnit);

  const { error: insertError } = await sb.from("daily_log").insert({
    user_id: userId, log_date: e.date, meal: e.meal, food_id: foodId, recipe_id: recipeId,
    amount: e.amount, unit: e.unit, calories: result.calories, protein: result.protein,
    fat: result.fat, carbs: result.carbs, fiber: result.fiber, net_carbs: result.netCarbs,
    notes: e.notes || null
  });
  if (insertError) throw new Error(insertError.message);

  return result;

}

async function batchLogEntries(entries) {
  const userId = await getCurrentUserId();
  const results = [];
  for (const e of entries) {
    try {
      const result = await logOneEntry(userId, e);
      results.push({ success: true, name: e.name, result: result });
    } catch (err) {
      results.push({ success: false, name: e.name, error: err.message });
    }
  }
  return results;
}

async function getDailyLogEntries(dateStr) {

  const { data, error } = await sb
    .from("daily_log")
    .select("*, foods(name), recipes(name)")
    .eq("log_date", dateStr);

  if (error) throw new Error(error.message);

  const entries = data.map(function(row) {
    return {
      id: row.id, meal: row.meal, type: row.food_id ? "Food" : "Recipe",
      name: row.foods ? row.foods.name : (row.recipes ? row.recipes.name : ""),
      amount: row.amount, unit: row.unit, calories: row.calories, protein: row.protein,
      fat: row.fat, carbs: row.carbs, fiber: row.fiber, netCarbs: row.net_carbs, notes: row.notes
    };
  });

  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, netCarbs: 0 };
  entries.forEach(function(e) {
    totals.calories += Number(e.calories) || 0;
    totals.protein += Number(e.protein) || 0;
    totals.fat += Number(e.fat) || 0;
    totals.carbs += Number(e.carbs) || 0;
    totals.fiber += Number(e.fiber) || 0;
    totals.netCarbs += Number(e.netCarbs) || 0;
  });
  Object.keys(totals).forEach(function(k) { totals[k] = round2(totals[k]); });

  return { entries: entries, totals: totals };

}

async function repeatMeal(sourceDate, meal, targetDate) {

  const userId = await getCurrentUserId();
  const dayData = await getDailyLogEntries(sourceDate);
  const matching = dayData.entries.filter(function(e) { return e.meal === meal; });
  if (matching.length === 0) throw new Error("No entries found for " + meal + " on that date.");

  // Re-resolve food/recipe ids by name since getDailyLogEntries only returns names
  const rows = [];
  for (const e of matching) {
    let foodId = null, recipeId = null;
    if (e.type === "Food") {
      const { data } = await sb.from("foods").select("id").ilike("name", e.name).maybeSingle();
      foodId = data ? data.id : null;
    } else {
      const { data } = await sb.from("recipes").select("id").ilike("name", e.name).maybeSingle();
      recipeId = data ? data.id : null;
    }
    rows.push({
      user_id: userId, log_date: targetDate, meal: e.meal, food_id: foodId, recipe_id: recipeId,
      amount: e.amount, unit: e.unit, calories: e.calories, protein: e.protein, fat: e.fat,
      carbs: e.carbs, fiber: e.fiber, net_carbs: e.netCarbs, notes: e.notes || null
    });
  }

  const { error } = await sb.from("daily_log").insert(rows);
  if (error) throw new Error(error.message);

  return { count: rows.length };

}

/**
 * Replaces: the "Recent Foods quick-add" item from PENDING.md.
 * Looks at the most recently logged rows (any date) and returns the
 * first (i.e. most recent) occurrence of each distinct food/recipe,
 * along with the amount/unit it was last logged with — so the Log
 * screen can offer true one-tap re-logging of common items.
 */
async function getRecentFoods(limit) {

  limit = limit || 8;
  const userId = await getCurrentUserId();

  // Pull a generous window of recent rows so we have enough distinct
  // items to fill `limit` after de-duplicating.
  const { data, error } = await sb
    .from("daily_log")
    .select("food_id, recipe_id, amount, unit, meal, foods(name), recipes(name), created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  if (!data) return [];

  const seen = new Set();
  const recents = [];

  for (const row of data) {

    const key = row.food_id ? ("food:" + row.food_id) : ("recipe:" + row.recipe_id);
    if (seen.has(key)) continue;
    seen.add(key);

    const type = row.food_id ? "Food" : "Recipe";
    const name = row.foods ? row.foods.name : (row.recipes ? row.recipes.name : "");
    if (!name) continue;

    recents.push({ name: name, type: type, amount: row.amount, unit: row.unit, meal: row.meal });

    if (recents.length >= limit) break;

  }

  return recents;

}

// ============================================================
// Workouts — Exercises, Workout Log, Templates
// Replaces: Workout.gs in full
// ============================================================

async function getExerciseNames() {
  const { data, error } = await sb.from("exercises").select("name").eq("active", true).order("name");
  if (error) throw new Error(error.message);
  return data.map(function(row) { return row.name; });
}

async function addExercise(name, category, notes) {
  if (!name) throw new Error("Exercise name is required.");

  const { data: existing } = await sb.from("exercises").select("id").ilike("name", name).maybeSingle();
  if (existing) throw new Error("That exercise already exists.");

  const userId = await getCurrentUserId();
  const { data, error } = await sb.from("exercises").insert({
    user_id: userId, name: name, category: category || null, notes: notes || null, active: true
  }).select("name").single();

  if (error) throw new Error(error.message);
  return { name: data.name };
}

async function getExerciseHistory(exerciseName, sessionLimit) {

  sessionLimit = sessionLimit || 1;

  const { data: exercise } = await sb.from("exercises").select("id").ilike("name", exerciseName).maybeSingle();
  if (!exercise) return { sessions: [] };

  // Pull recent rows for this exercise, newest first. 200 is generous
  // headroom for grouping into `sessionLimit` distinct workout days.
  const { data, error } = await sb
    .from("workout_log")
    .select("log_date, set_number, weight, unit, reps, notes")
    .eq("exercise_id", exercise.id)
    .order("log_date", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return { sessions: [] };

  const byDate = {};
  data.forEach(function(row) {
    if (!byDate[row.log_date]) byDate[row.log_date] = [];
    byDate[row.log_date].push({ setNumber: row.set_number, weight: row.weight, unit: row.unit, reps: row.reps, notes: row.notes });
  });

  const dateKeys = Object.keys(byDate).sort().reverse().slice(0, sessionLimit);

  const sessions = dateKeys.map(function(dateKey) {
    const sets = byDate[dateKey].sort(function(a, b) { return (a.setNumber || 0) - (b.setNumber || 0); });
    return { date: dateKey, sets: sets };
  });

  return { sessions: sessions };

}

async function getWorkoutEntries(dateStr) {
  const { data, error } = await sb
    .from("workout_log")
    .select("id, workout_name, set_number, weight, unit, reps, notes, exercises(name)")
    .eq("log_date", dateStr);

  if (error) throw new Error(error.message);

  const entries = data.map(function(row) {
    return {
      id: row.id, workoutName: row.workout_name, exercise: row.exercises ? row.exercises.name : "",
      setNumber: row.set_number, weight: row.weight, unit: row.unit, reps: row.reps, notes: row.notes
    };
  });

  return { entries: entries };
}

async function deleteWorkoutSet(id) {
  const userId = await getCurrentUserId();
  const { error } = await sb.from("workout_log").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { deleted: true };
}

async function logOneWorkoutSet(userId, s) {
  const { data: exercise, error: exError } = await sb.from("exercises").select("id").ilike("name", s.exercise).maybeSingle();
  if (exError) throw new Error(exError.message);
  if (!exercise) throw new Error("Exercise not found: " + s.exercise);

  const { error } = await sb.from("workout_log").insert({
    user_id: userId, log_date: s.date, workout_name: s.workoutName || null, exercise_id: exercise.id,
    set_number: s.setNumber, weight: s.weight, unit: s.unit || "lb", reps: s.reps, notes: s.notes || null
  });
  if (error) throw new Error(error.message);
}

async function batchLogWorkoutSets(sets) {
  const userId = await getCurrentUserId();
  const results = [];
  for (const s of sets) {
    try {
      await logOneWorkoutSet(userId, s);
      results.push({ success: true, exercise: s.exercise, setNumber: s.setNumber });
    } catch (err) {
      results.push({ success: false, exercise: s.exercise, setNumber: s.setNumber, error: err.message });
    }
  }
  return results;
}

async function getWorkoutTemplateNames() {
  const { data, error } = await sb.from("workout_templates").select("name").order("name");
  if (error) throw new Error(error.message);
  return [...new Set(data.map(function(row) { return row.name; }))];
}

async function getWorkoutTemplate(templateName) {
  const { data: template, error } = await sb.from("workout_templates").select("id").ilike("name", templateName).maybeSingle();
  if (error) throw new Error(error.message);
  if (!template) return { exercises: [] };

  const { data, error: exError } = await sb
    .from("workout_template_exercises")
    .select("order_index, target_sets, target_reps, target_weight, notes, exercises(name)")
    .eq("template_id", template.id)
    .order("order_index");

  if (exError) throw new Error(exError.message);

  const exercises = data.map(function(row) {
    return {
      exercise: row.exercises ? row.exercises.name : "", order: row.order_index,
      targetSets: row.target_sets, targetReps: row.target_reps, targetWeight: row.target_weight, notes: row.notes
    };
  });

  return { exercises: exercises };
}

async function saveWorkoutTemplate(templateName, exercises) {

  if (!templateName || !exercises || exercises.length === 0) {
    throw new Error("Template name and at least one exercise are required.");
  }

  const userId = await getCurrentUserId();

  let { data: template } = await sb.from("workout_templates").select("id").ilike("name", templateName).maybeSingle();
  if (!template) {
    const { data: created, error: createError } = await sb.from("workout_templates")
      .insert({ user_id: userId, name: templateName }).select("id").single();
    if (createError) throw new Error(createError.message);
    template = created;
  }

  const { count } = await sb.from("workout_template_exercises")
    .select("id", { count: "exact", head: true }).eq("template_id", template.id);
  const startOrder = count || 0;

  let inserted = 0;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: exercise, error: exError } = await sb.from("exercises").select("id").ilike("name", ex.name).maybeSingle();
    if (exError) throw new Error(exError.message);
    if (!exercise) throw new Error("Exercise not found: " + ex.name);

    const { error: insertError } = await sb.from("workout_template_exercises").insert({
      template_id: template.id, exercise_id: exercise.id, order_index: startOrder + i + 1,
      target_sets: ex.targetSets || null, target_reps: ex.targetReps || null,
      target_weight: ex.targetWeight || null, notes: ex.notes || null
    });
    if (insertError) throw new Error(insertError.message);
    inserted++;
  }

  return { templateName: templateName, count: inserted };

}

/**
 * Replaces: "No edit/delete for a logged Daily Log ... entry once
 * saved" from PENDING.md.
 */
async function deleteDailyLogEntry(id) {
  const userId = await getCurrentUserId();
  const { error } = await sb.from("daily_log").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { deleted: true };
}

async function updateDailyLogEntry(id, amount, unit, meal, notes) {

  const userId = await getCurrentUserId();

  const { data: row, error: rowError } = await sb.from("daily_log").select("food_id, recipe_id").eq("id", id).eq("user_id", userId).single();
  if (rowError) throw new Error(rowError.message);

  let servingSize, servingUnit, macros, altServingSize = null, altServingUnit = null;

  if (row.food_id) {
    const { data: food, error } = await sb.from("foods").select("*").eq("id", row.food_id).single();
    if (error) throw new Error(error.message);
    servingSize = food.serving_size; servingUnit = food.serving_unit;
    altServingSize = food.alt_serving_size; altServingUnit = food.alt_serving_unit;
    macros = { calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs, fiber: food.fiber };
  } else if (row.recipe_id) {
    const basis = await resolveRecipeServingBasis(row.recipe_id);
    servingSize = basis.servingSize; servingUnit = basis.servingUnit; macros = basis.macros;
  } else {
    throw new Error("This entry has no linked food or recipe to recalculate against.");
  }

  const result = calculateMacros(amount, unit, servingSize, servingUnit, macros, altServingSize, altServingUnit);

  const { error: updateError } = await sb.from("daily_log").update({
    amount: amount, unit: unit, meal: meal, notes: notes || null,
    calories: result.calories, protein: result.protein, fat: result.fat,
    carbs: result.carbs, fiber: result.fiber, net_carbs: result.netCarbs
  }).eq("id", id).eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  return result;

}

/**
 * Replaces: "when a Food or Recipe's macros change, offer to recalculate
 * past logged entries that used it, or leave them as historical record."
 * Re-runs calculateMacros against
 * every existing Daily Log row that used this food, using the food's
 * CURRENT macros/serving info but each row's ORIGINAL logged amount/unit
 * — then updates the stored calories/protein/fat/carbs/fiber/net_carbs.
 */
async function recalculatePastLogsForFood(name) {

  const userId = await getCurrentUserId();

  const { data: food, error: foodError } = await sb.from("foods").select("*").ilike("name", name).maybeSingle();
  if (foodError) throw new Error(foodError.message);
  if (!food) throw new Error("Food not found: " + name);

  const { data: rows, error } = await sb.from("daily_log").select("id, amount, unit").eq("user_id", userId).eq("food_id", food.id);
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return { count: 0 };

  const macros = { calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs, fiber: food.fiber };
  let updated = 0;

  for (const row of rows) {
    try {
      const result = calculateMacros(row.amount, row.unit, food.serving_size, food.serving_unit, macros, food.alt_serving_size, food.alt_serving_unit);
      const { error: updateError } = await sb.from("daily_log").update({
        calories: result.calories, protein: result.protein, fat: result.fat,
        carbs: result.carbs, fiber: result.fiber, net_carbs: result.netCarbs
      }).eq("id", row.id);
      if (!updateError) updated++;
    } catch (err) {
      // A row logged in a unit that no longer converts (rare) — skip it rather than fail the whole batch.
    }
  }

  return { count: updated };

}

async function recalculatePastLogsForRecipe(name) {

  const userId = await getCurrentUserId();

  const { data: recipe, error: recipeError } = await sb.from("recipes").select("id").ilike("name", name).maybeSingle();
  if (recipeError) throw new Error(recipeError.message);
  if (!recipe) throw new Error("Recipe not found: " + name);

  const { data: rows, error } = await sb.from("daily_log").select("id, amount, unit").eq("user_id", userId).eq("recipe_id", recipe.id);
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return { count: 0 };

  const basis = await resolveRecipeServingBasis(recipe.id);
  let updated = 0;

  for (const row of rows) {
    try {
      const result = calculateMacros(row.amount, row.unit, basis.servingSize, basis.servingUnit, basis.macros);
      const { error: updateError } = await sb.from("daily_log").update({
        calories: result.calories, protein: result.protein, fat: result.fat,
        carbs: result.carbs, fiber: result.fiber, net_carbs: result.netCarbs
      }).eq("id", row.id);
      if (!updateError) updated++;
    } catch (err) {
      // skip rows that no longer convert
    }
  }

  return { count: updated };

}

// ============================================================
// Favorite Meals — save a combo of foods/recipes as a named meal,
// re-log the whole thing in one action later.
// ============================================================

async function getFavoriteMealNames() {
  const { data, error } = await sb.from("favorite_meals").select("name").order("name");
  if (error) throw new Error(error.message);
  return data.map(function(row) { return row.name; });
}

async function saveFavoriteMeal(name, items) {

  if (!name || !items || items.length === 0) {
    throw new Error("A name and at least one item are required.");
  }

  const userId = await getCurrentUserId();

  let { data: meal } = await sb.from("favorite_meals").select("id").ilike("name", name).maybeSingle();
  if (!meal) {
    const { data: created, error: createError } = await sb.from("favorite_meals")
      .insert({ user_id: userId, name: name }).select("id").single();
    if (createError) throw new Error(createError.message);
    meal = created;
  } else {
    // Full replace, same pattern as recipe editing — re-saving a
    // favorite meal under the same name replaces its items.
    const { error: deleteError } = await sb.from("favorite_meal_items").delete().eq("favorite_meal_id", meal.id);
    if (deleteError) throw new Error(deleteError.message);
  }

  for (const item of items) {

    let foodId = null, recipeId = null;

    if (item.type === "Food") {
      const { data: food } = await sb.from("foods").select("id").ilike("name", item.name).maybeSingle();
      if (!food) throw new Error("Food not found: " + item.name);
      foodId = food.id;
    } else {
      const { data: recipe } = await sb.from("recipes").select("id").ilike("name", item.name).maybeSingle();
      if (!recipe) throw new Error("Recipe not found: " + item.name);
      recipeId = recipe.id;
    }

    const { error: insertError } = await sb.from("favorite_meal_items").insert({
      favorite_meal_id: meal.id, food_id: foodId, recipe_id: recipeId, amount: item.amount, unit: item.unit
    });
    if (insertError) throw new Error(insertError.message);

  }

  return { name: name, count: items.length };

}

async function getFavoriteMeal(name) {

  const { data: meal, error } = await sb.from("favorite_meals").select("id").ilike("name", name).maybeSingle();
  if (error) throw new Error(error.message);
  if (!meal) throw new Error("Favorite meal not found: " + name);

  const { data: rows, error: itemsError } = await sb
    .from("favorite_meal_items")
    .select("amount, unit, food_id, recipe_id, foods(name), recipes(name)")
    .eq("favorite_meal_id", meal.id);

  if (itemsError) throw new Error(itemsError.message);

  const items = (rows || []).map(function(row) {
    return {
      type: row.food_id ? "Food" : "Recipe",
      name: row.food_id ? (row.foods ? row.foods.name : "") : (row.recipes ? row.recipes.name : ""),
      amount: row.amount, unit: row.unit
    };
  });

  return { items: items };

}

async function deleteFavoriteMeal(name) {
  const { data: meal, error } = await sb.from("favorite_meals").select("id").ilike("name", name).maybeSingle();
  if (error) throw new Error(error.message);
  if (!meal) throw new Error("Favorite meal not found: " + name);
  const { error: deleteError } = await sb.from("favorite_meals").delete().eq("id", meal.id);
  if (deleteError) throw new Error(deleteError.message);
  return { deleted: true };
}

// ============================================================
// Global navigation menu (hamburger) — unchanged from before
// ============================================================

function injectNavMenu() {

  const header = document.querySelector("header");
  if (!header) return;

  const titlesEl = header.querySelector(".titles");
  if (!titlesEl) return;

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "nav-toggle-btn";
  toggleBtn.innerHTML = "&#9776;";
  toggleBtn.setAttribute("aria-label", "Menu");
  toggleBtn.onclick = function() { toggleNavPanel(); };

  const rightWrap = document.createElement("div");
  rightWrap.className = "header-right-wrap";

  Array.from(header.children).forEach(function(child) {
    if (child !== titlesEl) child.remove();
  });

  rightWrap.appendChild(toggleBtn);
  header.appendChild(rightWrap);

  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  overlay.id = "navOverlay";
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) closeNavPanel();
  });

  const panel = document.createElement("div");
  panel.className = "nav-panel";

  const groups = [
    { section: "Nutrition", items: [
      { href: "./index.html", label: "Home / Dashboard" },
      { href: "./log.html", label: "Log Food or Recipe" },
      { href: "./today.html", label: "Daily Log" },
      { href: "./recipe.html", label: "Build a Recipe" },
      { href: "./add-food.html", label: "Add Food Manually" },
      { href: "./bulk-import.html", label: "Bulk Import Foods" },
      { href: "./edit-food.html", label: "Edit a Food" }
    ]},
    { section: "Workouts", items: [
      { href: "./workout.html", label: "Log Workout" },
      { href: "./workout-history.html", label: "Workout History" },
      { href: "./workout-templates.html", label: "Build a Template" }
    ]},
    { section: "Progress", items: [
      { href: "./progress.html", label: "Log Progress" },
      { href: "./achievements.html", label: "Achievements" }
    ]},
    { section: "Account", items: [
      { href: "./settings.html", label: "Settings" },
      { href: "./report.html", label: "Reports" }
    ]}
  ];

  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  let html = "<div class='nav-panel-header'><span>Menu</span>" +
    "<button class='nav-close-btn' onclick='closeNavPanel()'>&times;</button></div>";

  groups.forEach(function(group) {
    html += "<div class='nav-section-label'>" + group.section + "</div>";
    group.items.forEach(function(item) {
      const isActive = item.href.replace("./", "") === currentPath;
      html += "<a class='nav-link" + (isActive ? " active" : "") + "' href='" + item.href + "'>" + item.label + "</a>";
    });
  });

  panel.innerHTML = html;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

}

function toggleNavPanel() {
  const overlay = document.getElementById("navOverlay");
  if (overlay) overlay.classList.toggle("open");
}

function closeNavPanel() {
  const overlay = document.getElementById("navOverlay");
  if (overlay) overlay.classList.remove("open");
}

window.addEventListener("DOMContentLoaded", function() {
  injectNavMenu();
});

// ============================================================
// Macro percent-of-calories helper — unchanged
// ============================================================

function calculateMacroPercents(totals) {
  const calories = Number(totals.calories) || 0;
  if (!calories) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round(((Number(totals.protein) || 0) * 4 / calories) * 100),
    carbs: Math.round(((Number(totals.carbs) || 0) * 4 / calories) * 100),
    fat: Math.round(((Number(totals.fat) || 0) * 9 / calories) * 100)
  };
}

// ============================================================
// Safe string embedding for inline onclick handlers — unchanged
// ============================================================

function jsStringLiteral(str) {
  return JSON.stringify(str).replace(/'/g, "\\u0027");
}

// ============================================================
// Amount display formatting — unchanged
// ============================================================

/**
 * Rounds a number to at most 1 decimal place for DISPLAY only (never
 * affects what's stored or used in macro math elsewhere). An integer
 * value displays as a plain integer, not "12.0".
 */
function formatAmountForDisplay(amount) {
  const num = Number(amount);
  if (isNaN(num)) return amount;
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString();
}
