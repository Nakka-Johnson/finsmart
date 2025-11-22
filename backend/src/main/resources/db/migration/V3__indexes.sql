-- V3__indexes.sql
-- Add indexes for transaction queries to improve performance

-- Index for account-based transaction queries ordered by posted date
-- Used by listTransactions query filtering by account
CREATE INDEX IF NOT EXISTS idx_txn_account_posted ON transactions(account_id, posted_at DESC);

-- Index for category-based transaction queries ordered by posted date
-- Used for category spending analysis and reporting
CREATE INDEX IF NOT EXISTS idx_txn_category_posted ON transactions(category_id, posted_at DESC);

-- Index for direction-based filtering
-- Used for queries filtering by transaction direction (IN/OUT, CREDIT/DEBIT)
CREATE INDEX IF NOT EXISTS idx_txn_direction ON transactions(direction);
