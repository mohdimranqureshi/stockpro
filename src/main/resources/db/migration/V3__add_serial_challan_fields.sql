-- V3: Add serial_number and challan_number to stock inventory
--     Add company_item block to replacements (item received from company)

ALTER TABLE stock
    ADD COLUMN IF NOT EXISTS serial_number   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS challan_number  VARCHAR(100);

ALTER TABLE replacements
    ADD COLUMN IF NOT EXISTS company_item_name      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS company_serial_number  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS company_challan_number VARCHAR(100);
