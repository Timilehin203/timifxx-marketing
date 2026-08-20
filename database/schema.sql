/*
|--------------------------------------------------------------------------
| TIMIFXX MARKETING DATABASE
|--------------------------------------------------------------------------
|
| PostgreSQL database schema
|
| This file creates the complete Stage 1 database foundation.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| EXTENSIONS
|--------------------------------------------------------------------------
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;


/*
|--------------------------------------------------------------------------
| UPDATED_AT TRIGGER FUNCTION
|--------------------------------------------------------------------------
*/

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


/*
|--------------------------------------------------------------------------
| ADMINS
|--------------------------------------------------------------------------
|
| Stores administrator accounts.
|
| Passwords must NEVER be stored as plain text.
| password_hash will contain a secure password hash.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS admins (

    id BIGSERIAL PRIMARY KEY,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


/*
|--------------------------------------------------------------------------
| SERVICES
|--------------------------------------------------------------------------
|
| The 10 public Telegram marketing services.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS services (

    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    slug VARCHAR(160) NOT NULL UNIQUE,

    description TEXT NOT NULL,

    price NUMERIC(12, 2) NOT NULL,

    price_type VARCHAR(30) NOT NULL DEFAULT 'fixed',

    turnaround_text VARCHAR(150),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT services_price_check
        CHECK (price >= 0),

    CONSTRAINT services_price_type_check
        CHECK (
            price_type IN (
                'fixed',
                'starting_from'
            )
        )

);


/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
|
| Customer orders.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS orders (

    id BIGSERIAL PRIMARY KEY,

    order_number VARCHAR(20) NOT NULL UNIQUE,

    service_id BIGINT NOT NULL,

    customer_name VARCHAR(100) NOT NULL,

    customer_email VARCHAR(254) NOT NULL,

    telegram_username VARCHAR(64),

    whatsapp VARCHAR(32),

    message TEXT,

    price NUMERIC(12, 2) NOT NULL,

    status VARCHAR(40) NOT NULL DEFAULT 'pending',

    admin_note TEXT,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT orders_service_fk
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT orders_price_check
        CHECK (price >= 0),

    CONSTRAINT orders_status_check
        CHECK (
            status IN (
                'pending',
                'paid',
                'in_progress',
                'waiting_customer',
                'completed',
                'cancelled',
                'declined'
            )
        )

);


/*
|--------------------------------------------------------------------------
| ORDER STATUS HISTORY
|--------------------------------------------------------------------------
|
| Keeps a record of status changes for each order.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS order_status_history (

    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL,

    old_status VARCHAR(40),

    new_status VARCHAR(40) NOT NULL,

    note TEXT,

    changed_by BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT order_status_history_order_fk
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT order_status_history_admin_fk
        FOREIGN KEY (changed_by)
        REFERENCES admins(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL

);


/*
|--------------------------------------------------------------------------
| MESSAGES
|--------------------------------------------------------------------------
|
| Stores customer/admin communication related to orders.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS messages (

    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT,

    sender_type VARCHAR(30) NOT NULL,

    sender_name VARCHAR(100),

    sender_email VARCHAR(254),

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT messages_order_fk
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT messages_sender_type_check
        CHECK (
            sender_type IN (
                'customer',
                'admin',
                'system'
            )
        )

);


/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
|
| General website/application settings.
|
|--------------------------------------------------------------------------
*/

CREATE TABLE IF NOT EXISTS settings (

    id BIGSERIAL PRIMARY KEY,

    setting_key VARCHAR(150) NOT NULL UNIQUE,

    setting_value TEXT,

    description TEXT,

    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);


/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

/* Services */

CREATE INDEX IF NOT EXISTS idx_services_active_sort
ON services (
    is_active,
    sort_order
);


/* Orders */

CREATE INDEX IF NOT EXISTS idx_orders_service
ON orders (
    service_id
);


CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders (
    status
);


CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders (
    created_at DESC
);


CREATE INDEX IF NOT EXISTS idx_orders_customer_email
ON orders (
    customer_email
);


/* Order status history */

CREATE INDEX IF NOT EXISTS idx_order_status_history_order
ON order_status_history (
    order_id,
    created_at DESC
);


/* Messages */

CREATE INDEX IF NOT EXISTS idx_messages_order
ON messages (
    order_id,
    created_at DESC
);


CREATE INDEX IF NOT EXISTS idx_messages_unread
ON messages (
    is_read,
    created_at DESC
);


