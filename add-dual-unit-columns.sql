-- Adds optional second serving basis to foods, e.g. a food listed as
-- both "30g" and "5 pieces" — lets you log in whichever unit is handy.
-- Run once in Supabase SQL Editor.

alter table foods add column if not exists alt_serving_size numeric;
alter table foods add column if not exists alt_serving_unit text;
