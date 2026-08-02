// supabase/functions/usda/index.ts
//
// Replaces: USDA.gs (searchFoods, getFood, extractMacros, rankFoods, etc.)
//           + Food.gs's importFood/getNextLocalFoodId
//
// Two actions, both POST:
//   { action: "search", query: "chicken breast" }
//   { action: "import", fdcId: 173944 }
//
// The caller's Supabase auth token must be sent as:
//   Authorization: Bearer <access_token>
// so that RLS applies automatically — no manual token/userId handling needed.

import { createClient } from "jsr:@supabase/supabase-js@2";

const USDA_API_KEY = Deno.env.get("USDA_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ============================================================
// USDA fetch + ranking (ported from USDA.gs)
// ============================================================

async function fetchUSDA(url: string) {
  const response = await fetch(url);
  if (response.status === 403) throw new Error("USDA API rejected the request — check the API key.");
  if (response.status === 429) throw new Error("USDA API rate limit reached. Try again shortly.");
  if (response.status >= 500) throw new Error("USDA API is currently unavailable.");
  if (response.status !== 200) throw new Error("USDA API returned an unexpected error (" + response.status + ").");
  return response.json();
}

function rankFoods(results: any[], searchText: string) {
  const priorities: Record<string, number> = { "Foundation": 1, "SR Legacy": 2, "Survey (FNDDS)": 3, "Survey": 3, "Branded": 4 };
  const words = searchText.toLowerCase().split(/\s+/).filter(Boolean);
  const penalties = ["broth", "bouillon", "soup", "seasoning", "flavor", "lunchmeat", "deli", "spread", "dip", "baby food"];
  const isBarcodeQuery = /^\d{6,}$/.test(searchText.trim());

  for (const food of results) {
    const description = (food.description || "").toLowerCase();
    const brand = (food.brandOwner || "").toLowerCase();
    const combinedText = description + " " + brand;

    let matchedWords = 0;
    for (const word of words) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp("\\b" + escaped + "\\b");
      if (pattern.test(combinedText)) matchedWords++;
    }

    food.matchedWordCount = matchedWords;
    food.isFullMatch = matchedWords === words.length;

    let score = 0;
    if (description === searchText.toLowerCase()) score += 5000;
    if (description.startsWith(searchText.toLowerCase())) score += 1000;
    score += matchedWords * 150;
    score += (100 - (priorities[food.dataType] || 99)) * 5;
    score -= description.length * 0.3;

    // A scanned barcode should always surface its exact product first,
    // regardless of how the ranking otherwise scores it.
    if (isBarcodeQuery && food.gtinUpc && String(food.gtinUpc).trim() === searchText.trim()) {
      score += 100000;
      food.isFullMatch = true;
    }

    for (const term of penalties) {
      if (description.indexOf(term) >= 0 && !words.includes(term)) score -= 400;
    }

    score += (food.score || 0) * 0.1;
    food.rankScore = score;
  }

  results.sort((a, b) => {
    if (a.isFullMatch !== b.isFullMatch) return a.isFullMatch ? -1 : 1;
    if (a.matchedWordCount !== b.matchedWordCount) return b.matchedWordCount - a.matchedWordCount;
    return b.rankScore - a.rankScore;
  });

  return results;
}

function simplifyResults(results: any[]) {
  return results.map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    brand: food.brandOwner || "",
    dataType: food.dataType,
    score: Math.round(food.rankScore)
  }));
}

async function searchFoods(searchText: string) {
  const url = "https://api.nal.usda.gov/fdc/v1/foods/search" +
    "?query=" + encodeURIComponent(searchText) +
    "&pageSize=200&api_key=" + USDA_API_KEY;

  const json = await fetchUSDA(url);
  if (!json.foods) return [];

  const ranked = rankFoods(json.foods, searchText);
  return simplifyResults(ranked.slice(0, 15));
}

function getNutrient(food: any, nutrientName: string) {
  if (!food.foodNutrients?.length) return 0;
  const match = food.foodNutrients.find((n: any) => n.nutrient?.name === nutrientName);
  return match ? match.amount : 0;
}

function getEnergyKcal(food: any) {
  if (!food.foodNutrients?.length) return 0;
  const energyEntries = food.foodNutrients.filter((n: any) =>
    n.nutrient?.name?.indexOf("Energy") === 0 && n.nutrient?.unitName?.toLowerCase() === "kcal"
  );
  if (energyEntries.length === 0) return 0;

  const priority = ["Energy", "Energy (Atwater General Factors)", "Energy (Atwater Specific Factors)"];
  for (const p of priority) {
    const match = energyEntries.find((n: any) => n.nutrient.name === p);
    if (match) return match.amount;
  }
  return energyEntries[0].amount;
}

function extractMacros(food: any) {
  return {
    fdcId: food.fdcId,
    description: food.description,
    brand: food.brandOwner || "",
    source: food.dataType,
    servingSize: 100,
    servingUnit: "g",
    calories: getEnergyKcal(food),
    protein: getNutrient(food, "Protein"),
    fat: getNutrient(food, "Total lipid (fat)"),
    carbs: Math.max(0, getNutrient(food, "Carbohydrate, by difference")),
    fiber: getNutrient(food, "Fiber, total dietary")
  };
}

async function getFoodByFdcId(fdcId: number) {
  const url = "https://api.nal.usda.gov/fdc/v1/food/" + fdcId + "?api_key=" + USDA_API_KEY;
  return fetchUSDA(url);
}

// ============================================================
// Request handler
// ============================================================

Deno.serve(async (req) => {

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header.");

    // This client acts AS the calling user (their JWT is forwarded),
    // so RLS applies automatically — same protection as every other
    // table, with zero manual token/userId handling required.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw new Error("Invalid or expired session.");
    const userId = userData.user.id;

    const body = await req.json();

    if (body.action === "search") {

      if (!body.query) throw new Error("query is required.");
      const results = await searchFoods(body.query);
      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    }

    if (body.action === "import") {

      if (!body.fdcId) throw new Error("fdcId is required.");

      const food = await getFoodByFdcId(body.fdcId);
      const macros = extractMacros(food);

      // Duplicate check, scoped to this user (RLS also enforces this,
      // but checking first gives a clean error message instead of a
      // silent insert-then-conflict).
      const { data: existing } = await supabase
        .from("foods")
        .select("id")
        .eq("fdc_id", String(macros.fdcId))
        .maybeSingle();

      if (existing) throw new Error("That food already exists in your Foods database.");

      const netCarbs = Math.max(0, macros.carbs - macros.fiber);

      const { data: inserted, error: insertError } = await supabase
        .from("foods")
        .insert({
          user_id: userId,
          fdc_id: String(macros.fdcId),
          name: macros.description,
          source: macros.source,
          brand: macros.brand,
          serving_size: macros.servingSize,
          serving_unit: macros.servingUnit,
          calories: macros.calories,
          protein: macros.protein,
          fat: macros.fat,
          carbs: macros.carbs,
          fiber: macros.fiber,
          favorite: false,
          active: true
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      return new Response(JSON.stringify({ success: true, data: inserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    }

    throw new Error("Unknown action: " + body.action);

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

});
