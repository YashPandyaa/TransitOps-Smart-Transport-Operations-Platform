import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const dotenv = await import('dotenv')
  dotenv.config({ path: path.join(__dirname, '..', '.env') })

  const client = new Client({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
  })

  await client.connect()

  console.log('\n===================================')
  console.log('       TRANSITOPS VEHICLES         ')
  console.log('===================================')
  const vehicles = await client.query('SELECT id, registration_number, name_model, status, odometer, max_load_capacity FROM vehicles ORDER BY id')
  console.table(vehicles.rows.map(v => ({
    ID: v.id,
    Reg: v.registration_number,
    Model: v.name_model,
    Status: v.status,
    Odometer: `${parseFloat(v.odometer)} km`,
    Capacity: `${parseFloat(v.max_load_capacity)} kg`
  })))

  console.log('\n===================================')
  console.log('       TRANSITOPS DRIVERS          ')
  console.log('===================================')
  const drivers = await client.query('SELECT id, name, status, license_expiry, safety_score FROM drivers ORDER BY id')
  console.table(drivers.rows.map(d => ({
    ID: d.id,
    Name: d.name,
    Status: d.status,
    'License Expiry': new Date(d.license_expiry).toLocaleDateString(),
    'Safety Score': parseFloat(d.safety_score)
  })))

  console.log('\n===================================')
  console.log('        TRANSITOPS TRIPS           ')
  console.log('===================================')
  const trips = await client.query('SELECT id, source, destination, vehicle_id, driver_id, status, final_odometer, fuel_consumed FROM trips ORDER BY id')
  console.table(trips.rows.map(t => ({
    ID: t.id,
    Route: `${t.source} -> ${t.destination}`,
    'Vehicle ID': t.vehicle_id,
    'Driver ID': t.driver_id,
    Status: t.status,
    'Final Odo': t.final_odometer ? `${parseFloat(t.final_odometer)} km` : '-',
    'Fuel (L)': t.fuel_consumed ? parseFloat(t.fuel_consumed) : '-'
  })))

  await client.end()
}

main().catch(console.error)
