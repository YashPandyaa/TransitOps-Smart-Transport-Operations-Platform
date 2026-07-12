import pg from 'pg'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const dotenv = await import('dotenv')
  dotenv.config({ path: path.join(__dirname, '..', '.env') })
  
  const host = process.env.PGHOST || 'localhost'
  const port = parseInt(process.env.PGPORT || '5432', 10)
  const user = process.env.PGUSER || 'postgres'
  const password = process.env.PGPASSWORD || 'postgres'
  const database = process.env.PGDATABASE || 'transitops'

  console.log(`Connecting to default 'postgres' database to check for '${database}'...`)
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres'
  })

  await client.connect()

  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database])
  if (res.rowCount === 0) {
    console.log(`Database '${database}' does not exist. Creating it...`)
    await client.query(`CREATE DATABASE ${database}`)
    console.log(`Database '${database}' created successfully.`)
  } else {
    console.log(`Database '${database}' already exists.`)
  }
  await client.end()

  // Run the migration script
  console.log('Running migrations...')
  execSync('node scripts/migrate.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' })

  // Seed initial data
  console.log('Seeding initial data (vehicles, drivers)...')
  const seedClient = new Client({
    host,
    port,
    user,
    password,
    database
  })
  await seedClient.connect()

  // 1. Seed Vehicles
  console.log('Seeding vehicles...')
  await seedClient.query(`
    INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status)
    VALUES 
      ('TX-9021', 'Volvo FH16 (Heavy Truck)', 'Heavy Truck', 25000.00, 12000.00, 150000.00, 'Available'),
      ('TX-4402', 'Ford Transit (Cargo Van)', 'Cargo Van', 1500.00, 34000.00, 45000.00, 'Available'),
      ('TX-8811', 'Isuzu NPR (Box Truck)', 'Box Truck', 5000.00, 85000.00, 60000.00, 'In Shop'),
      ('TX-7733', 'Mercedes Actros (Heavy Truck)', 'Heavy Truck', 26000.00, 210000.00, 175000.00, 'Available')
    ON CONFLICT (registration_number) DO NOTHING
  `)

  // 2. Seed Drivers
  console.log('Seeding drivers...')
  await seedClient.query(`
    INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status)
    VALUES 
      ('John Doe', 'DL-9988112', 'Class A CDL', '2027-12-31', '+1-555-0199', 95.50, 'Available'),
      ('Jane Smith', 'DL-1122334', 'Class A CDL', '2028-05-15', '+1-555-0188', 98.20, 'Available'),
      ('Robert Johnson', 'DL-4455667', 'Class B CDL', '2026-10-20', '+1-555-0177', 89.00, 'Available'),
      ('Michael Brown', 'DL-7788990', 'Class A CDL', '2025-01-01', '+1-555-0166', 92.00, 'Available'), -- Expired license
      ('William Davis', 'DL-3344556', 'Class C', '2027-06-30', '+1-555-0155', 78.50, 'Suspended')    -- Suspended
    ON CONFLICT (license_number) DO NOTHING
  `)

  // 3. Seed some default trips
  console.log('Seeding trips...')
  const vehicleRes = await seedClient.query("SELECT id FROM vehicles WHERE registration_number = 'TX-9021'")
  const driverRes = await seedClient.query("SELECT id FROM drivers WHERE license_number = 'DL-9988112'")
  
  if (vehicleRes.rowCount > 0 && driverRes.rowCount > 0) {
    const vehicleId = vehicleRes.rows[0].id
    const driverId = driverRes.rows[0].id

    // Check if trips already seeded to avoid duplication
    const tripCheck = await seedClient.query("SELECT 1 FROM trips WHERE source = 'Warehouse A' AND destination = 'Distribution Center B'")
    if (tripCheck.rowCount === 0) {
      await seedClient.query(`
        INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status)
        VALUES 
          ('Warehouse A', 'Distribution Center B', $1, $2, 10000.00, 150.00, 'Draft')
      `, [vehicleId, driverId])
    }
  }

  await seedClient.end()
  console.log('Database setup and seeding complete!')
}

main().catch(err => {
  console.error('Setup failed:', err)
  process.exit(1)
})
