-- Adds support for period-based achievements (weekly/monthly averages,
-- totals, and "N times in a period" counts) alongside the existing
-- one-time weight_target and metric_trigger types.

alter table achievements add column if not exists period_days integer;
alter table achievements add column if not exists required_count integer;
