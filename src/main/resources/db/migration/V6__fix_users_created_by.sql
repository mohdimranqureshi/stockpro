-- V6: Fix all missing columns for existing databases
-- Covers columns added to entities but missing from original V1 schema

-- Fix 1: users table missing created_by
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_by BIGINT;

-- Fix 2: replacements table missing given_challan_number and company block
ALTER TABLE replacements
    ADD COLUMN IF NOT EXISTS given_challan_number   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS company_item_name      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS company_serial_number  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS company_challan_number VARCHAR(100);
