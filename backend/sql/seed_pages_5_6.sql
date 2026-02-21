-- =============================================
-- FleetFlow Seed Data for Pages 5 & 6
-- Run: psql -U postgres -d fleetflow -f backend/sql/seed_pages_5_6.sql
-- =============================================

-- ── VEHICLES ────────────────────────────────
INSERT INTO vehicles (vehicle_name, vehicle_type, license_plate, model, year, status, fuel_type, mileage, insurance_expiry, last_service)
VALUES
  ('Tata Ace Gold',     'truck', 'GJ-01-AB-1234', 'Ace Gold',       2022, 'available',   'diesel',  32450.00, '2027-03-15', '2026-01-10'),
  ('Mahindra Bolero',   'van',   'GJ-05-CD-5678', 'Bolero Pickup',  2021, 'available',   'diesel',  58120.50, '2026-11-20', '2025-12-05'),
  ('Ashok Leyland Dost','truck', 'GJ-03-EF-9012', 'Dost Plus',      2023, 'in-trip',     'diesel',  18900.75, '2027-06-01', '2026-02-01'),
  ('Maruti Eeco',       'van',   'GJ-07-GH-3456', 'Eeco Cargo',     2020, 'maintenance', 'petrol',  72300.00, '2026-08-10', '2025-11-15'),
  ('BharatBenz 1217',   'truck', 'GJ-02-IJ-7890', 'BharatBenz 1217',2024, 'available',   'diesel',  9500.00,  '2027-12-31', '2026-01-25'),
  ('Tata 407',          'truck', 'GJ-06-KL-2345', 'Tata 407 Gold',  2019, 'available',   'diesel',  95200.30, '2026-05-18', '2025-10-20'),
  ('Force Traveller',   'bus',   'GJ-04-MN-6789', 'Traveller 3350', 2022, 'available',   'diesel',  41500.00, '2027-01-28', '2026-01-05'),
  ('Tata Nexon EV',     'car',   'GJ-01-OP-1122', 'Nexon EV Max',   2024, 'available',   'electric', 12300.00,'2028-02-14', '2026-02-10')
ON CONFLICT (license_plate) DO NOTHING;

