-- V13__add_created_at_to_categories.sql
-- Add created_at column to categories table

ALTER TABLE categories ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
