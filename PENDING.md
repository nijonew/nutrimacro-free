# Pending Features & Fixes

Running list — newest additions at the top of each section. Ask me to update this file anytime; I'll keep it current.

## Recently completed
- ~~Dark navy/royal blue color scheme with white text~~
- ~~Hamburger menu moved to top-right~~
- ~~Responsive hardening~~
- ~~Username/password Sign In + Sign Up, Forgot Access recovery, Reports screen~~ — full backend + frontend now built. **Requires the 4 new Users sheet columns to exist first**: `Username | Password Hash | Password Salt | Email`.
- ~~Existing token-only accounts (like yours) can now set up username/password/email~~ via a new "Sign-in credentials" section in Settings — bridges old accounts into the new login method without losing access.
- ~~Found and removed a real bug~~: `sw.js` still listed `signup.html`/`profile.html` (stray files from before I consolidated sign-up into index.html) in its cached file list — if those don't exist on GitHub, `cache.addAll()` fails silently and can break the whole service worker. Removed.

## Design sketch: "Meals" (rename from Meal Plans) + Favorite Meals

- **Rename**: any UI/sheet references to "Meal Plans" become "Meals." The existing (currently unused) Meal Plans sheet can likely be repurposed for this rather than building a new one.
- **What it actually does**: NOT meal planning/scheduling — just letting a person save a named combination of Food/Recipe items + amounts as a reusable "favorite," then log the whole thing in one tap on any day.
- **Closest existing analog**: this is essentially the same shape as Workout Templates (name + list of items), or like `repeatMeal` but sourced from a saved template instead of a past logged day.
- **Rough plan**: a `saveFavoriteMeal(name, items, userId)` function (items = array of {type, name, amount, unit}), a `getFavoriteMealNames(userId)`/`getFavoriteMeal(name, userId)` pair, and a `logFavoriteMeal(name, date, meal, userId)` action that batch-logs all its items — basically reusing `batchLogEntries` under the hood. Frontend: a "Save as Favorite" option after building a meal in the cart on Log Food, plus a "My Favorites" list to quick-add from.

## Bugs to fix
- **Recipe summary writing to the wrong cell** (F2 instead of expected G5). Still needs your current actual Recipes sheet header row to fix against reality.
- **User column position audit across every sheet** — you moved it on Recipes; want it confirmed last-column everywhere, and code double-checked against actual current layout on every tab, not just Recipes.

## Other feature requests
*(none currently — main asks above are in progress)*

## Coming up
- You plan to upload a fresh Excel export of the current spreadsheet so we can jointly audit sheet architecture — confirm current column layouts everywhere, identify anything obsolete, and fix the Recipe write-location bug and User-column position against reality instead of guessing.

## Known gaps (carried over from earlier)
- Dashboard beyond today's totals (Journey/weight goals, remaining-macros-vs-target, Achievements panel) still lives only in the single-user spreadsheet Dashboard tab.
- No edit/delete for a logged Daily Log or Workout Log entry once saved — flagged as a top priority, not yet built.
- "Mission flour tortillas" USDA search still weak even after ranking fix — deferred by your choice.
- "Last time" reference on the workout screen only shows the single most recent session, not a multi-session trend.

