-- V6: Merchant spending materialized view
-- Aggregates merchant spending by user and month for insights

CREATE MATERIALIZED VIEW user_merchant_monthly AS
SELECT 
    a.user_id,
    COALESCE(t.merchant, 'Unknown') AS merchant,
    TO_CHAR(t.posted_at, 'YYYY-MM') AS yyyy_mm,
    SUM(CASE WHEN t.direction = 'DEBIT' THEN t.amount ELSE 0 END) AS debit_total,
    COUNT(*) AS txn_count
FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE t.merchant IS NOT NULL OR t.description IS NOT NULL
GROUP BY a.user_id, COALESCE(t.merchant, 'Unknown'), TO_CHAR(t.posted_at, 'YYYY-MM');

CREATE UNIQUE INDEX idx_user_merchant_monthly_pk ON user_merchant_monthly(user_id, merchant, yyyy_mm);
CREATE INDEX idx_user_merchant_monthly_period ON user_merchant_monthly(yyyy_mm);
CREATE INDEX idx_user_merchant_monthly_amount ON user_merchant_monthly(debit_total DESC);

COMMENT ON MATERIALIZED VIEW user_merchant_monthly IS 'Monthly merchant spending aggregation for insights and trends';

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_merchant_monthly_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_merchant_monthly;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: Materialized view refresh should be done periodically via scheduled job
-- or manually when needed. Trigger-based refresh is too expensive for high-volume systems.
-- Recommended: Schedule REFRESH MATERIALIZED VIEW CONCURRENTLY user_merchant_monthly every hour/day.

COMMENT ON FUNCTION refresh_merchant_monthly_view IS 'Helper function to refresh merchant monthly view - call from scheduled job';
