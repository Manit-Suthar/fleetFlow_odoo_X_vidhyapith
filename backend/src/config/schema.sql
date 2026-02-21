-- =============================================
-- FleetFlow Database Schema
-- Run: psql fleetflow < src/config/schema.sql
-- =============================================

-- ────────────────────────────────────────────
-- PAGES 1-2 (Manit): Auth + Dashboard
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) DEFAULT 'viewer',  -- admin, manager, driver, viewer
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────
-- PAGES 3-4 (Fenil): Vehicles + Trips
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
    id              SERIAL PRIMARY KEY,
    vehicle_name    VARCHAR(100) NOT NULL,
    vehicle_type    VARCHAR(50),           -- truck, van, car, bus
    license_plate   VARCHAR(20) UNIQUE NOT NULL,
    model           VARCHAR(100),
    year            INTEGER,
    status          VARCHAR(20) DEFAULT 'available',  -- available, in-trip, maintenance
    fuel_type       VARCHAR(20),           -- petrol, diesel, electric, cng
    mileage         DECIMAL(10,2) DEFAULT 0,
    insurance_expiry DATE,
    last_service     DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id              SERIAL PRIMARY KEY,
    vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id       INTEGER,               -- will reference drivers(id) once that table exists
    origin          VARCHAR(200) NOT NULL,
    destination     VARCHAR(200) NOT NULL,
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    distance_km     DECIMAL(10,2),
    fuel_used       DECIMAL(10,2),
    status          VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, in-progress, completed, cancelled
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────
-- PAGES 5-6 (Vatsal): Drivers + Finance
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drivers (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    license_number  VARCHAR(50) UNIQUE NOT NULL,
    license_expiry  DATE,
    status          VARCHAR(20) DEFAULT 'available',  -- available, on-trip, off-duty
    rating          DECIMAL(3,2) DEFAULT 5.00,
    total_trips     INTEGER DEFAULT 0,
    joined_date     DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add FK from trips to drivers now that drivers table exists
ALTER TABLE trips
    ADD CONSTRAINT fk_trips_driver
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    trip_id         INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    tax             DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending',  -- pending, paid, overdue, cancelled
    due_date        DATE,
    paid_date       DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id              SERIAL PRIMARY KEY,
    vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    category        VARCHAR(50),           -- fuel, maintenance, insurance, toll, other
    amount          DECIMAL(12,2) NOT NULL,
    description     TEXT,
    expense_date    DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────
-- PAGES 7-8 (Manasvi): Reports + Settings
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id              SERIAL PRIMARY KEY,
    vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type    VARCHAR(100),          -- oil change, tire replacement, brake check, etc.
    description     TEXT,
    cost            DECIMAL(12,2),
    service_date    DATE DEFAULT CURRENT_DATE,
    next_service    DATE,
    performed_by    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    type            VARCHAR(30),           -- alert, reminder, info
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_key     VARCHAR(100) NOT NULL,
    setting_value   TEXT,
    UNIQUE(user_id, setting_key)
);

-- =============================================
-- SEED DATA (optional, for testing)
-- =============================================

INSERT INTO users (name, email, password_hash, role) VALUES
    ('Manit', 'manit@fleetflow.com', '$placeholder$', 'admin'),
    ('Fenil', 'fenil@fleetflow.com', '$placeholder$', 'manager'),
    ('Vatsal', 'vatsal@fleetflow.com', '$placeholder$', 'manager'),
    ('Manasvi', 'manasvi@fleetflow.com', '$placeholder$', 'viewer')
ON CONFLICT (email) DO NOTHING;
