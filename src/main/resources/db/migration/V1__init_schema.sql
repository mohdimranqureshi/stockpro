-- StockPro Database Schema V1
-- Generic Inventory & Business Management System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS & AUTH
-- ─────────────────────────────────────────
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN','MANAGER','STAFF')),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by  BIGINT
);

CREATE INDEX idx_users_email ON users(email);

-- ─────────────────────────────────────────
-- STOCK / INVENTORY
-- ─────────────────────────────────────────
CREATE TABLE stock (
    id            BIGSERIAL PRIMARY KEY,
    item_name     VARCHAR(200) NOT NULL,
    sku           VARCHAR(100) NOT NULL UNIQUE,
    rate          NUMERIC(12,2) NOT NULL CHECK (rate >= 0),
    category      VARCHAR(100),
    brand         VARCHAR(100),
    status        VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
                      CHECK (status IN ('AVAILABLE','SOLD','IN_REPAIR','SCRAPPED','REPLACED')),
    barcode       VARCHAR(100),
    unit          VARCHAR(30)  DEFAULT 'PCS',
    quantity      INT          NOT NULL DEFAULT 1,
    hsn_code      VARCHAR(20),
    purchase_date DATE,
    supplier      VARCHAR(150),
    location      VARCHAR(100),
    notes         TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by    BIGINT REFERENCES users(id)
);

CREATE INDEX idx_stock_status   ON stock(status);
CREATE INDEX idx_stock_sku      ON stock(sku);
CREATE INDEX idx_stock_name     ON stock(item_name);
CREATE INDEX idx_stock_category ON stock(category);

-- ─────────────────────────────────────────
-- TRANSACTIONS (Sales & Purchases)
-- ─────────────────────────────────────────
CREATE TABLE transactions (
    id               BIGSERIAL PRIMARY KEY,
    type             VARCHAR(10) NOT NULL CHECK (type IN ('SALE','PURCHASE')),
    stock_id         BIGINT REFERENCES stock(id),
    item_name        VARCHAR(200) NOT NULL,
    sku              VARCHAR(100),
    party_name       VARCHAR(150) NOT NULL,
    party_phone      VARCHAR(15),
    party_gstin      VARCHAR(20),
    amount           NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    discount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_amount     NUMERIC(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    invoice_no       VARCHAR(50) UNIQUE,
    payment_mode     VARCHAR(20) DEFAULT 'CASH' CHECK (payment_mode IN ('CASH','UPI','BANK_TRANSFER','CHEQUE','EMI','CARD')),
    notes            TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by       BIGINT REFERENCES users(id)
);

CREATE INDEX idx_transactions_type    ON transactions(type);
CREATE INDEX idx_transactions_date    ON transactions(transaction_date);
CREATE INDEX idx_transactions_party   ON transactions(party_name);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_no);

-- ─────────────────────────────────────────
-- PAYMENTS (Cash Inflow / Outflow)
-- ─────────────────────────────────────────
CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    flow_type       VARCHAR(10) NOT NULL CHECK (flow_type IN ('INFLOW','OUTFLOW')),
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date    DATE NOT NULL,
    party_name      VARCHAR(150) NOT NULL,
    payment_mode    VARCHAR(20) NOT NULL CHECK (payment_mode IN ('CASH','UPI','BANK_TRANSFER','CHEQUE','EMI','CARD')),
    reference_no    VARCHAR(100),
    transaction_id  BIGINT REFERENCES transactions(id),
    category        VARCHAR(50) DEFAULT 'PRODUCT',
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_payments_flow ON payments(flow_type);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_mode ON payments(payment_mode);

-- ─────────────────────────────────────────
-- REPLACEMENTS / EXCHANGES
-- ─────────────────────────────────────────
CREATE TABLE replacements (
    id                   BIGSERIAL PRIMARY KEY,
    customer_name        VARCHAR(150) NOT NULL,
    customer_phone       VARCHAR(15),
    given_stock_id       BIGINT REFERENCES stock(id),
    given_item_name      VARCHAR(200) NOT NULL,
    given_sku            VARCHAR(100),
    given_value          NUMERIC(12,2) DEFAULT 0,
    received_item_name   VARCHAR(200) NOT NULL,
    received_sku         VARCHAR(100),
    received_value       NUMERIC(12,2) DEFAULT 0,
    difference_amount    NUMERIC(12,2) DEFAULT 0,
    replacement_date     DATE NOT NULL,
    notes                TEXT,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by           BIGINT REFERENCES users(id)
);

CREATE INDEX idx_replacements_date     ON replacements(replacement_date);
CREATE INDEX idx_replacements_customer ON replacements(customer_name);

-- ─────────────────────────────────────────
-- SCRAP / DEAD STOCK
-- ─────────────────────────────────────────
CREATE TABLE scrap (
    id              BIGSERIAL PRIMARY KEY,
    item_name       VARCHAR(200) NOT NULL,
    sku             VARCHAR(100),
    barcode         VARCHAR(100),
    estimated_value NUMERIC(12,2) DEFAULT 0,
    sold_value      NUMERIC(12,2),
    status          VARCHAR(25) NOT NULL DEFAULT 'TAGGED_FOR_SALE'
                        CHECK (status IN ('TAGGED_FOR_SALE','SOLD','PENDING_EVALUATION','DISMANTLED')),
    scrap_date      DATE NOT NULL,
    source          VARCHAR(100),
    buyer_name      VARCHAR(150),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      BIGINT REFERENCES users(id)
);

CREATE INDEX idx_scrap_status ON scrap(status);
CREATE INDEX idx_scrap_date   ON scrap(scrap_date);

-- ─────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────
CREATE TABLE audit_logs (
    id           BIGSERIAL PRIMARY KEY,
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    BIGINT,
    action       VARCHAR(20) NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
    old_values   JSONB,
    new_values   JSONB,
    performed_by BIGINT REFERENCES users(id),
    performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address   VARCHAR(45)
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time   ON audit_logs(performed_at);

-- ─────────────────────────────────────────
-- SEED DEFAULT ADMIN USER
-- password = Admin@123 (BCrypt)
-- ─────────────────────────────────────────
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@stockpro.com', '$2a$12$LQv3c1yqBWVHxkd0LQ1Ns.pHHBzJDn1O6c9YvP2R0MZ8mLsXw4Rma', 'ADMIN');