-- ── MAINTENANCE LOGS ────────────────────────
-- Spread across last 12 months for trend data
INSERT INTO maintenance_logs (vehicle_id, service_type, description, cost, service_date, next_service, performed_by, status, scheduled_date, completed_date)
VALUES
  -- Vehicle 1 (Tata Ace Gold)
  (1, 'Oil Change',        'Full synthetic 5W-30 oil change + filter', 2800.00,  '2025-04-10', '2025-10-10', 'AutoCare Garage',  'Completed', '2025-04-08', '2025-04-10'),
  (1, 'Brake Inspection',  'Front and rear brake pad replacement',     4500.00,  '2025-07-15', '2026-01-15', 'FleetServ Hub',    'Completed', '2025-07-12', '2025-07-15'),
  (1, 'Tire Replacement',  'All 4 tires replaced — MRF brand',        12000.00, '2025-11-20', '2026-11-20', 'Tyre World',       'Completed', '2025-11-18', '2025-11-20'),
  (1, 'AC Service',        'Gas refill and compressor check',          3500.00,  '2026-01-10', '2026-07-10', 'CoolTech Auto',    'Completed', '2026-01-08', '2026-01-10'),

  -- Vehicle 2 (Mahindra Bolero)
  (2, 'Oil Change',        'Semi-synthetic oil change',                2200.00,  '2025-03-22', '2025-09-22', 'QuickLube Center', 'Completed', '2025-03-20', '2025-03-22'),
  (2, 'Suspension Repair', 'Replaced front shock absorbers',           6800.00,  '2025-06-05', '2026-06-05', 'Chassis Works',    'Completed', '2025-06-03', '2025-06-05'),
  (2, 'Battery Replacement','New Amaron 65Ah battery installed',       5500.00,  '2025-09-18', '2027-09-18', 'PowerCell Shop',   'Completed', '2025-09-15', '2025-09-18'),
  (2, 'Clutch Plate',      'Clutch plate and pressure plate replaced', 8200.00,  '2025-12-05', '2026-12-05', 'TransMech Auto',   'Completed', '2025-12-02', '2025-12-05'),

  -- Vehicle 3 (Ashok Leyland Dost)
  (3, 'Oil Change',        'Engine oil flush and refill',              2500.00,  '2025-05-14', '2025-11-14', 'AutoCare Garage',  'Completed', '2025-05-12', '2025-05-14'),
  (3, 'Wheel Alignment',   'Four-wheel alignment and balancing',      1800.00,  '2025-08-20', '2026-02-20', 'Tyre World',       'Completed', '2025-08-18', '2025-08-20'),
  (3, 'Engine Tune-up',    'Spark plugs, air filter, fuel filter',     5200.00,  '2026-02-01', '2026-08-01', 'FleetServ Hub',    'Scheduled', '2026-02-15', NULL),

  -- Vehicle 4 (Maruti Eeco — currently in maintenance)
  (4, 'Transmission Repair','Gearbox overhaul — 3rd and 4th gear',     15000.00, '2025-04-25', '2026-04-25', 'TransMech Auto',   'Completed', '2025-04-22', '2025-04-25'),
  (4, 'Oil Change',         'Regular oil change with mineral oil',     1800.00,  '2025-08-30', '2026-02-28', 'QuickLube Center', 'Completed', '2025-08-28', '2025-08-30'),
  (4, 'Engine Overhaul',    'Complete engine rebuild — major work',     35000.00, NULL,          NULL,         'AutoCare Garage',  'In Progress','2026-02-10', NULL),

  -- Vehicle 5 (BharatBenz 1217)
  (5, 'Oil Change',         'First service — synthetic oil',           3200.00,  '2025-06-15', '2025-12-15', 'BharatBenz Service','Completed','2025-06-12', '2025-06-15'),
  (5, 'Brake Inspection',   'Brake fluid top-up, pads OK',            1200.00,  '2025-10-10', '2026-04-10', 'BharatBenz Service','Completed','2025-10-08', '2025-10-10'),
  (5, 'Tire Rotation',      'Rotated all 6 tires',                    800.00,   '2026-01-25', '2026-07-25', 'Tyre World',        'Completed','2026-01-22', '2026-01-25'),

  -- Vehicle 6 (Tata 407)
  (6, 'Oil Change',         'High-mileage oil change',                 2600.00,  '2025-03-10', '2025-09-10', 'AutoCare Garage',  'Completed', '2025-03-08', '2025-03-10'),
  (6, 'Radiator Service',   'Coolant flush and thermostat replacement', 4200.00,  '2025-07-22', '2026-07-22', 'CoolTech Auto',    'Completed', '2025-07-20', '2025-07-22'),
  (6, 'Suspension Repair',  'Leaf spring replacement — rear axle',     9500.00,  '2025-10-20', '2026-10-20', 'Chassis Works',    'Completed', '2025-10-18', '2025-10-20'),
  (6, 'Oil Change',         'Scheduled oil change with filter',        2800.00,  '2026-01-15', '2026-07-15', 'QuickLube Center', 'Completed', '2026-01-12', '2026-01-15'),

  -- Vehicle 7 (Force Traveller)
  (7, 'Oil Change',         'Diesel engine oil change',                3000.00,  '2025-05-08', '2025-11-08', 'FleetServ Hub',    'Completed', '2025-05-06', '2025-05-08'),
  (7, 'AC Service',         'Full AC service — bus cabin',             7500.00,  '2025-09-12', '2026-03-12', 'CoolTech Auto',    'Completed', '2025-09-10', '2025-09-12'),
  (7, 'Brake Overhaul',     'All drum brakes relined',                 8800.00,  '2026-01-05', '2027-01-05', 'FleetServ Hub',    'Completed', '2026-01-02', '2026-01-05'),

  -- Vehicle 8 (Tata Nexon EV)
  (8, 'Battery Health Check','EV battery diagnostics — all cells OK',  1500.00,  '2025-08-15', '2026-02-15', 'Tata EV Service',  'Completed', '2025-08-12', '2025-08-15'),
  (8, 'Tire Replacement',   'Replaced front tires — EV specific',     8000.00,  '2026-02-10', '2027-02-10', 'Tyre World',       'Completed', '2026-02-08', '2026-02-10');


