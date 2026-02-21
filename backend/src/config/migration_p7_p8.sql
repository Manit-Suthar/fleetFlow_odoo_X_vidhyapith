-- =============================================
-- FleetFlow Migration: Pages 7-8
-- Run: psql -U postgres -d fleetflow -f backend/src/config/migration_p7_p8.sql
-- =============================================

-- Add missing columns to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;

-- Driver Issues table
CREATE TABLE IF NOT EXISTS driver_issues (
    id              SERIAL PRIMARY KEY,
    driver_id       INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    trip_id         INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    issue_type      VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL,
    occurred_at     TIMESTAMP NOT NULL,
    location        VARCHAR(200),
    description     TEXT NOT NULL,
    attachment_url  VARCHAR(500),
    status          VARCHAR(30) DEFAULT 'open',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
    id              SERIAL PRIMARY KEY,
    vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    liters          DECIMAL(10,2) NOT NULL,
    cost            DECIMAL(12,2) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Logs table
CREATE TABLE IF NOT EXISTS service_logs (
    id              SERIAL PRIMARY KEY,
    vehicle_id      INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    service_type    VARCHAR(100) NOT NULL,
    cost            DECIMAL(12,2) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SEED DATA
-- =============================================

-- Seed vehicles (if not already present)
INSERT INTO vehicles (vehicle_name, vehicle_type, license_plate, model, year, status, fuel_type, mileage)
VALUES
    ('Tata Ace', 'truck', 'GJ-01-AB-1234', 'Ace Gold', 2022, 'available', 'diesel', 45000),
    ('Mahindra Bolero', 'van', 'GJ-05-CD-5678', 'Bolero Pickup', 2021, 'in-trip', 'diesel', 62000),
    ('Ashok Leyland', 'truck', 'GJ-03-EF-9012', 'Ecomet 1015', 2023, 'available', 'diesel', 28000),
    ('Eicher Pro', 'truck', 'GJ-07-GH-3456', 'Pro 2049', 2020, 'maintenance', 'diesel', 95000),
    ('Tata 407', 'truck', 'GJ-02-IJ-7890', '407 Gold', 2022, 'available', 'diesel', 51000)
ON CONFLICT (license_plate) DO NOTHING;

-- Seed drivers
INSERT INTO drivers (name, phone, license_number, license_expiry, status, rating, total_trips)
VALUES
    ('Rajesh Kumar',    '9876543210', 'DL-0420110012345', '2026-08-15', 'available', 4.80, 142),
    ('Amit Sharma',     '9876543211', 'GJ-0520120023456', '2026-03-01', 'on-trip',   4.50, 98),
    ('Vikram Singh',    '9876543212', 'MH-0120130034567', '2025-12-20', 'available', 3.90, 67),
    ('Suresh Patel',    '9876543213', 'RJ-1420140045678', '2027-01-10', 'available', 4.95, 210),
    ('Deepak Verma',    '9876543214', 'GJ-0320150056789', '2026-06-30', 'off-duty',  4.20, 55),
    ('Manoj Yadav',     '9876543215', 'DL-0720160067890', '2026-11-15', 'available', 4.70, 120),
    ('Kiran Joshi',     '9876543216', 'GJ-0120170078901', 'on-trip',    'on-trip',   4.10, 85),
    ('Pradeep Meena',   '9876543217', 'MP-0920180089012', '2027-05-20', 'available', 4.60, 175)
ON CONFLICT (license_number) DO NOTHING;

-- Fix Kiran Joshi license_expiry (was set incorrectly above)
UPDATE drivers SET license_expiry = '2026-04-10' WHERE license_number = 'GJ-0120170078901';

-- Seed trips
INSERT INTO trips (vehicle_id, driver_id, origin, destination, start_date, end_date, distance_km, fuel_used, status, estimated_cost, is_late)
VALUES
    (1, 1, 'Ahmedabad', 'Surat', '2026-01-05 08:00', '2026-01-05 14:00', 265, 22.5, 'completed', 8500, false),
    (2, 2, 'Vadodara', 'Mumbai', '2026-01-08 06:00', '2026-01-08 18:00', 400, 35.0, 'completed', 12000, true),
    (1, 1, 'Surat', 'Rajkot', '2026-01-12 07:00', '2026-01-12 16:00', 450, 38.0, 'completed', 14000, false),
    (3, 4, 'Ahmedabad', 'Jaipur', '2026-01-15 05:00', '2026-01-16 10:00', 680, 55.0, 'completed', 22000, false),
    (2, 2, 'Mumbai', 'Pune', '2026-01-18 09:00', '2026-01-18 14:00', 150, 12.0, 'completed', 5000, false),
    (1, 3, 'Ahmedabad', 'Bhuj', '2026-01-20 06:00', '2026-01-20 15:00', 330, 28.0, 'completed', 10500, true),
    (4, 6, 'Rajkot', 'Ahmedabad', '2026-01-22 08:00', '2026-01-22 13:00', 220, 18.0, 'completed', 7000, false),
    (5, 8, 'Surat', 'Ahmedabad', '2026-01-25 07:00', '2026-01-25 12:00', 265, 22.0, 'completed', 8500, false),
    (3, 4, 'Jaipur', 'Delhi', '2026-01-28 06:00', '2026-01-28 14:00', 280, 23.0, 'completed', 9000, false),
    (1, 1, 'Ahmedabad', 'Udaipur', '2026-02-01 07:00', '2026-02-01 15:00', 260, 21.0, 'completed', 8200, false),
    (2, 5, 'Vadodara', 'Surat', '2026-02-03 09:00', '2026-02-03 13:00', 160, 13.0, 'completed', 5200, true),
    (5, 8, 'Ahmedabad', 'Gandhinagar', '2026-02-05 10:00', '2026-02-05 11:30', 30, 2.5, 'completed', 1500, false),
    (3, 4, 'Delhi', 'Agra', '2026-02-08 08:00', '2026-02-08 12:00', 230, 19.0, 'completed', 7500, false),
    (1, 6, 'Ahmedabad', 'Baroda', '2026-02-10 07:00', '2026-02-10 10:00', 110, 9.0, 'completed', 3500, false),
    (2, 2, 'Pune', 'Nashik', '2026-02-12 06:00', '2026-02-12 11:00', 210, 17.0, 'completed', 6800, false),
    (4, 7, 'Ahmedabad', 'Surat', '2026-02-14 08:00', NULL, 265, NULL, 'in-progress', 8500, false),
    (5, 1, 'Rajkot', 'Junagadh', '2026-02-16 09:00', NULL, 100, NULL, 'scheduled', 3200, false)
ON CONFLICT DO NOTHING;

-- Seed driver issues
INSERT INTO driver_issues (driver_id, trip_id, issue_type, severity, occurred_at, location, description, status)
VALUES
    (2, 2, 'Late Delivery Pattern', 'medium', '2026-01-08 18:00', 'Mumbai', 'Arrived 2 hours late due to unplanned route deviation', 'resolved'),
    (3, 6, 'Traffic Violation', 'high', '2026-01-20 11:30', 'Surendranagar Highway', 'Overspeeding detected at 95km/h in 60km/h zone', 'open'),
    (3, NULL, 'Customer Complaint', 'medium', '2026-01-22 09:00', 'Bhuj', 'Customer reported rude behavior during delivery', 'under_review'),
    (5, 11, 'Late Delivery Pattern', 'low', '2026-02-03 13:00', 'Surat', 'Delayed by 45 minutes, reported traffic congestion', 'resolved'),
    (2, NULL, 'Vehicle Misuse', 'high', '2026-02-05 16:00', 'Vadodara', 'Personal use of company vehicle detected after shift hours', 'open'),
    (7, NULL, 'Document Issue', 'critical', '2026-02-10 10:00', 'Ahmedabad', 'Insurance documents expired, driving without valid coverage', 'open')
ON CONFLICT DO NOTHING;

-- Seed fuel logs
INSERT INTO fuel_logs (vehicle_id, date, liters, cost)
VALUES
    (1, '2026-01-05', 25, 2250), (1, '2026-01-12', 40, 3600), (1, '2026-01-20', 30, 2700),
    (2, '2026-01-08', 37, 3330), (2, '2026-01-18', 14, 1260), (2, '2026-02-03', 15, 1350),
    (3, '2026-01-15', 58, 5220), (3, '2026-01-28', 25, 2250), (3, '2026-02-08', 20, 1800),
    (4, '2026-01-22', 20, 1800), (4, '2026-02-14', 28, 2520),
    (5, '2026-01-25', 24, 2160), (5, '2026-02-05', 3, 270),
    (1, '2026-02-01', 23, 2070), (1, '2026-02-10', 10, 900),
    (2, '2026-02-12', 19, 1710)
ON CONFLICT DO NOTHING;

-- Seed service logs
INSERT INTO service_logs (vehicle_id, date, service_type, cost, notes)
VALUES
    (1, '2026-01-10', 'Oil Change', 3500, 'Regular 10000km service'),
    (2, '2026-01-15', 'Tire Replacement', 12000, 'All 4 tires replaced'),
    (3, '2026-01-20', 'Brake Check', 2800, 'Brake pads replaced'),
    (4, '2026-01-25', 'Engine Repair', 28000, 'Major engine overhaul'),
    (5, '2026-02-01', 'Oil Change', 3200, 'Regular service'),
    (1, '2026-02-05', 'AC Repair', 5500, 'Compressor replacement'),
    (4, '2026-02-10', 'Suspension', 15000, 'Front suspension rebuild')
ON CONFLICT DO NOTHING;

-- Seed expenses
INSERT INTO expenses (vehicle_id, category, amount, description, expense_date)
VALUES
    (1, 'toll', 450, 'Ahmedabad-Surat highway toll', '2026-01-05'),
    (2, 'toll', 850, 'Vadodara-Mumbai expressway toll', '2026-01-08'),
    (3, 'toll', 1200, 'Ahmedabad-Jaipur toll charges', '2026-01-15'),
    (NULL, 'insurance', 45000, 'Fleet insurance quarterly premium', '2026-01-01'),
    (NULL, 'other', 8000, 'GPS tracking system subscription', '2026-01-01'),
    (1, 'toll', 350, 'Surat-Rajkot toll', '2026-01-12'),
    (4, 'toll', 300, 'Rajkot-Ahmedabad toll', '2026-01-22'),
    (NULL, 'insurance', 12000, 'Driver insurance premium', '2026-02-01'),
    (5, 'toll', 50, 'Local toll', '2026-02-05'),
    (2, 'toll', 600, 'Pune-Nashik toll', '2026-02-12')
ON CONFLICT DO NOTHING;
