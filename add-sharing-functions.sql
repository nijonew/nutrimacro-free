-- Adds opt-in sharing for manually-created foods and recipes, using
-- a "copy on import" model rather than live-shared rows — each person
-- who imports a shared item gets their own independent copy. This
-- avoids a real correctness risk: virtually everything in this app
-- looks foods/recipes up BY NAME, which only works because each
-- person's own names are unique to them. If two people could both
-- see one live shared pool, nothing would stop both of you from
-- having a food named "Chicken Breast" — and any lookup expecting
-- exactly one match would start throwing errors.
--
-- Deliberately, this does NOT change the existing RLS policies on
-- foods/recipes at all — every existing page's lookups are completely
-- unaffected by this migration. Instead, three narrow SECURITY DEFINER
-- functions expose *only* shared rows belonging to OTHER users, for
-- the specific purpose of browsing and copying them.
--
-- Run once in Supabase SQL Editor.

alter table foods add column if not exists is_shared boolean default false;
alter table recipes add column if not exists is_shared boolean default false;

-- Returns shared foods created by OTHER users (not your own), for
-- browsing. Runs with elevated privilege internally, but only ever
-- returns rows that are explicitly marked shared.
create or replace function get_shared_foods()
returns table (
  id uuid, name text, brand text, serving_size numeric, serving_unit text,
  alt_serving_size numeric, alt_serving_unit text,
  calories numeric, protein numeric, fat numeric, carbs numeric, fiber numeric
)
language sql
security definer
set search_path = public
as $$
  select id, name, brand, serving_size, serving_unit, alt_serving_size, alt_serving_unit,
         calories, protein, fat, carbs, fiber
  from foods
  where is_shared = true and user_id != auth.uid()
  order by name;
$$;

-- Same idea for recipes — just the list (name + servings), not ingredients.
create or replace function get_shared_recipes()
returns table (id uuid, name text, servings numeric)
language sql
security definer
set search_path = public
as $$
  select id, name, servings
  from recipes
  where is_shared = true and user_id != auth.uid()
  order by name;
$$;

-- Returns a shared recipe's full ingredient list, WITH each ingredient
-- food's macro data embedded directly — so importing doesn't require
-- the ingredient foods to also be independently shared/visible to you.
create or replace function get_shared_recipe_details(recipe_id_param uuid)
returns table (
  servings numeric, ingredient_name text, ingredient_brand text,
  amount numeric, unit text,
  serving_size numeric, serving_unit text, alt_serving_size numeric, alt_serving_unit text,
  calories numeric, protein numeric, fat numeric, carbs numeric, fiber numeric
)
language sql
security definer
set search_path = public
as $$
  select r.servings, f.name, f.brand, ri.amount, ri.unit,
         f.serving_size, f.serving_unit, f.alt_serving_size, f.alt_serving_unit,
         f.calories, f.protein, f.fat, f.carbs, f.fiber
  from recipes r
  join recipe_ingredients ri on ri.recipe_id = r.id
  join foods f on f.id = ri.food_id
  where r.id = recipe_id_param and r.is_shared = true;
$$;
