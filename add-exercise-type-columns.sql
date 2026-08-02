-- Lets exercises be categorized as strength / cardio / swim, each
-- with the fields that actually make sense for it, instead of every
-- exercise being forced into a weight+reps shape. Run once in
-- Supabase SQL Editor.

alter table exercises add column if not exists exercise_type text default 'strength';
-- values: 'strength' (weight + reps), 'cardio' (duration + distance), 'swim' (stroke + laps + time)

alter table workout_log add column if not exists duration_minutes numeric;
alter table workout_log add column if not exists distance numeric;
alter table workout_log add column if not exists stroke text;
alter table workout_log add column if not exists laps integer;

-- Existing rows are all strength-type sets from before this change —
-- weight/unit/reps stay exactly as they are, nothing to migrate.
