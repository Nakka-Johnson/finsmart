-- V5: Budget rollover and envelope budgeting
-- Adds rollover capability to budgets and envelope allocation system

-- Add rollover columns to budgets
ALTER TABLE budgets ADD COLUMN rollover BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE budgets ADD COLUMN carry_in NUMERIC(14,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN budgets.rollover IS 'If true, unused budget carries over to next month';
COMMENT ON COLUMN budgets.carry_in IS 'Amount carried over from previous month';

-- Envelope budgeting system
CREATE TABLE envelope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    limit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_envelope_user_name UNIQUE (user_id, name)
);

CREATE INDEX idx_envelope_user_id ON envelope(user_id);

COMMENT ON TABLE envelope IS 'Envelope budgeting containers for users';

-- Envelope money movements
CREATE TABLE envelope_move (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    from_envelope UUID REFERENCES envelope(id) ON DELETE SET NULL,
    to_envelope UUID REFERENCES envelope(id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT chk_envelope_move_different CHECK (from_envelope IS DISTINCT FROM to_envelope)
);

CREATE INDEX idx_envelope_move_user_id ON envelope_move(user_id);
CREATE INDEX idx_envelope_move_period ON envelope_move(year, month);
CREATE INDEX idx_envelope_move_from ON envelope_move(from_envelope);
CREATE INDEX idx_envelope_move_to ON envelope_move(to_envelope);

COMMENT ON TABLE envelope_move IS 'Tracks money movements between envelopes for budget reallocation';
