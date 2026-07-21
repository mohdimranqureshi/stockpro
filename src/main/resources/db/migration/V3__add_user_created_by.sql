-- Add creator tracking to users without modifying the already-applied V1 migration.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_by BIGINT;
