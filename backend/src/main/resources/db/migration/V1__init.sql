-- V1__init.sql
-- FinSmart database schema initialization

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON users(email);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL,
    CONSTRAINT uk_category_name UNIQUE (name)
);

CREATE INDEX idx_categories_name ON categories(name);

-- Create accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    type VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_account_type CHECK (type IN ('CHECKING', 'SAVINGS', 'CREDIT'))
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    posted_at TIMESTAMP NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    description VARCHAR(512),
    category_id UUID,
    merchant VARCHAR(255),
    notes VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_transaction_amount CHECK (amount >= 0),
    CONSTRAINT chk_transaction_direction CHECK (direction IN ('DEBIT', 'CREDIT'))
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_posted_at ON transactions(posted_at);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

-- Create budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    limit_amount NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_budget_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT uk_budget_user_category_month_year UNIQUE (user_id, category_id, month, year),
    CONSTRAINT chk_budget_month CHECK (month >= 1 AND month <= 12),
    CONSTRAINT chk_budget_year CHECK (year >= 2000),
    CONSTRAINT chk_budget_limit_amount CHECK (limit_amount >= 0)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);
