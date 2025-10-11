-- Initialize TRADEAI v2.0 database
-- This script runs when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;

-- Set default permissions
GRANT ALL PRIVILEGES ON DATABASE tradeai_v2 TO tradeai;
GRANT ALL PRIVILEGES ON SCHEMA public TO tradeai;

-- Create initial admin user (will be handled by application)
-- Tables will be created by SQLAlchemy/Alembic