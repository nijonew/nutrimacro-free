-- Bulk-seeds the full achievement list. Run once in Supabase SQL Editor,
-- AFTER running add-achievement-columns.sql.
--
-- Weight-target rows are auto-checked against Settings' Current Weight
-- the next time you load achievements.html — so anything you've already
-- hit (per your checklist) will show as earned (dated the day you load
-- the page, since exact historical dates weren't tracked in the old
-- system either).

insert into achievements (user_id, label, category, trigger_type, trigger_field, trigger_operator, trigger_value, period_days, required_count) values

-- ===== Scale Goals =====
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Lose first 10', 'Scale Goal', 'weight_target', 'weight', '<=', 340, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Lose first 20', 'Scale Goal', 'weight_target', 'weight', '<=', 330, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', '150 to go', 'Scale Goal', 'weight_target', 'weight', '<=', 325, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Down 25!', 'Scale Goal', 'weight_target', 'weight', '<=', 325, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'New drivers license weight', 'Scale Goal', 'weight_target', 'weight', '<=', 320, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Down 30!', 'Scale Goal', 'weight_target', 'weight', '<=', 320, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', '10% loss', 'Scale Goal', 'weight_target', 'weight', '<=', 315, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Down 40!', 'Scale Goal', 'weight_target', 'weight', '<=', 310, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Old drivers license weight', 'Scale Goal', 'weight_target', 'weight', '<=', 305, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'First major goal - 125 to go!', 'Scale Goal', 'weight_target', 'weight', '<=', 300, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'DOWN 50!!', 'Scale Goal', 'weight_target', 'weight', '<=', 300, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under 300', 'Scale Goal', 'weight_target', 'weight', '<=', 299, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Pre-Covid cruise weight', 'Scale Goal', 'weight_target', 'weight', '<=', 299, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Lowest in My Fitness Pal (Jan 2013)', 'Scale Goal', 'weight_target', 'weight', '<=', 282, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', '20% loss', 'Scale Goal', 'weight_target', 'weight', '<=', 280, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Only 100 to go!', 'Scale Goal', 'weight_target', 'weight', '<=', 275, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Lowest in LoseIt (Feb 2013)', 'Scale Goal', 'weight_target', 'weight', '<=', 272, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Down 75!', 'Scale Goal', 'weight_target', 'weight', '<=', 275, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'BMI 40 - OC2', 'Scale Goal', 'weight_target', 'weight', '<=', 271, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Down 90', 'Scale Goal', 'weight_target', 'weight', '<=', 260, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under 250 - 75 to go', 'Scale Goal', 'weight_target', 'weight', '<=', 250, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'DOWN 100!!!!!!!!', 'Scale Goal', 'weight_target', 'weight', '<=', 250, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', '30% loss', 'Scale Goal', 'weight_target', 'weight', '<=', 245, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'BMI 35 - OC1', 'Scale Goal', 'weight_target', 'weight', '<=', 237, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Only 50 to go', 'Scale Goal', 'weight_target', 'weight', '<=', 225, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Down 125!!', 'Scale Goal', 'weight_target', 'weight', '<=', 225, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Lowest weight I remember from my mission', 'Scale Goal', 'weight_target', 'weight', '<=', 220, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', '40% loss', 'Scale Goal', 'weight_target', 'weight', '<=', 210, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'BMI 30 - Overweight', 'Scale Goal', 'weight_target', 'weight', '<=', 203, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Longtime goal to be under 200!! - only 25 to go', 'Scale Goal', 'weight_target', 'weight', '<=', 200, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'DOWN 150!!!', 'Scale Goal', 'weight_target', 'weight', '<=', 190, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'ULTIMATE GOAL', 'Scale Goal', 'weight_target', 'weight', '<=', 175, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Bonus - down 50%', 'Scale Goal', 'weight_target', 'weight', '<=', 175, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'BMI 25 - Normal Weight', 'Scale Goal', 'weight_target', 'weight', '<=', 169, null, null),

-- ===== Non-Scale: Walking/Distance =====
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Go on a walk', 'Non-Scale', 'metric_trigger', 'distance', '>', 0, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Walk 1 mile', 'Non-Scale', 'metric_trigger', 'distance', '>=', 1, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Go on 2 walks in a week', 'Non-Scale', 'metric_count', 'distance', '>', 0, 7, 2),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Go on 4 walks in a week', 'Non-Scale', 'metric_count', 'distance', '>', 0, 7, 4),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Walk 5 miles in a week', 'Non-Scale', 'metric_sum', 'distance', '>=', 5, 7, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Walk 8 miles in a week', 'Non-Scale', 'metric_sum', 'distance', '>=', 8, 7, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Run a mile', 'Non-Scale', 'metric_trigger', 'distance', '>=', 1, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Run a 5K', 'Non-Scale', 'metric_trigger', 'distance', '>=', 3.1, null, null),

-- ===== Non-Scale: Steps =====
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 5000 steps per day in a week', 'Non-Scale', 'metric_average', 'steps', '>=', 5000, 7, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 6000 steps per day in a week', 'Non-Scale', 'metric_average', 'steps', '>=', 6000, 7, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 8000 steps per day in a week', 'Non-Scale', 'metric_average', 'steps', '>=', 8000, 7, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 10000 steps per day in a week', 'Non-Scale', 'metric_average', 'steps', '>=', 10000, 7, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 5000 steps per day in a month', 'Non-Scale', 'metric_average', 'steps', '>=', 5000, 30, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 6000 steps per day in a month', 'Non-Scale', 'metric_average', 'steps', '>=', 6000, 30, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 8000 steps per day in a month', 'Non-Scale', 'metric_average', 'steps', '>=', 8000, 30, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Average 10000 steps per day in a month', 'Non-Scale', 'metric_average', 'steps', '>=', 10000, 30, null),

-- ===== Non-Scale: Gym =====
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Go to the gym', 'Non-Scale', 'metric_trigger', 'gym', '==', 1, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Go to the gym 3 times in a week', 'Non-Scale', 'metric_count', 'gym', '==', 1, 7, 3),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Go to the gym 5 times in a week', 'Non-Scale', 'metric_count', 'gym', '==', 1, 7, 5),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', '2 consecutive weeks with at least three times in a gym', 'Non-Scale', 'manual', null, null, null, null, null),

-- ===== Non-Scale: Milestones & clothing (manual — not trackable from logged data) =====
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'First person who notices without already knowing I am trying', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Be able to wear wedding ring', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Out of 4X shirts', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Out of 3X shirts', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Out of 2X shirts', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under size 48 in pants', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under size 46 in pants', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under size 44 in pants', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under size 42 in pants', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Under size 40 in pants', 'Non-Scale', 'manual', null, null, null, null, null),
('5e71d68f-0ead-46f4-bd20-e5eb51a8b8c5', 'Need a new suit', 'Non-Scale', 'manual', null, null, null, null, null);
