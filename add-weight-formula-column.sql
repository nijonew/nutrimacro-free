-- Lets weight-based achievements compute their target dynamically
-- instead of storing a hardcoded absolute number. Run once in
-- Supabase SQL Editor, before the UPDATE script that follows it.
--
-- weight_formula values and what trigger_value means for each:
--   'absolute'              trigger_value IS the target weight (fixed historical facts)
--   'offset_from_start'     trigger_value = lbs to subtract from Settings' Starting Weight
--   'percent_of_start_lost' trigger_value = percent of Starting Weight lost (e.g. 10 = 10%)
--   'bmi'                   trigger_value = target BMI, computed using Settings' Height

alter table achievements add column if not exists weight_formula text default 'absolute';
