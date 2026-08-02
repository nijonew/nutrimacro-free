// ============================================================
// One-time migration: Google Sheets export -> Supabase
// Run with: node migrate.js
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

const WORKBOOK_PATH = "./Macro_Tracking_0_0__3_.xlsx";
const workbook = XLSX.readFile(WORKBOOK_PATH, { cellDates: true });

// Helper: read a sheet into an array of row-arrays (0-indexed),
// matching how the spreadsheet actually looks (row 4 = headers, row 5+ = data)
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

async function main() {

  console.log("Starting migration for user:", USER_ID);

  // ============================================================
  // 1. FOODS
  // ============================================================
  console.log("\n--- Migrating Foods ---");

  const foodRows = sheetRows("Foods").slice(4); // data starts at row 5 (index 4)
  const foodNameToId = new Map(); // lowercased trimmed name -> new uuid

  for (const row of foodRows) {
    const name = row[2]; // column C
    if (!name) continue;

    const record = {
      user_id: USER_ID,
      fdc_id: row[1] ? String(row[1]) : null,      // B
      name: String(name).trim(),                    // C
      source: row[3] || null,                        // D
      brand: row[4] || null,                          // E
      serving_size: Number(row[5]) || 100,            // F
      serving_unit: row[6] || "g",                    // G
      calories: Number(row[7]) || 0,                  // H
      protein: Number(row[8]) || 0,                   // I
      fat: Number(row[9]) || 0,                       // J
      carbs: Number(row[10]) || 0,                    // K
      fiber: Number(row[11]) || 0,                    // L
      favorite: row[13] === true,                     // N
      active: row[14] !== false,                      // O
      notes: row[15] || null                           // P
    };

    const { data, error } = await supabase.from("foods").insert(record).select("id").single();

    if (error) {
      console.error("  FAILED:", record.name, "-", error.message);
      continue;
    }

    foodNameToId.set(norm(record.name), data.id);
  }

  console.log(`  Inserted ${foodNameToId.size} foods.`);

  // ============================================================
  // 2. RECIPES + RECIPE INGREDIENTS
  // ============================================================
  console.log("\n--- Migrating Recipes ---");

  const recipeRows = sheetRows("Recipes").slice(4);
  const recipeNameToId = new Map();

  // First pass: find unique recipe names, create the parent recipe rows
  const uniqueRecipeNames = [...new Set(
    recipeRows.filter(r => r[0]).map(r => String(r[0]).trim())
  )];

  for (const name of uniqueRecipeNames) {
    const { data, error } = await supabase
      .from("recipes")
      .insert({ user_id: USER_ID, name: name, servings: 1 })
      .select("id")
      .single();

    if (error) {
      console.error("  FAILED (recipe):", name, "-", error.message);
      continue;
    }
    recipeNameToId.set(norm(name), data.id);
  }

  console.log(`  Inserted ${recipeNameToId.size} recipes.`);

  // Second pass: ingredient rows
  let ingredientCount = 0;
  for (const row of recipeRows) {
    const recipeName = row[0];
    const ingredientName = row[1];
    const amount = row[2];
    const unit = row[3];
    if (!recipeName || !ingredientName) continue;

    const recipeId = recipeNameToId.get(norm(recipeName));
    const foodId = foodNameToId.get(norm(ingredientName));

    if (!recipeId) { console.error("  Skipping ingredient - recipe not found:", recipeName); continue; }
    if (!foodId) { console.error("  Skipping ingredient - food not found:", ingredientName); continue; }

    const { error } = await supabase.from("recipe_ingredients").insert({
      recipe_id: recipeId,
      food_id: foodId,
      amount: Number(amount) || 0,
      unit: unit || "g"
    });

    if (error) {
      console.error("  FAILED (ingredient):", ingredientName, "in", recipeName, "-", error.message);
      continue;
    }
    ingredientCount++;
  }

  console.log(`  Inserted ${ingredientCount} recipe ingredients.`);

  // ============================================================
  // 3. DAILY LOG
  // ============================================================
  console.log("\n--- Migrating Daily Log ---");

  const logRows = sheetRows("Daily Log").slice(4);
  let logCount = 0;

  for (const row of logRows) {
    const date = row[0];
    if (!date) continue;

    const meal = row[1];
    const foodName = row[2];
    const recipeName = row[3];
    const amount = row[4];
    const unit = row[5];

    const foodId = foodName ? foodNameToId.get(norm(foodName)) : null;
    const recipeId = recipeName ? recipeNameToId.get(norm(recipeName)) : null;

    if (foodName && !foodId) { console.error("  Skipping log row - food not found:", foodName); continue; }
    if (recipeName && !recipeId) { console.error("  Skipping log row - recipe not found:", recipeName); continue; }

    const record = {
      user_id: USER_ID,
      log_date: toISODate(date),
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

    if (error) {
      console.error("  FAILED (log entry):", foodName || recipeName, "on", record.log_date, "-", error.message);
      continue;
    }
    logCount++;
  }

  console.log(`  Inserted ${logCount} daily log entries.`);

  // ============================================================
  // 4. ACHIEVEMENTS  (weight milestones + goal triggers)
  // ============================================================
  console.log("\n--- Migrating Achievements ---");

  const achRows = sheetRows("Achievements").slice(4);
  let achCount = 0;

  const TRIGGER_FIELD_MAP = { distance: "distance", steps: "steps", duration: "duration", sleep: "sleep_hours", weight: "weight" };

  function parseGoalTrigger(text) {
    if (!text || norm(text) === "manual") return { trigger_type: "manual", trigger_field: null, trigger_operator: null, trigger_value: null };
    const match = String(text).match(/^\s*([A-Za-z ]+?)\s*(>=|<=|==|>|<)\s*([\d.]+)/);
    if (!match) return { trigger_type: "manual", trigger_field: null, trigger_operator: null, trigger_value: null };
    const field = TRIGGER_FIELD_MAP[match[1].trim().toLowerCase()] || null;
    return { trigger_type: "metric_trigger", trigger_field: field, trigger_operator: match[2], trigger_value: parseFloat(match[3]) };
  }

  for (const row of achRows) {

    // Weight-milestone half: columns A-D (Target, Category, Description, Date Earned)
    const target = row[0];
    if (target) {
      const { error } = await supabase.from("achievements").insert({
        user_id: USER_ID,
        label: row[2] || ("Reach " + target),
        category: row[1] || null,
        trigger_type: "weight_target",
        trigger_field: "weight",
        trigger_operator: "<=",
        trigger_value: Number(target),
        date_earned: toISODate(row[3])
      });
      if (error) console.error("  FAILED (weight milestone):", target, "-", error.message);
      else achCount++;
    }

    // Goal-trigger half: columns G-J (Goal, Category, Trigger, Date Earned)
    const goal = row[6];
    if (goal) {
      const parsed = parseGoalTrigger(row[8]);
      const { error } = await supabase.from("achievements").insert({
        user_id: USER_ID,
        label: goal,
        category: row[7] || null,
        trigger_type: parsed.trigger_type,
        trigger_field: parsed.trigger_field,
        trigger_operator: parsed.trigger_operator,
        trigger_value: parsed.trigger_value,
        date_earned: toISODate(row[9])
      });
      if (error) console.error("  FAILED (goal achievement):", goal, "-", error.message);
      else achCount++;
    }
  }

  console.log(`  Inserted ${achCount} achievements.`);

  console.log("\n=== Migration complete ===");

}

main().catch(err => {
  console.error("Migration script crashed:", err);
  process.exit(1);
});
