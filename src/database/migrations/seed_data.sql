-- Seed data for Access Management API
-- Creates sample accesses and an admin user for development/testing

-- Sample Accesses
-- These represent common system permissions that can be granted to users
INSERT INTO accesses (name, description, renewal_period) VALUES
    ('READ_DOCUMENTS', 'View and download company documents', 90),
    ('WRITE_DOCUMENTS', 'Create and edit company documents', 90),
    ('DELETE_DOCUMENTS', 'Delete company documents (requires manager approval)', 30),
    ('ADMIN_PANEL', 'Access to administrative dashboard and controls', NULL),
    ('USER_MANAGEMENT', 'Create, update, and delete user accounts', NULL),
    ('APPROVE_INVOICES', 'Approve pending invoices up to $10,000', 60),
    ('VIEW_REPORTS', 'Access financial and operational reports', 180),
    ('EDIT_SETTINGS', 'Modify system configuration and settings', NULL),
    ('MANAGE_ACCESSES', 'Grant and revoke accesses to other users', NULL),
    ('API_ACCESS', 'Access to REST API endpoints', 365)
ON CONFLICT (name) DO NOTHING;

-- Sample Admin User
-- Username: admin
-- Password: admin123 (bcrypt hashed with cost factor 12)
-- This is the default admin account for initial setup
INSERT INTO users (username, password_hash) VALUES
    ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K0JW9Nx1gQya')
ON CONFLICT (username) DO NOTHING;

-- Grant all accesses to admin user
-- Admin has full permissions to manage the system
INSERT INTO user_accesses (user_id, access_id)
SELECT 
    (SELECT id FROM users WHERE username = 'admin'),
    id
FROM accesses
ON CONFLICT (user_id, access_id) DO NOTHING;