-- ── FUEL LOGS ───────────────────────────────
-- Spread across last 12 months, multiple entries per vehicle
INSERT INTO fuel_logs (vehicle_id, fuel_type, quantity_liters, cost_per_liter, total_cost, odometer_km, fueled_at)
VALUES
  -- Vehicle 1 (Tata Ace Gold — diesel)
  (1, 'diesel', 40.00, 89.50, 3580.00, 28500.00, '2025-03-15 08:30:00'),
  (1, 'diesel', 38.50, 90.00, 3465.00, 29200.00, '2025-04-20 14:15:00'),
  (1, 'diesel', 42.00, 89.75, 3769.50, 29950.00, '2025-05-18 09:00:00'),
  (1, 'diesel', 35.00, 91.00, 3185.00, 30500.00, '2025-06-22 11:30:00'),
  (1, 'diesel', 40.00, 90.50, 3620.00, 31100.00, '2025-07-25 16:45:00'),
  (1, 'diesel', 37.50, 92.00, 3450.00, 31700.00, '2025-08-28 10:00:00'),
  (1, 'diesel', 41.00, 91.50, 3751.50, 32000.00, '2025-10-05 08:15:00'),
  (1, 'diesel', 39.00, 93.00, 3627.00, 32450.00, '2026-01-12 13:00:00'),

  -- Vehicle 2 (Mahindra Bolero — diesel)
  (2, 'diesel', 50.00, 89.50, 4475.00, 52000.00, '2025-03-10 07:00:00'),
  (2, 'diesel', 48.00, 90.00, 4320.00, 53200.00, '2025-04-15 15:30:00'),
  (2, 'diesel', 52.00, 89.75, 4667.00, 54500.00, '2025-05-20 09:45:00'),
  (2, 'diesel', 45.00, 91.25, 4106.25, 55300.00, '2025-06-28 12:00:00'),
  (2, 'diesel', 50.00, 90.50, 4525.00, 56100.00, '2025-08-02 08:30:00'),
  (2, 'diesel', 47.00, 92.00, 4324.00, 56800.00, '2025-09-10 14:00:00'),
  (2, 'diesel', 51.00, 91.75, 4679.25, 57500.00, '2025-11-15 10:15:00'),
  (2, 'diesel', 49.00, 93.00, 4557.00, 58120.50, '2026-01-20 16:00:00'),

  -- Vehicle 3 (Ashok Leyland Dost — diesel)
  (3, 'diesel', 35.00, 89.50, 3132.50, 15000.00, '2025-04-05 08:00:00'),
  (3, 'diesel', 38.00, 90.25, 3429.50, 15800.00, '2025-05-22 13:30:00'),
  (3, 'diesel', 36.00, 91.00, 3276.00, 16500.00, '2025-07-10 09:00:00'),
  (3, 'diesel', 40.00, 90.75, 3630.00, 17300.00, '2025-09-15 11:45:00'),
  (3, 'diesel', 37.00, 92.50, 3422.50, 18100.00, '2025-11-20 15:00:00'),
  (3, 'diesel', 39.00, 93.00, 3627.00, 18900.75, '2026-02-05 10:30:00'),

  -- Vehicle 4 (Maruti Eeco — petrol)
  (4, 'petrol', 30.00, 102.50, 3075.00, 66000.00, '2025-03-20 09:15:00'),
  (4, 'petrol', 28.00, 103.00, 2884.00, 67200.00, '2025-05-10 14:00:00'),
  (4, 'petrol', 32.00, 102.75, 3288.00, 68500.00, '2025-06-25 08:45:00'),
  (4, 'petrol', 29.00, 104.00, 3016.00, 69500.00, '2025-08-12 12:30:00'),
  (4, 'petrol', 31.00, 103.50, 3208.50, 70700.00, '2025-10-18 16:15:00'),
  (4, 'petrol', 27.00, 105.00, 2835.00, 71600.00, '2025-12-22 10:00:00'),
  (4, 'petrol', 30.00, 104.50, 3135.00, 72300.00, '2026-02-08 08:00:00'),

  -- Vehicle 5 (BharatBenz 1217 — diesel)
  (5, 'diesel', 80.00, 89.50, 7160.00, 5000.00,  '2025-05-10 07:30:00'),
  (5, 'diesel', 75.00, 90.00, 6750.00, 6200.00,  '2025-07-15 13:00:00'),
  (5, 'diesel', 82.00, 91.00, 7462.00, 7500.00,  '2025-09-20 09:30:00'),
  (5, 'diesel', 78.00, 92.50, 7215.00, 8800.00,  '2025-11-25 15:45:00'),
  (5, 'diesel', 80.00, 93.00, 7440.00, 9500.00,  '2026-01-28 11:00:00'),

  -- Vehicle 6 (Tata 407 — diesel)
  (6, 'diesel', 55.00, 89.50, 4922.50, 88000.00, '2025-03-05 08:00:00'),
  (6, 'diesel', 52.00, 90.25, 4693.00, 89500.00, '2025-04-28 14:30:00'),
  (6, 'diesel', 58.00, 89.75, 5205.50, 90200.00, '2025-06-10 10:00:00'),
  (6, 'diesel', 50.00, 91.00, 4550.00, 91000.00, '2025-07-30 12:15:00'),
  (6, 'diesel', 54.00, 90.50, 4887.00, 92300.00, '2025-09-08 09:45:00'),
  (6, 'diesel', 56.00, 92.00, 5152.00, 93100.00, '2025-10-25 15:00:00'),
  (6, 'diesel', 53.00, 91.75, 4862.75, 94200.00, '2025-12-12 08:30:00'),
  (6, 'diesel', 57.00, 93.00, 5301.00, 95200.30, '2026-02-02 13:00:00'),

  -- Vehicle 7 (Force Traveller — diesel)
  (7, 'diesel', 60.00, 89.50, 5370.00, 35000.00, '2025-04-12 07:45:00'),
  (7, 'diesel', 55.00, 90.00, 4950.00, 36500.00, '2025-06-18 14:00:00'),
  (7, 'diesel', 62.00, 91.25, 5657.50, 37800.00, '2025-08-22 10:30:00'),
  (7, 'diesel', 58.00, 92.00, 5336.00, 39200.00, '2025-10-30 12:00:00'),
  (7, 'diesel', 60.00, 91.50, 5490.00, 40500.00, '2025-12-15 09:00:00'),
  (7, 'diesel', 63.00, 93.00, 5859.00, 41500.00, '2026-02-08 16:30:00'),

  -- Vehicle 8 (Tata Nexon EV — electric, charged at commercial stations)
  (8, 'electric', 45.00, 12.50, 562.50,  8000.00,  '2025-06-10 20:00:00'),
  (8, 'electric', 42.00, 12.75, 535.50,  9000.00,  '2025-08-18 21:30:00'),
  (8, 'electric', 48.00, 13.00, 624.00,  10200.00, '2025-10-05 19:45:00'),
  (8, 'electric', 44.00, 12.50, 550.00,  11300.00, '2025-12-20 22:00:00'),
  (8, 'electric', 46.00, 13.25, 609.50,  12300.00, '2026-02-12 20:15:00');

