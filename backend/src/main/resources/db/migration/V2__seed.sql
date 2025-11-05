-- V2__seed.sql
-- FinSmart seed data for development

-- Insert demo user
INSERT INTO users (id, email, password_hash, full_name, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@finsmart.dev',
    'X', -- placeholder password hash
    'Demo User',
    CURRENT_TIMESTAMP
);

-- Insert categories
INSERT INTO categories (id, name, color) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Groceries', '#4CAF50'),
    ('10000000-0000-0000-0000-000000000002', 'Transport', '#2196F3'),
    ('10000000-0000-0000-0000-000000000003', 'Rent', '#FF9800'),
    ('10000000-0000-0000-0000-000000000004', 'Utilities', '#9C27B0'),
    ('10000000-0000-0000-0000-000000000005', 'Entertainment', '#E91E63');

-- Insert accounts for demo user
INSERT INTO accounts (id, user_id, name, institution, type, currency, created_at) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Monzo Current',
        'Monzo',
        'CHECKING',
        'GBP',
        CURRENT_TIMESTAMP
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'Amex Credit',
        'American Express',
        'CREDIT',
        'GBP',
        CURRENT_TIMESTAMP
    );

-- Insert transactions (last 60 days)
INSERT INTO transactions (id, account_id, posted_at, amount, direction, description, category_id, merchant, notes, created_at) VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        45.50,
        'DEBIT',
        'Weekly grocery shop',
        '10000000-0000-0000-0000-000000000001',
        'Tesco',
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '8 days',
        12.40,
        'DEBIT',
        'Bus pass top-up',
        '10000000-0000-0000-0000-000000000002',
        'TfL',
        'Monthly pass',
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        850.00,
        'DEBIT',
        'Monthly rent payment',
        '10000000-0000-0000-0000-000000000003',
        'Landlord Ltd',
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        '20000000-0000-0000-0000-000000000002',
        CURRENT_TIMESTAMP - INTERVAL '12 days',
        67.30,
        'DEBIT',
        'Electric bill',
        '10000000-0000-0000-0000-000000000004',
        'British Gas',
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000005',
        '20000000-0000-0000-0000-000000000002',
        CURRENT_TIMESTAMP - INTERVAL '15 days',
        29.99,
        'DEBIT',
        'Netflix subscription',
        '10000000-0000-0000-0000-000000000005',
        'Netflix',
        'Monthly subscription',
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000006',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '18 days',
        32.75,
        'DEBIT',
        'Grocery shopping',
        '10000000-0000-0000-0000-000000000001',
        'Sainsburys',
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000007',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '20 days',
        15.60,
        'DEBIT',
        'Tube journey',
        '10000000-0000-0000-0000-000000000002',
        'TfL',
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000008',
        '20000000-0000-0000-0000-000000000002',
        CURRENT_TIMESTAMP - INTERVAL '25 days',
        42.00,
        'DEBIT',
        'Cinema tickets',
        '10000000-0000-0000-0000-000000000005',
        'Odeon',
        'Date night',
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000009',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '28 days',
        28.50,
        'DEBIT',
        'Lunch groceries',
        '10000000-0000-0000-0000-000000000001',
        'Marks & Spencer',
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        '30000000-0000-0000-0000-000000000010',
        '20000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        2500.00,
        'CREDIT',
        'Monthly salary',
        NULL,
        'Employer Corp',
        'November salary',
        CURRENT_TIMESTAMP
    );

-- Insert budgets for current month
INSERT INTO budgets (id, user_id, category_id, month, year, limit_amount) VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        200.00
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        100.00
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000005',
        EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        150.00
    );
