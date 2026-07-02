-- StockPro Demo Seed Data V2
-- Generic sample data - works for any business type

INSERT INTO stock (item_name, sku, rate, category, brand, status, unit, quantity, purchase_date, supplier)
SELECT 'Samsung 65" QLED Smart TV', 'SKU-TV-001', 82000, 'Electronics', 'Samsung', 'AVAILABLE', 'PCS', 1, '2026-04-10', 'Samsung India'
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE sku = 'SKU-TV-001');

INSERT INTO stock (item_name, sku, rate, category, brand, status, unit, quantity, purchase_date, supplier)
SELECT 'Sony WH-1000XM5 Headphones', 'SKU-AUD-002', 29000, 'Audio', 'Sony', 'AVAILABLE', 'PCS', 1, '2026-04-15', 'Sony India'
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE sku = 'SKU-AUD-002');

INSERT INTO stock (item_name, sku, rate, category, brand, status, unit, quantity, purchase_date, supplier)
SELECT 'LG 1.5 Ton Inverter AC', 'SKU-AC-003', 45000, 'Appliances', 'LG', 'SOLD', 'PCS', 1, '2026-04-20', 'LG Electronics'
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE sku = 'SKU-AC-003');

INSERT INTO stock (item_name, sku, rate, category, brand, status, unit, quantity, purchase_date, supplier)
SELECT 'Bosch 7kg Front Load Washer', 'SKU-WM-004', 38000, 'Appliances', 'Bosch', 'AVAILABLE', 'PCS', 1, '2026-05-01', 'Bosch India'
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE sku = 'SKU-WM-004');

INSERT INTO stock (item_name, sku, rate, category, brand, status, unit, quantity, purchase_date, supplier)
SELECT 'Apple MacBook Air M2', 'SKU-LAP-005', 114000, 'Computers', 'Apple', 'AVAILABLE', 'PCS', 1, '2026-05-10', 'iStore India'
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE sku = 'SKU-LAP-005');

INSERT INTO stock (item_name, sku, rate, category, brand, status, unit, quantity, purchase_date, supplier)
SELECT 'Canon EOS R50 Camera Kit', 'SKU-CAM-006', 67000, 'Photography', 'Canon', 'AVAILABLE', 'PCS', 1, '2026-05-20', 'Canon India'
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE sku = 'SKU-CAM-006');

-- Sample transactions
INSERT INTO transactions (type, item_name, sku, party_name, party_phone, amount, discount, tax_amount, final_amount, transaction_date, invoice_no, payment_mode)
SELECT 'PURCHASE', 'Samsung 65" QLED Smart TV', 'SKU-TV-001', 'Samsung India', '1800407267', 68000, 0, 0, 68000, '2026-04-10', 'PO-001', 'BANK_TRANSFER'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE invoice_no = 'PO-001');

INSERT INTO transactions (type, item_name, sku, party_name, party_phone, amount, discount, tax_amount, final_amount, transaction_date, invoice_no, payment_mode)
SELECT 'PURCHASE', 'Sony WH-1000XM5 Headphones', 'SKU-AUD-002', 'Sony India', '1800108111', 22000, 0, 0, 22000, '2026-04-15', 'PO-002', 'BANK_TRANSFER'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE invoice_no = 'PO-002');

INSERT INTO transactions (type, item_name, sku, party_name, party_phone, amount, discount, tax_amount, final_amount, transaction_date, invoice_no, payment_mode)
SELECT 'SALE', 'LG 1.5 Ton Inverter AC', 'SKU-AC-003', 'Rahul Sharma', '9876543210', 48000, 3000, 0, 45000, '2026-06-01', 'INV-001', 'CASH'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE invoice_no = 'INV-001');

INSERT INTO transactions (type, item_name, sku, party_name, party_phone, amount, discount, tax_amount, final_amount, transaction_date, invoice_no, payment_mode)
SELECT 'SALE', 'Samsung 65" QLED Smart TV', 'SKU-TV-001', 'Priya Singh', '9812345678', 82000, 2000, 0, 80000, '2026-06-05', 'INV-002', 'UPI'
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE invoice_no = 'INV-002');

-- Sample payments
INSERT INTO payments (flow_type, amount, payment_date, party_name, payment_mode, reference_no, category)
SELECT 'OUTFLOW', 68000, '2026-04-10', 'Samsung India', 'BANK_TRANSFER', 'PO-001', 'PRODUCT'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE reference_no = 'PO-001');

INSERT INTO payments (flow_type, amount, payment_date, party_name, payment_mode, reference_no, category)
SELECT 'OUTFLOW', 22000, '2026-04-15', 'Sony India', 'BANK_TRANSFER', 'PO-002', 'PRODUCT'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE reference_no = 'PO-002');

INSERT INTO payments (flow_type, amount, payment_date, party_name, payment_mode, reference_no, category)
SELECT 'INFLOW', 45000, '2026-06-01', 'Rahul Sharma', 'CASH', 'INV-001', 'PRODUCT'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE reference_no = 'INV-001');

INSERT INTO payments (flow_type, amount, payment_date, party_name, payment_mode, reference_no, category)
SELECT 'INFLOW', 80000, '2026-06-05', 'Priya Singh', 'UPI', 'INV-002', 'PRODUCT'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE reference_no = 'INV-002');

-- Sample replacement
INSERT INTO replacements (customer_name, customer_phone, given_item_name, given_sku, given_value, received_item_name, received_sku, received_value, difference_amount, replacement_date)
SELECT 'Amit Verma', '9876543210', 'LG 32" LED TV (Old)', 'OLD-001', 8000, 'Samsung 43" Smart TV', 'SKU-TV-EX1', 35000, 27000, '2026-05-28'
WHERE NOT EXISTS (SELECT 1 FROM replacements WHERE customer_name = 'Amit Verma' AND replacement_date = '2026-05-28');

-- Sample scrap
INSERT INTO scrap (item_name, sku, barcode, estimated_value, status, scrap_date, source)
SELECT 'LG 32" CRT Television (2015)', 'SCR-001', 'BAR123456', 1500, 'TAGGED_FOR_SALE', '2026-06-05', 'Trade-in'
WHERE NOT EXISTS (SELECT 1 FROM scrap WHERE sku = 'SCR-001');
