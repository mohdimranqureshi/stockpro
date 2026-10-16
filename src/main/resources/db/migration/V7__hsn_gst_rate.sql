-- V7: HSN -> GST rate table (data loaded from HSN_SAC.csv by V8)
CREATE TABLE IF NOT EXISTS hsn_gst_rate (
    id          BIGSERIAL PRIMARY KEY,
    hsn_code    VARCHAR(20)   NOT NULL,
    description TEXT          NOT NULL,
    gst_rate    NUMERIC(5,2)  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hsn_gst_rate_code ON hsn_gst_rate (hsn_code);
