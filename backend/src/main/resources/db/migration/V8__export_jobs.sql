-- V8: Export jobs tracking
-- Tracks file export jobs for CSV, XLSX, PDF reports

CREATE TABLE export_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT CHECK (year BETWEEN 2000 AND 2100),
    type VARCHAR(32) NOT NULL CHECK (type IN ('CSV', 'XLSX', 'PDF', 'JSON')),
    status VARCHAR(16) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    file_path VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    file_size_bytes BIGINT,
    parameters JSONB
);

CREATE INDEX idx_export_job_user_id ON export_job(user_id);
CREATE INDEX idx_export_job_created_at ON export_job(created_at DESC);
CREATE INDEX idx_export_job_status ON export_job(status);
CREATE INDEX idx_export_job_period ON export_job(year, month) WHERE month IS NOT NULL;

COMMENT ON TABLE export_job IS 'Tracks export job execution for async file generation';
COMMENT ON COLUMN export_job.parameters IS 'Additional export parameters (accountId, filters, etc.)';
COMMENT ON COLUMN export_job.file_path IS 'Relative path to generated file or S3 key';

-- Anomaly status tracking (for insights anomaly detection)
CREATE TABLE anomaly_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    txn_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'SNOOZED', 'IGNORED')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_anomaly_user_txn UNIQUE (user_id, txn_id)
);

CREATE INDEX idx_anomaly_status_user_id ON anomaly_status(user_id);
CREATE INDEX idx_anomaly_status_txn_id ON anomaly_status(txn_id);
CREATE INDEX idx_anomaly_status_status ON anomaly_status(status);

COMMENT ON TABLE anomaly_status IS 'User feedback on detected spending anomalies for ML training';
