ALTER TABLE plans ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS location_country text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS calculation_method int DEFAULT 2; -- Default to ISNA/Muslim World League
