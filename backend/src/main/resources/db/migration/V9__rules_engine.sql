-- V9: Rules engine for automatic categorization
-- Pattern-based rules for merchant/description matching

CREATE TABLE rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern VARCHAR(128) NOT NULL,
    field VARCHAR(32) NOT NULL CHECK (field IN ('merchant', 'description', 'both')),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_rule_user_id ON rule(user_id);
CREATE INDEX idx_rule_active_priority ON rule(user_id, active, priority) WHERE active = true;
CREATE INDEX idx_rule_category_id ON rule(category_id);

COMMENT ON TABLE rule IS 'User-defined rules for automatic transaction categorization';
COMMENT ON COLUMN rule.pattern IS 'Pattern to match (case-insensitive substring or regex)';
COMMENT ON COLUMN rule.field IS 'Which transaction field to match against';
COMMENT ON COLUMN rule.priority IS 'Rule priority - lower number = higher priority (1-1000)';

-- Rule execution log (optional - for debugging and analytics)
CREATE TABLE rule_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES rule(id) ON DELETE CASCADE,
    txn_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    matched BOOLEAN NOT NULL,
    applied BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rule_execution_log_rule_id ON rule_execution_log(rule_id);
CREATE INDEX idx_rule_execution_log_txn_id ON rule_execution_log(txn_id);
CREATE INDEX idx_rule_execution_log_created_at ON rule_execution_log(created_at DESC);

COMMENT ON TABLE rule_execution_log IS 'Audit log of rule executions for analytics and debugging';
