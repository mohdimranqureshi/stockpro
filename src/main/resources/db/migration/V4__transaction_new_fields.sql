-- V4: Add new fields to transactions table

-- Invoice number sequence (auto-increment starting from 1)
CREATE SEQUENCE IF NOT EXISTS invoice_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS serial_number  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS hsn_code       VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gst_rate       NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scrap_type     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS scrap_weight   NUMERIC(10,3) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scrap_rate     NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scrap_deduction NUMERIC(12,2) DEFAULT 0;

-- Backfill existing invoice numbers with sequence values if blank
UPDATE transactions
SET invoice_no = 'INV-' || LPAD(CAST(NEXTVAL('invoice_seq') AS TEXT), 6, '0')
WHERE invoice_no IS NULL OR invoice_no = '';

-- Set sequence to next value after existing max invoice number
SELECT SETVAL('invoice_seq',
    COALESCE(MAX(CAST(REGEXP_REPLACE(invoice_no, '[^0-9]', '', 'g') AS BIGINT)), 0) + 1, false)
FROM transactions
WHERE invoice_no ~ '^INV-[0-9]+$';
