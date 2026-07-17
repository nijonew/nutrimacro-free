# Pending Features & Fixes

Running list — newest additions at the top of each section. Ask me to update this file anytime; I'll keep it current.

## Recently completed
- ~~Dark navy/royal blue color scheme with white text~~ — done, all colors flow through CSS variables in style.css so this was a single-block swap.
- ~~Hamburger menu moved to top-right~~ — done, now groups with any existing gear/back link instead of the title.
- ~~Responsive hardening~~ — done: long titles/names now truncate or wrap instead of overlapping; app intentionally stays a fixed mobile-width column even on desktop/tablet, which is what actually prevents cross-size layout collisions.
- Username/password login, email collection, account recovery, PDF report emailing — backend code delivered (Auth.gs, Reports.gs, Api.gs additions). **Frontend (Sign In/Sign Up forms, Reports screen) still not built** — see below.

## Design sketch: "Meals" (rename from Meal Plans) + Favorite Meals

- **Rename**: any UI/sheet references to "Meal Plans" become "Meals." The existing (currently unused) Meal Plans sheet can likely be repurposed for this rather than building a new one.
- **What it actually does**: NOT meal planning/scheduling — just letting a person save a named combination of Food/Recipe items + amounts as a reusable "favorite," then log the whole thing in one tap on any day.
- **Closest existing analog**: this is essentially the same shape as Workout Templates (name + list of items), or like `repeatMeal` but sourced from a saved template instead of a past logged day.
- **Rough plan**: a `saveFavoriteMeal(name, items, userId)` function (items = array of {type, name, amount, unit}), a `getFavoriteMealNames(userId)`/`getFavoriteMeal(name, userId)` pair, and a `logFavoriteMeal(name, date, meal, userId)` action that batch-logs all its items — basically reusing `batchLogEntries` under the hood. Frontend: a "Save as Favorite" option after building a meal in the cart on Log Food, plus a "My Favorites" list to quick-add from.

## Still not built (backend done, frontend pending)
- **Sign In / Sign Up screens for username + password + email** (backend `loginWithPassword`/`createAccount`/`recoverAccount` ready, `index.html` still only has the token-based flow).
- **Forgot access flow** (calls `recoverAccount`, backend ready).
- **Reports screen** (date range + nutrition/workout/both picker, calls `sendReport`, backend ready).
- Requires manually adding 4 new columns to the Users sheet first: `Username | Password Hash | Password Salt | Email`.

## Bugs to fix
- **Recipe summary writing to the wrong cell** (F2 instead of expected G5). Still needs your current actual Recipes sheet header row to fix against reality.
- **User column position audit across every sheet** — you moved it on Recipes; want it confirmed last-column everywhere, and code double-checked against actual current layout on every tab, not just Recipes.

## Other feature requests
*(none currently — main asks above are in progress)*

## Known gaps (carried over from earlier)
- Dashboard beyond today's totals (Journey/weight goals, remaining-macros-vs-target, Achievements panel) still lives only in the single-user spreadsheet Dashboard tab.
- No edit/delete for a logged Daily Log or Workout Log entry once saved — flagged as a top priority, not yet built.
- "Mission flour tortillas" USDA search still weak even after ranking fix — deferred by your choice.
- "Last time" reference on the workout screen only shows the single most recent session, not a multi-session trend.