-- ── TRIPS (for distance analytics) ──────────
INSERT INTO trips (vehicle_id, driver_id, origin, destination, start_date, end_date, distance_km, fuel_used, status, notes)
VALUES
  (1, NULL, 'Ahmedabad',  'Surat',       '2025-04-10 06:00:00', '2025-04-10 12:00:00', 265.00,  22.00, 'completed', 'Regular delivery run'),
  (1, NULL, 'Surat',      'Mumbai',      '2025-06-15 05:30:00', '2025-06-15 14:00:00', 284.00,  24.50, 'completed', 'Express cargo'),
  (1, NULL, 'Ahmedabad',  'Rajkot',      '2025-09-20 07:00:00', '2025-09-20 11:00:00', 216.00,  18.00, 'completed', 'Parts delivery'),
  (2, NULL, 'Vadodara',   'Ahmedabad',   '2025-05-05 08:00:00', '2025-05-05 10:30:00', 112.00,  14.00, 'completed', 'Pickup delivery'),
  (2, NULL, 'Ahmedabad',  'Bhuj',        '2025-07-22 04:00:00', '2025-07-22 14:00:00', 330.00,  38.00, 'completed', 'Long haul delivery'),
  (2, NULL, 'Gandhinagar', 'Surat',      '2025-11-10 06:30:00', '2025-11-10 12:00:00', 252.00,  28.00, 'completed', 'Cargo transport'),
  (3, NULL, 'Rajkot',      'Jamnagar',   '2025-06-08 09:00:00', '2025-06-08 11:00:00', 88.00,   10.00, 'completed', 'Short run'),
  (3, NULL, 'Ahmedabad',   'Vadodara',   '2025-10-12 07:00:00', '2025-10-12 09:30:00', 112.00,  12.00, 'completed', 'Express delivery'),
  (5, NULL, 'Mumbai',      'Pune',       '2025-08-05 05:00:00', '2025-08-05 09:00:00', 150.00,  35.00, 'completed', 'Heavy cargo'),
  (5, NULL, 'Ahmedabad',   'Udaipur',    '2025-12-01 04:00:00', '2025-12-01 12:00:00', 262.00,  42.00, 'completed', 'Cross-state delivery'),
  (6, NULL, 'Surat',       'Nashik',     '2025-05-18 06:00:00', '2025-05-18 14:00:00', 240.00,  30.00, 'completed', 'Return cargo run'),
  (6, NULL, 'Ahmedabad',   'Indore',     '2025-08-25 03:00:00', '2025-08-25 15:00:00', 390.00,  45.00, 'completed', 'Multi-city delivery'),
  (6, NULL, 'Vadodara',    'Mumbai',     '2025-12-15 04:30:00', '2025-12-15 16:00:00', 392.00,  46.00, 'completed', 'Year-end delivery'),
  (7, NULL, 'Ahmedabad',   'Mount Abu',  '2025-06-20 06:00:00', '2025-06-20 12:00:00', 222.00,  30.00, 'completed', 'Employee transport'),
  (7, NULL, 'Gandhinagar',  'Saputara',  '2025-09-15 07:00:00', '2025-09-15 13:00:00', 200.00,  28.00, 'completed', 'Team outing'),
  (8, NULL, 'Ahmedabad',   'Gandhinagar','2025-07-10 09:00:00', '2025-07-10 09:45:00', 28.00,   NULL,  'completed', 'City commute'),
  (8, NULL, 'Ahmedabad',   'Vadodara',   '2025-11-08 10:00:00', '2025-11-08 12:30:00', 112.00,  NULL,  'completed', 'Business meeting');
