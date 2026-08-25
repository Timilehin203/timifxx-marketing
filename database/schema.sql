-- ============================================================
-- TIMI FXX MARKETING - DATABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SERVICES TABLE
-- ============================================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_type VARCHAR(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'starting_from')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(200) NOT NULL,
    telegram_username VARCHAR(100) NOT NULL,
    whatsapp_number VARCHAR(50),
    details TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ADMINS TABLE
-- ============================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_services_active ON services(is_active);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED SERVICES
-- ============================================================
INSERT INTO services (name, description, price, price_type) VALUES
('Already Approved Channel', 'Get a pre-approved Telegram channel ready for your advertising campaign', 150, 'fixed'),
('Already Approved Bot', 'Get a pre-approved Telegram bot ready for your advertising campaign', 70, 'fixed'),
('Already Approved MiniApp', 'Get a pre-approved Telegram MiniApp ready for your advertising campaign', 90, 'fixed'),
('Telegram Ads Approval Assistance', 'Professional assistance to get your Telegram ads approved quickly', 40, 'fixed'),
('Telegram Ad Setup', 'Complete setup of your Telegram advertising campaign', 50, 'fixed'),
('Telegram Ad Copy Creation', 'Professional ad copywriting for your Telegram campaigns', 30, 'fixed'),
('Telegram Ads Campaign Management', 'Full campaign management from start to finish', 200, 'starting_from'),
('Telegram Ad Declined Review', 'Expert review and appeal for declined Telegram ads', 25, 'fixed'),
('Telegram Destination Compliance Check', 'Ensure your destination URL meets Telegram compliance standards', 40, 'fixed'),
('Telegram Ads Campaign Audit', 'Comprehensive audit of your Telegram advertising campaigns', 50, 'fixed'),
('Telegram Fragment Verification', 'Secure fragment verification service for Telegram accounts', 30, 'fixed');

-- ============================================================
-- SEED ADMIN (Default: admin@timifxx.com / password: Admin123!)
-- ============================================================
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO admins (email, password_hash) VALUES (
    'admin@timifxx.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
);

-- ============================================================
-- VALIDATION
-- ============================================================
DO $$
BEGIN
    -- Check services count
    IF (SELECT COUNT(*) FROM services) < 10 THEN
        RAISE EXCEPTION 'Not all services were seeded correctly';
    END IF;
    
    -- Check admin
    IF (SELECT COUNT(*) FROM admins) = 0 THEN
        RAISE EXCEPTION 'Admin account was not created';
    END IF;
END $$;
