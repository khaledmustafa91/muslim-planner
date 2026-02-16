-- Add indices for JOIN performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_year ON plans(user_id, ramadan_year);
CREATE INDEX IF NOT EXISTS idx_sections_plan_id ON sections(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section_id ON tasks(section_id);
CREATE INDEX IF NOT EXISTS idx_checkins_task_id ON checkins(task_id);
CREATE INDEX IF NOT EXISTS idx_checkins_task_day ON checkins(task_id, day_number);
