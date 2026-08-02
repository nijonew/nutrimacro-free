// ============================================================
// Catch-up migration: pulls in anything logged via the OLD
// Google Sheets/Apps Script backend that never made it to
// Supabase (e.g. logged from a device still running stale
// cached files). Safe to re-run — it checks what's already in
// Supabase and skips duplicates rather than assuming a row count.
//
// Run with: node catchup-migrate.js
// ============================================================

require("dotenv").config();
const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = process.env.MY_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !USER_ID) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or MY_USER_ID in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const WORKBOOK_PATH = "./Macro_Tracking_Latest.xlsx";
const workbook = XLSX.readFile(WORKBOOK_PATH, { cellDates: true });

function sheetRows(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, raw: true });
}

function toISODate(value) {
  if (!value) return null;
  const d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function norm(str) {
  return String(str || "").trim().toLowerCase();
}

function numKey(n) {
  // Rounds to 2 decimals for stable dedup-key comparison, matching
  // the precision macros/amounts are already stored at.
  return Math.round((Number(n) || 0) * 100) / 100;
}

async function main() {

  console.log("Catch-up migration for user:", USER_ID);

  // ============================================================
  // 1. FOODS — insert any not already present (matched by name)
  // ============================================================
  console.log("\n--- Checking Foods ---");

  const { data: existingFoods } = await supabase.from("foods").select("id, name").eq("user_id", USER_ID);
  const foodNameToId = new Map((existingFoods || []).map(f => [norm(f.name), f.id]));

  const foodRows = sheetRows("Foods").slice(4);
  let newFoodCount = 0;

  for (const row of foodRows) {
    const name = row[2];
    if (!name) continue;
    if (foodNameToId.has(norm(name))) continue; // already migrated

    const record = {
      user_id: USER_ID,
      fdc_id: row[1] ? String(row[1]) : null,
      name: String(name).trim(),
      source: row[3] || null,
      brand: row[4] || null,
      serving_size: Number(row[5]) || 100,
      serving_unit: row[6] || "g",
      calories: Number(row[7]) || 0,
      protein: Number(row[8]) || 0,
      fat: Number(row[9]) || 0,
      carbs: Number(row[10]) || 0,
      fiber: Number(row[11]) || 0,
      favorite: row[13] === true,
      active: row[14] !== false,
      notes: row[15] || null
    };

    const { data, error } = await supabase.from("foods").insert(record).select("id").single();
    if (error) { console.error("  FAILED (food):", record.name, "-", error.message); continue; }

    foodNameToId.set(norm(record.name), data.id);
    newFoodCount++;
  }

  console.log(`  Added ${newFoodCount} new food(s).`);

  // ============================================================
  // 2. RECIPES — build a name->id map only (not re-importing
  //    ingredients this pass — flag if any recipes look new)
  // ============================================================
  // ============================================================
  // 2. RECIPES — insert any not already present (matched by name),
  //    including their ingredient rows
  // ============================================================
  console.log("\n--- Checking Recipes ---");

  const { data: existingRecipes } = await supabase.from("recipes").select("id, name").eq("user_id", USER_ID);
  const recipeNameToId = new Map((existingRecipes || []).map(r => [norm(r.name), r.id]));

  const recipeRows = sheetRows("Recipes").slice(4);
  const uniqueRecipeNames = [...new Set(recipeRows.filter(r => r[0]).map(r => String(r[0]).trim()))];
  let newRecipeCount = 0, newIngredientCount = 0;

  for (const name of uniqueRecipeNames) {
    if (recipeNameToId.has(norm(name))) continue; // already migrated

    const { data, error } = await supabase.from("recipes").insert({ user_id: USER_ID, name: name }).select("id").single();
    if (error) { console.error("  FAILED (recipe):", name, "-", error.message); continue; }

    recipeNameToId.set(norm(name), data.id);
    newRecipeCount++;
  }

  for (const row of recipeRows) {

    const recipeName = row[0];
    const ingredientName = row[1];
    const amount = row[2];
    const unit = row[3];
    if (!recipeName || !ingredientName) continue;

    // Only insert ingredients for recipes THIS RUN just created — a
    // recipe that already existed keeps whatever ingredients it has
    // in Supabase, so we don't risk duplicating rows for it.
    if (existingRecipes && existingRecipes.some(r => norm(r.name) === norm(recipeName))) continue;

    const recipeId = recipeNameToId.get(norm(recipeName));
    const foodId = foodNameToId.get(norm(ingredientName));

    if (!recipeId) { console.error("  Skipping ingredient - recipe not found:", recipeName); continue; }
    if (!foodId) { console.error("  Skipping ingredient - food not found:", ingredientName); continue; }

    const { error } = await supabase.from("recipe_ingredients").insert({
      recipe_id: recipeId, food_id: foodId, amount: Number(amount) || 0, unit: unit || "g"
    });

    if (error) { console.error("  FAILED (ingredient):", ingredientName, "in", recipeName, "-", error.message); continue; }
    newIngredientCount++;

  }

  console.log(`  Added ${newRecipeCount} new recipe(s) with ${newIngredientCount} ingredient row(s).`);

  // ============================================================
  // 3. EXERCISES — insert any not already present (matched by name)
  // ============================================================
  console.log("\n--- Checking Exercises ---");

  const { data: existingExercises } = await supabase.from("exercises").select("id, name").eq("user_id", USER_ID);
  const exerciseNameToId = new Map((existingExercises || []).map(e => [norm(e.name), e.id]));

  const exerciseRows = sheetRows("Exercises").slice(4);
  let newExerciseCount = 0;

  for (const row of exerciseRows) {
    const name = row[1];
    if (!name) continue;
    if (exerciseNameToId.has(norm(name))) continue;

    const record = {
      user_id: USER_ID,
      name: String(name).trim(),
      category: row[2] || null,
      notes: row[3] || null,
      active: row[4] !== false
    };

    const { data, error } = await supabase.from("exercises").insert(record).select("id").single();
    if (error) { console.error("  FAILED (exercise):", record.name, "-", error.message); continue; }

    exerciseNameToId.set(norm(record.name), data.id);
    newExerciseCount++;
  }

  console.log(`  Added ${newExerciseCount} new exercise(s).`);

  // ============================================================
  // 3b. WORKOUT TEMPLATES — insert any not already present
  //     (matched by template name), including their exercise rows
  // ============================================================
  console.log("\n--- Checking Workout Templates ---");

  const { data: existingTemplates } = await supabase.from("workout_templates").select("id, name").eq("user_id", USER_ID);
  const templateNameToId = new Map((existingTemplates || []).map(t => [norm(t.name), t.id]));

  const templateRows = sheetRows("Workout Template").slice(4);
  const uniqueTemplateNames = [...new Set(templateRows.filter(r => r[0]).map(r => String(r[0]).trim()))];
  let newTemplateCount = 0, newTemplateExerciseCount = 0;

  for (const name of uniqueTemplateNames) {
    if (templateNameToId.has(norm(name))) continue;

    const { data, error } = await supabase.from("workout_templates").insert({ user_id: USER_ID, name: name }).select("id").single();
    if (error) { console.error("  FAILED (template):", name, "-", error.message); continue; }

    templateNameToId.set(norm(name), data.id);
    newTemplateCount++;
  }

  for (const row of templateRows) {

    const templateName = row[0];
    const exerciseName = row[1];
    const orderIndex = row[2];
    const targetSets = row[3];
    const targetReps = row[4];
    const targetWeight = row[5];
    const notes = row[6];
    if (!templateName || !exerciseName) continue;

    // Only insert exercise rows for templates THIS RUN just created —
    // an already-existing template keeps its current exercise list.
    if (existingTemplates && existingTemplates.some(t => norm(t.name) === norm(templateName))) continue;

    const templateId = templateNameToId.get(norm(templateName));
    const exerciseId = exerciseNameToId.get(norm(exerciseName));

    if (!templateId) { console.error("  Skipping template exercise - template not found:", templateName); continue; }
    if (!exerciseId) { console.error("  Skipping template exercise - exercise not found:", exerciseName); continue; }

    const { error } = await supabase.from("workout_template_exercises").insert({
      template_id: templateId, exercise_id: exerciseId, order_index: Number(orderIndex) || 1,
      target_sets: targetSets || null, target_reps: targetReps || null,
      target_weight: targetWeight || null, notes: notes || null
    });

    if (error) { console.error("  FAILED (template exercise):", exerciseName, "in", templateName, "-", error.message); continue; }
    newTemplateExerciseCount++;

  }

  console.log(`  Added ${newTemplateCount} new template(s) with ${newTemplateExerciseCount} exercise row(s).`);

  // ============================================================
  // 4. DAILY LOG — insert only rows not already present, matched
  //    by (date, meal, item name, amount, unit) as a composite key
  // ============================================================
  console.log("\n--- Checking Daily Log ---");

  const { data: existingLogs } = await supabase
    .from("daily_log")
    .select("log_date, meal, amount, unit, food_id, recipe_id, foods(name), recipes(name)")
    .eq("user_id", USER_ID);

  const existingLogKeys = new Set((existingLogs || []).map(row => {
    const name = row.food_id ? (row.foods ? row.foods.name : "") : (row.recipes ? row.recipes.name : "");
    return [row.log_date, norm(row.meal), norm(name), numKey(row.amount), norm(row.unit)].join("|");
  }));

  const logRows = sheetRows("Daily Log").slice(4);
  let newLogCount = 0, skippedLogCount = 0;

  for (const row of logRows) {
    const date = row[0];
    if (!date) continue;

    const meal = row[1];
    const foodName = row[2];
    const recipeName = row[3];
    const amount = row[4];
    const unit = row[5];

    const logDate = toISODate(date);
    const itemName = foodName || recipeName || "";

    const key = [logDate, norm(meal), norm(itemName), numKey(amount), norm(unit)].join("|");
    if (existingLogKeys.has(key)) { skippedLogCount++; continue; }

    const foodId = foodName ? foodNameToId.get(norm(foodName)) : null;
    const recipeId = recipeName ? recipeNameToId.get(norm(recipeName)) : null;

    if (foodName && !foodId) { console.error("  Skipping log row - food not found:", foodName); continue; }
    if (recipeName && !recipeId) { console.error("  Skipping log row - recipe not found:", recipeName); continue; }

    const record = {
      user_id: USER_ID,
      log_date: logDate,
      meal: meal || "Other",
      food_id: foodId || null,
      recipe_id: recipeId || null,
      amount: Number(amount) || 0,
      unit: unit || "g",
      calories: Number(row[6]) || 0,
      protein: Number(row[7]) || 0,
      fat: Number(row[8]) || 0,
      carbs: Number(row[9]) || 0,
      fiber: Number(row[10]) || 0,
      net_carbs: Number(row[11]) || 0,
      notes: row[12] || null
    };

    const { error } = await supabase.from("daily_log").insert(record);
    if (error) { console.error("  FAILED (log entry):", itemName, "on", logDate, "-", error.message); continue; }
    newLogCount++;
  }

  console.log(`  Added ${newLogCount} new daily log entr${newLogCount === 1 ? "y" : "ies"}, skipped ${skippedLogCount} already present.`);

  // ============================================================
  // 5. WORKOUT LOG — same dedup approach
  // ============================================================
  console.log("\n--- Checking Workout Log ---");

  const { data: existingSets } = await supabase
    .from("workout_log")
    .select("log_date, workout_name, set_number, weight, unit, reps, exercises(name)")
    .eq("user_id", USER_ID);

  const existingSetKeys = new Set((existingSets || []).map(row => {
    const exerciseName = row.exercises ? row.exercises.name : "";
    return [row.log_date, norm(exerciseName), row.set_number, numKey(row.weight), norm(row.unit), row.reps].join("|");
  }));

  const workoutRows = sheetRows("Workout Log").slice(4);
  let newSetCount = 0, skippedSetCount = 0;

  for (const row of workoutRows) {
    const date = row[0];
    if (!date) continue;

    const workoutName = row[1];
    const exercise = row[2];
    const setNumber = row[3];
    const weight = row[4];
    const unit = row[5];
    const reps = row[6];
    const notes = row[7];

    const logDate = toISODate(date);
    const key = [logDate, norm(exercise), setNumber, numKey(weight), norm(unit), reps].join("|");
    if (existingSetKeys.has(key)) { skippedSetCount++; continue; }

    let exerciseId = exerciseNameToId.get(norm(exercise));

    if (!exerciseId) {
      // Referenced by a logged set but never formally created (likely
      // from editing the sheet directly during backlogging) — create
      // it now rather than losing the set.
      const { data: createdExercise, error: exError } = await supabase
        .from("exercises")
        .insert({ user_id: USER_ID, name: String(exercise).trim(), active: true })
        .select("id")
        .single();
      if (exError) { console.error("  Skipping set - could not create missing exercise:", exercise, "-", exError.message); continue; }
      exerciseId = createdExercise.id;
      exerciseNameToId.set(norm(exercise), exerciseId);
      console.log("  Auto-created missing exercise:", exercise);
    }

    const record = {
      user_id: USER_ID,
      log_date: logDate,
      workout_name: workoutName || null,
      exercise_id: exerciseId,
      set_number: setNumber,
      weight: weight,
      unit: unit || "lb",
      reps: reps,
      notes: notes || null
    };

    const { error } = await supabase.from("workout_log").insert(record);
    if (error) { console.error("  FAILED (workout set):", exercise, "on", logDate, "-", error.message); continue; }
    newSetCount++;
  }

  console.log(`  Added ${newSetCount} new workout set(s), skipped ${skippedSetCount} already present.`);

  console.log("\n=== Catch-up migration complete ===");

}

main().catch(err => {
  console.error("Migration script crashed:", err);
  process.exit(1);
});