/* Settings */

CREATE INDEX IF NOT EXISTS idx_settings_public
ON settings (
    is_public
);


/*
|--------------------------------------------------------------------------
| UPDATED_AT TRIGGERS
|--------------------------------------------------------------------------
*/

DROP TRIGGER IF EXISTS admins_updated_at
ON admins;

CREATE TRIGGER admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS services_updated_at
ON services;

CREATE TRIGGER services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS orders_updated_at
ON orders;

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


DROP TRIGGER IF EXISTS settings_updated_at
ON settings;

CREATE TRIGGER settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


/*
|--------------------------------------------------------------------------
| SERVICE SEED DATA
|--------------------------------------------------------------------------
|
| These are the final Stage 1 prices.
|
|--------------------------------------------------------------------------
*/

INSERT INTO services (
    name,
    slug,
    description,
    price,
    price_type,
    turnaround_text,
    sort_order
)

VALUES

(
    'Already Approved Channel',
    'already-approved-channel',
    'Assistance for customers who already have an approved Telegram channel.',
    150.00,
    'fixed',
    '3–5 days',
    1
),

(
    'Already Approved Bot',
    'already-approved-bot',
    'Assistance for customers who already have an approved Telegram bot.',
    70.00,
    'fixed',
    '3–5 days',
    2
),

(
    'Already Approved MiniApp',
    'already-approved-miniapp',
    'Assistance for customers who already have an approved Telegram Mini App.',
    90.00,
    'fixed',
    '3–5 days',
    3
),

(
    'Approval Assistance',
    'approval-assistance',
    'Telegram advertising approval assistance for eligible destinations and campaigns.',
    40.00,
    'fixed',
    '3–5 days',
    4
),

(
    'Ad Setup',
    'ad-setup',
    'Professional setup assistance for Telegram advertising campaigns.',
    50.00,
    'fixed',
    '1–3 days',
    5
),

(
    'Ad Copy Creation',
    'ad-copy-creation',
    'Creation of concise advertising copy for Telegram campaigns.',
    25.00,
    'fixed',
    '1–2 days',
    6
),

(
    'Campaign Management',
    'campaign-management',
    'Ongoing Telegram advertising campaign management and optimization.',
    200.00,
    'starting_from',
    'Based on campaign scope',
    7
),

(
    'Declined Review',
    'declined-review',
    'Review of declined Telegram advertising campaigns and available next steps.',
    25.00,
    'fixed',
    '1–2 days',
    8
),

(
    'Destination Compliance',
    'destination-compliance',
    'Review assistance for Telegram advertising destination compliance.',
    40.00,
    'fixed',
    '1–2 days',
    9
),

(
    'Campaign Audit',
    'campaign-audit',
    'Review and audit of Telegram advertising campaign setup and configuration.',
    50.00,
    'fixed',
    '1–2 days',
    10
)

ON CONFLICT (
    slug
)

DO UPDATE SET

    name = EXCLUDED.name,

    description = EXCLUDED.description,

    price = EXCLUDED.price,

    price_type = EXCLUDED.price_type,

    turnaround_text = EXCLUDED.turnaround_text,

    sort_order = EXCLUDED.sort_order,

    updated_at = NOW();


/*
|--------------------------------------------------------------------------
| PUBLIC SETTINGS SEED DATA
|--------------------------------------------------------------------------
*/

INSERT INTO settings (
    setting_key,
    setting_value,
    description,
    is_public
)

VALUES

(
    'business_name',
    'TimiFxx Marketing',
    'Public business name.',
    TRUE
),

(
    'telegram_username',
    '@timifxx203',
    'Official Telegram contact username.',
    TRUE
),

(
    'currency',
    'USD',
    'Website currency.',
    TRUE
),

(
    'order_prefix',
    'TMF',
    'Prefix used for public order numbers.',
    FALSE
),

(
    'maintenance_mode',
    'false',
    'Controls whether the website is in maintenance mode.',
    TRUE
)

ON CONFLICT (
    setting_key
)

DO UPDATE SET

    setting_value = EXCLUDED.setting_value,

    description = EXCLUDED.description,

    is_public = EXCLUDED.is_public,

    updated_at = NOW();


/*
|--------------------------------------------------------------------------
| COMPLETE
|--------------------------------------------------------------------------
*/

SELECT
    'TimiFxx Marketing database schema ready.' AS message;
