CREATE TABLE IF NOT EXISTS task_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  scheduled_time text NOT NULL, -- Format: HH:mm
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_task_schedules_day ON task_schedules(day_number);
CREATE INDEX IF NOT EXISTS idx_task_schedules_task_id ON task_schedules(task_id);
