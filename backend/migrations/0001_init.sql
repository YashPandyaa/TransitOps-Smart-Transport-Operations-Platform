-- TransitOps initial schema
-- Includes 8 tables + enum types.

BEGIN;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
    CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
    CREATE TYPE driver_status AS ENUM ('Available', 'On Trip', 'Off Duty', 'Suspended');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
  END IF;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id BIGSERIAL PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  name_model TEXT NOT NULL,
  type TEXT NOT NULL,
  max_load_capacity NUMERIC(12,2) NOT NULL,
  odometer NUMERIC(12,2) NOT NULL DEFAULT 0,
  acquisition_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  status vehicle_status NOT NULL DEFAULT 'Available'
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  license_category TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  contact_number TEXT NOT NULL,
  safety_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status driver_status NOT NULL DEFAULT 'Available'
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  cargo_weight NUMERIC(12,2) NOT NULL,
  planned_distance NUMERIC(12,2) NOT NULL,
  status trip_status NOT NULL DEFAULT 'Draft',
  final_odometer NUMERIC(12,2),
  fuel_consumed NUMERIC(12,2)
);

-- MaintenanceLogs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  cost NUMERIC(14,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- FuelLogs
CREATE TABLE IF NOT EXISTS fuel_logs (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  liters NUMERIC(12,2) NOT NULL,
  cost NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);

COMMIT;

