-- Initial database schema for Access Management API
-- Creates tables for users, accesses, and their many-to-many relationship

-- Users Table
-- Stores user accounts with hashed passwords
CREATE SEQUENCE IF NOT EXISTS users_id_seq START 1;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY DEFAULT nextval('users_id_seq'),
    username VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (username)
);

-- Accesses Table
-- Catalog of available accesses that can be granted to users
CREATE SEQUENCE IF NOT EXISTS accesses_id_seq START 1;

CREATE TABLE IF NOT EXISTS accesses (
    id INTEGER PRIMARY KEY DEFAULT nextval('accesses_id_seq'),
    name VARCHAR NOT NULL,
    description VARCHAR,
    renewal_period INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);

-- User-Access Junction Table
-- Many-to-many relationship: users can have multiple accesses, accesses can be assigned to multiple users
-- Note: DuckDB doesn't support CASCADE in FOREIGN KEY, so cleanup must be handled manually
CREATE TABLE IF NOT EXISTS user_accesses (
    user_id INTEGER NOT NULL,
    access_id INTEGER NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, access_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (access_id) REFERENCES accesses(id)
);

-- Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_user_accesses_access_id ON user_accesses(access_id);
CREATE INDEX IF NOT EXISTS idx_user_accesses_assigned_at ON user_accesses(assigned_at);
