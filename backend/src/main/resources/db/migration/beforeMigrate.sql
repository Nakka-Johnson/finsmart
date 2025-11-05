-- Flyway callback: beforeMigrate
-- Ensures pgcrypto extension is available for gen_random_uuid()

-- Enable pgcrypto extension if not already enabled
-- This provides the gen_random_uuid() function used in migrations
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
