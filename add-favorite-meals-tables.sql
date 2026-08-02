-- Favorite Meals: save a combination of foods/recipes (with amounts)
-- as a named meal, so it can be re-logged in one action later.
-- Mirrors the recipes / recipe_ingredients pattern. Run once in
-- Supabase SQL Editor.

create table favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamptz default now()
);

create table favorite_meal_items (
  id uuid primary key default gen_random_uuid(),
  favorite_meal_id uuid references favorite_meals(id) on delete cascade not null,
  food_id uuid references foods(id),
  recipe_id uuid references recipes(id),
  amount numeric not null,
  unit text not null
);

create index idx_favorite_meal_items_meal on favorite_meal_items (favorite_meal_id);

alter table favorite_meals enable row level security;
create policy "Users manage their own favorite meals" on favorite_meals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table favorite_meal_items enable row level security;
create policy "Users manage their own favorite meal items" on favorite_meal_items for all
  using (favorite_meal_id in (select id from favorite_meals where user_id = auth.uid()))
  with check (favorite_meal_id in (select id from favorite_meals where user_id = auth.uid()));
