ALTER TABLE plans ALTER COLUMN calculation_method SET DEFAULT 5;
UPDATE plans SET calculation_method = 5 WHERE calculation_method IS NULL OR calculation_method = 2;
