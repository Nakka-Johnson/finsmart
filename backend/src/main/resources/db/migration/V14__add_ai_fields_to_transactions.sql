-- V14__add_ai_fields_to_transactions.sql
-- Add AI-enhanced fields to transactions table

ALTER TABLE transactions ADD COLUMN normalized_merchant VARCHAR(255);
ALTER TABLE transactions ADD COLUMN merchant_confidence NUMERIC(5, 4);
ALTER TABLE transactions ADD COLUMN category_confidence NUMERIC(5, 4);
ALTER TABLE transactions ADD COLUMN anomaly_score NUMERIC(5, 4);
