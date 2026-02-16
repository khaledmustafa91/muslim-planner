CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ramadan_year int NOT NULL,
  day_count int NOT NULL CHECK (day_count IN (29, 30)),
  UNIQUE (user_id, ramadan_year)
);

CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  task_type text NOT NULL DEFAULT 'regular' CHECK (task_type IN ('regular', 'prayer')),
  sort_order int NOT NULL
);

CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  done boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, day_number)
);
