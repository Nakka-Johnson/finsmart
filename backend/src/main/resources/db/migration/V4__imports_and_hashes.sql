-- V4: Import tracking and transaction deduplication
-- Adds import batch/row tables and hash-based duplicate detection

-- Import batch tracking
CREATE TABLE import_batch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(64) NOT NULL,
    filename VARCHAR(255),
    row_count INT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL CHECK (status IN ('PREVIEW', 'COMMITTED', 'FAILED', 'UNDONE')),
    notes TEXT
);

CREATE INDEX idx_import_batch_user_id ON import_batch(user_id);
CREATE INDEX idx_import_batch_created_at ON import_batch(created_at DESC);
CREATE INDEX idx_import_batch_status ON import_batch(status);

-- Import row details
CREATE TABLE import_row (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
    row_no INT NOT NULL,
    raw JSONB NOT NULL,
    normalized JSONB,
    error TEXT,
    suggested_category UUID REFERENCES categories(id) ON DELETE SET NULL,
    duplicate_of UUID REFERENCES transactions(id) ON DELETE SET NULL,
    CONSTRAINT uq_batch_row UNIQUE (batch_id, row_no)
);

CREATE INDEX idx_import_row_batch_id ON import_row(batch_id);
CREATE INDEX idx_import_row_duplicate_of ON import_row(duplicate_of) WHERE duplicate_of IS NOT NULL;

-- Add hash column to transactions for duplicate detection
-- SHA256 hash of (date, amount, direction, merchant, description, account_id)
ALTER TABLE transactions ADD COLUMN hash CHAR(64);

CREATE INDEX idx_transactions_hash ON transactions(hash) WHERE hash IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN transactions.hash IS 'SHA256 hash for duplicate detection: sha256(date||amount||direction||merchant||description||account_id)';
COMMENT ON TABLE import_batch IS 'Tracks CSV import batches with status for undo capability';
COMMENT ON TABLE import_row IS 'Individual rows from import batches with validation and deduplication info';
