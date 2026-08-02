-- Reclassifies your already-seeded scale goals to compute dynamically
-- from Settings' Starting Weight / Height, instead of a hardcoded
-- number. Run once, AFTER add-weight-formula-column.sql.
--
-- Historical facts (old license weight, lowest-ever tracked weight,
-- pre-Covid cruise weight, mission weight) are intentionally left as
-- 'absolute' — they're records of what happened, not goals relative
-- to your current starting point, so they shouldn't move.

-- Offset-from-starting-weight goals (trigger_value becomes "lbs to lose")
update achievements set weight_formula = 'offset_from_start', trigger_value = 10  where label = 'Lose first 10' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 20  where label = 'Lose first 20' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 25  where label = '150 to go' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 25  where label = 'Down 25!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 30  where label = 'Down 30!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 40  where label = 'Down 40!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 50  where label = 'First major goal - 125 to go!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 50  where label = 'DOWN 50!!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 51  where label = 'Under 300' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 75  where label = 'Only 100 to go!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 75  where label = 'Down 75!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 90  where label = 'Down 90' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 100 where label = 'Under 250 - 75 to go' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 100 where label = 'DOWN 100!!!!!!!!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 125 where label = 'Only 50 to go' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 125 where label = 'Down 125!!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 150 where label = 'Longtime goal to be under 200!! - only 25 to go' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 160 where label = 'DOWN 150!!!' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'offset_from_start', trigger_value = 175 where label = 'ULTIMATE GOAL' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';

-- Percent-of-starting-weight-lost goals (trigger_value becomes the percent)
update achievements set weight_formula = 'percent_of_start_lost', trigger_value = 10 where label = '10% loss' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'percent_of_start_lost', trigger_value = 20 where label = '20% loss' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'percent_of_start_lost', trigger_value = 30 where label = '30% loss' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'percent_of_start_lost', trigger_value = 40 where label = '40% loss' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'percent_of_start_lost', trigger_value = 50 where label = 'Bonus - down 50%' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';

-- BMI-based goals (trigger_value becomes the target BMI; computed using Settings' Height)
update achievements set weight_formula = 'bmi', trigger_value = 40 where label = 'BMI 40 - OC2' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'bmi', trigger_value = 35 where label = 'BMI 35 - OC1' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'bmi', trigger_value = 30 where label = 'BMI 30 - Overweight' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';
update achievements set weight_formula = 'bmi', trigger_value = 25 where label = 'BMI 25 - Normal Weight' and user_id = '5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5';

-- Everything else (New/Old drivers license weight, pre-Covid cruise weight,
-- lowest-ever tracked weights, mission weight) stays 'absolute' — no
-- update needed, that's already the default.
