-- Add balance column to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0.00;
