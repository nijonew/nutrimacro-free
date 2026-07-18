# Pending Features & Fixes

Running list — newest additions at the top of each section. Ask me to update this file anytime; I'll keep it current.

## Recently completed (this batch)
- ~~Recipes summary write-location bug~~ — root cause found (summary block never had a header row, so "write after last content" landed at row 2) and fixed with a hard row-5 floor.
- ~~Workout.gs row-position bug~~ — was assuming header-row-1/data-row-2; actual sheets use row-4/row-5 like everything else. Fixed across all functions (full corrected file given).
- ~~Critical apostrophe bug~~ — confirmed and fixed in 5 places: any food/exercise name containing `'` (e.g. "Nick's Granola", "BJ's") silently broke its checkbox/button. Root cause: `JSON.stringify` doesn't escape apostrophes, which broke single-quoted HTML attributes. New `jsStringLiteral()` helper in app.js fixes this everywhere it occurred.
- ~~Background contrast~~ — lightened and increased contrast between text/background.
- ~~"serving" -> "serving(s)"~~ label change.
- ~~"Log All" -> "Log Meal"~~ button text.
- ~~Macro fields default to 0 instead of erroring~~ when left blank, in both Add Food and Edit Food.
- ~~Macro field order~~ now matches nutrition labels: Calories, Fat, Carbs, Fiber, Protein.
- ~~"Pieces" unit added~~ to food creation and to logging/recipe unit dropdowns.
- ~~Native unit recall~~ — adding a food to a meal or recipe now defaults its unit to whatever unit it was created in, instead of always defaulting to grams.
- ~~Nav clutter removed~~ — old per-page Today/gear/Log/Home links are gone now; hamburger menu is the only navigation control.
- ~~Enter key triggers both searches~~ — pressing Enter in the Food search (Log screen and Recipe builder) now also triggers the USDA search, not just the local filter.
- ~~USDA search hidden once something's checked~~ — reduces clutter once you've found what you want.
- ~~Creation shortcuts added~~ — "+ Create a New Food" and "+ Create a New Recipe" now appear directly in the Log screen depending on which tab you're on, no hamburger menu needed.
- ~~USDA search added to the Recipe builder~~ — ingredients can now be found via USDA, not just your existing Foods.
- ~~Amount display rounding~~ — "1/12 serving" no longer displays as 0.08333333333333; rounded to 3 decimal places for display (math/storage unaffected).
- ~~Per-item meal dropdown in the Log screen cart~~ — each item can now be assigned its own meal, so a whole day can be logged in one batch instead of meal-by-meal. The old single Meal selector is now just the default applied to newly added items.

## Answers to your direct questions

- **"How do I favorite a food/meal/recipe, and what does it do?"** Right now: nothing. The Foods sheet has always had a Favorite column, but it was never wired into the app UI or used anywhere (not in search ranking, not in a filter). It's a real gap, not something you're missing — see "Favorites" design item below.
- **"Percentages over 100% on a meal"** — need specifics to debug properly (which food/meal, and the actual calorie/macro numbers) — but the likely explanation: percent-of-calories is computed from grams x the standard 4/4/9 factors, while the "Calories" figure stored for a food is whatever USDA (or a manual entry) reported directly. These two numbers don't always agree — alcohol calories, rounding, and inconsistent source data can all make the macros' calculated calories exceed the logged Calories total, which pushes percentages over 100%. Data-consistency issue more than a formula bug, but send me the specific numbers and I'll confirm.
- **Barcode / nutrition label / recipe text scanning** — real options, roughly in order of effort: (1) USDA's API actually supports searching by UPC/barcode directly — a barcode scan could just feed the scanned number into a modified searchFoods call, cheapest option, no OCR/AI needed. (2) OCR of a nutrition label photo needs a vision-capable service (Google Cloud Vision, or a multimodal AI API) to extract the printed numbers — more setup, ongoing per-scan cost. (3) Parsing recipe text is least deterministic — best done by sending pasted text to an AI API for structured ingredient extraction, then matching against your Foods list. All three are real future projects, not quick additions.
- **Volume-to-weight conversion via density** — still the known shortcoming. Realistic approach: store an optional per-food "grams per cup" value on the Foods sheet, filled in once per food that needs it, and have calculateMacros check for that before falling back to the current weight/volume-category error. Buildable, needs a schema addition + UI.

## Design sketches for what's still pending (not built this round)

- **Dual-unit capture for foods** (e.g., "30g / 5 pieces" both true for the same food) — needs a second optional Serving Size/Unit pair on the Foods sheet, and calculateMacros updated to try either basis.
- **Favorites, wired up for real** — add a Favorite toggle to Edit Food (column already exists, just needs a UI control + updateFood to accept it), then use it to sort favorites to the top of search results in Log/Recipe screens. Same concept extends to Recipes and the future Meals/Favorites feature.
- **Retroactive food/recipe edits** — when a Food or Recipe's macros change, offer to recalculate past logged entries that used it, or leave them as historical record. Needs a clear prompt ("update past logs, or only apply going forward?") and a batch-recalculation function. Applies to both "edit a food" and "edit a recipe after saving" — same underlying mechanism.
- **Recipe editing UI** — no way to view/edit/remove ingredients of an already-saved recipe yet; currently you can only add more.
- **Bulk-importing known grocery items/restaurants** — USDA's Branded Foods dataset already covers most name-brand groceries and major chain restaurants; realistic approach is a "bulk import" tool where you paste/select several USDA search results at once and import them all in one action, rather than one at a time.
- **Recent Foods quick-add** — a short list of recently-logged foods (with last-used amount/unit pre-filled) shown above search, for one-tap re-logging of common items. Needs a new getRecentFoods(userId, limit) backend function.
- **Progress logging + Achievements app screens** — backend exists from the multi-user retrofit, but there's still no app-facing screen for logging daily weight/exercise/sleep, or viewing achievements — still spreadsheet-only.
- **"Meals" (rename from Meal Plans) + Favorite Meals** — the sheet is already renamed to "Meals" with Meal/Food/Amount/User columns; just needs a Unit column added. Rough plan: saveFavoriteMeal/getFavoriteMealNames/getFavoriteMeal/logFavoriteMeal functions, reusing batchLogEntries under the hood. Frontend: "Save as Favorite" after building a meal cart, plus a "My Favorites" quick-add list.

## Bugs to verify are actually fixed
- Recipes write-location and Workout.gs row-position (both fixed this round, but worth confirming against your real sheet once you're back at it).

## Other known gaps (carried over)
- Dashboard beyond today's totals (Journey/weight goals, remaining-macros-vs-target, Achievements panel) still spreadsheet-only.
- No edit/delete for a logged Daily Log or Workout Log entry once saved.
- Username/password/email/reports backend + frontend both built, but still needs the 4 new Users sheet columns added before it works.
- Import Log never got the multi-user retrofit (still 5 columns, stores raw email instead of userId) — low priority, nothing reads it back currently.
- Stray "User" label in Recipes!Q4 with no corresponding code reference — safe to delete once confirmed.
