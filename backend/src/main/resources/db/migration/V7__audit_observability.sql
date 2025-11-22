-- V7: Audit observability and user feature flags
-- Adds audit logging and per-user feature flag overrides

-- Create audit_event table if not exists
CREATE TABLE IF NOT EXISTS audit_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    method VARCHAR(10) NOT NULL,
    path VARCHAR(512) NOT NULL,
    status INT NOT NULL,
    ip VARCHAR(45),
    ua TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_ms INT,
    request_id VARCHAR(64),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_event_created_at ON audit_event(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_user_email ON audit_event(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_event_status ON audit_event(status);
CREATE INDEX IF NOT EXISTS idx_audit_event_path ON audit_event(path);

COMMENT ON TABLE audit_event IS 'HTTP request audit log for security and observability';
COMMENT ON COLUMN audit_event.duration_ms IS 'Request duration in milliseconds';
COMMENT ON COLUMN audit_event.request_id IS 'Unique request identifier for tracing';

-- User-specific feature flag overrides
CREATE TABLE user_feature_flags (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(64) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    PRIMARY KEY (user_id, key)
);

CREATE INDEX idx_user_feature_flags_user_id ON user_feature_flags(user_id);
CREATE INDEX idx_user_feature_flags_key ON user_feature_flags(key);

COMMENT ON TABLE user_feature_flags IS 'Per-user feature flag overrides for gradual rollouts and A/B testing';
COMMENT ON COLUMN user_feature_flags.key IS 'Feature flag key matching APP_FEATURE_* environment variables';
