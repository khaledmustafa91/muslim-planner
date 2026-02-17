ALTER TABLE task_schedules ADD COLUMN IF NOT EXISTS duration_minutes int NOT NULL DEFAULT 30;
