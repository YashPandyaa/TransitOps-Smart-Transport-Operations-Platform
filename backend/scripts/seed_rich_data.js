import pg from 'pg'
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
  const password = process.env.PGPASSWORD || 'MyNewPassword123'
  const database = process.env.PGDATABASE || 'transitops'

  console.log('Connecting to database to seed 25+ rich test data...')
  const client = new Client({
    host,
    port,
    user,
    password,
    database
  })

  await client.connect()

  // 1. Clear operational tables to prevent duplicate keys and ensure clean state
  console.log('Truncating tables...')
  await client.query(`
    TRUNCATE TABLE fuel_logs, expenses, maintenance_logs, trips CASCADE;
    DELETE FROM vehicles;
    DELETE FROM drivers;
  `)

  // 2. Insert 25 detailed Vehicles
  console.log('Inserting 25 vehicles...')
  const vehicles = [
    ['TX-9021', 'Volvo FH16 (Heavy Truck)', 'Heavy Truck', 25000.00, 12450.00, 150000.00, 'Available'],
    ['TX-4402', 'Ford Transit (Cargo Van)', 'Cargo Van', 1500.00, 34210.00, 45000.00, 'Available'],
    ['TX-8811', 'Isuzu NPR (Box Truck)', 'Box Truck', 5000.00, 85600.00, 60000.00, 'In Shop'],
    ['TX-7733', 'Mercedes Actros (Heavy Truck)', 'Heavy Truck', 26000.00, 210000.00, 175000.00, 'On Trip'],
    ['TX-5512', 'Scania R500 (Heavy Truck)', 'Heavy Truck', 24000.00, 142000.00, 160000.00, 'Available'],
    ['TX-3310', 'Ram ProMaster (Cargo Van)', 'Cargo Van', 1800.00, 45100.00, 42000.00, 'Available'],
    ['TX-1290', 'Chevrolet Express (Cargo Van)', 'Cargo Van', 1600.00, 112000.00, 38000.00, 'Retired'],
    ['TX-6688', 'Freightliner Cascadia (Heavy)', 'Heavy Truck', 27000.00, 312000.00, 185000.00, 'Available'],
    ['TX-2244', 'Peterbilt 579 (Heavy Truck)', 'Heavy Truck', 26500.00, 95400.00, 190000.00, 'On Trip'],
    ['TX-9955', 'Hino 268 (Box Truck)', 'Box Truck', 8000.00, 118400.00, 75000.00, 'Available'],
    ['TX-8833', 'Mercedes Sprinter (Cargo Van)', 'Cargo Van', 2000.00, 28000.00, 52000.00, 'Available'],
    ['TX-4112', 'Kenworth T680 (Heavy Truck)', 'Heavy Truck', 28000.00, 185000.00, 200000.00, 'In Shop'],
    ['TX-7720', 'Mitsubishi Fuso (Box Truck)', 'Box Truck', 6000.00, 92100.00, 65000.00, 'Available'],
    ['TX-3355', 'GMC Savana (Cargo Van)', 'Cargo Van', 1700.00, 134000.00, 39000.00, 'Available'],
    ['TX-5544', 'Mack Anthem (Heavy Truck)', 'Heavy Truck', 25500.00, 62000.00, 168000.00, 'Available'],
    // Added 10 more
    ['TX-8899', 'Hino Dutro (Box Truck)', 'Box Truck', 4500.00, 78100.00, 58000.00, 'Available'],
    ['TX-1122', 'Freightliner Cascadia Premium', 'Heavy Truck', 27500.00, 243000.00, 180000.00, 'Available'],
    ['TX-5566', 'Toyota Dyna (Box Truck)', 'Box Truck', 3500.00, 95000.00, 48000.00, 'Available'],
    ['TX-4477', 'Nissan NV2500 (Cargo Van)', 'Cargo Van', 1400.00, 64200.00, 35000.00, 'Available'],
    ['TX-9900', 'International MV (Heavy Truck)', 'Heavy Truck', 23000.00, 167000.00, 145000.00, 'Available'],
    ['TX-3388', 'Peterbilt 389 (Heavy Truck)', 'Heavy Truck', 26000.00, 340000.00, 210000.00, 'Available'],
    ['TX-1212', 'Ford Transit Custom (Van)', 'Cargo Van', 1300.00, 24000.00, 38000.00, 'Available'],
    ['TX-7788', 'Volvo VNL 860 (Heavy)', 'Heavy Truck', 28000.00, 56000.00, 195000.00, 'Available'],
    ['TX-4499', 'Kenworth W990 (Heavy)', 'Heavy Truck', 27000.00, 122000.00, 220000.00, 'Available'],
    ['TX-6622', 'Chevrolet Express 3500', 'Cargo Van', 1700.00, 89000.00, 41000.00, 'Available']
  ]

  const vehicleIds = []
  for (const v of vehicles) {
    const res = await client.query(`
      INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name_model, status
    `, v)
    vehicleIds.push(res.rows[0])
  }

  // 3. Insert 25 Drivers
  console.log('Inserting 25 drivers...')
  const drivers = [
    ['John Doe', 'DL-9988112', 'Class A CDL', '2027-12-31', '+1-555-0199', 95.50, 'Available'],
    ['Jane Smith', 'DL-1122334', 'Class A CDL', '2028-05-15', '+1-555-0188', 98.20, 'Available'],
    ['Robert Johnson', 'DL-4455667', 'Class B CDL', '2026-10-20', '+1-555-0177', 89.00, 'Available'],
    ['Michael Brown', 'DL-7788990', 'Class A CDL', '2027-04-12', '+1-555-0166', 92.00, 'On Trip'],
    ['William Davis', 'DL-3344556', 'Class C', '2028-06-30', '+1-555-0155', 78.50, 'Suspended'],
    ['David Miller', 'DL-5544332', 'Class A CDL', '2027-09-18', '+1-555-0144', 94.10, 'Available'],
    ['James Wilson', 'DL-2211990', 'Class A CDL', '2028-11-22', '+1-555-0133', 96.80, 'Available'],
    ['Patricia Taylor', 'DL-8877665', 'Class B CDL', '2026-08-05', '+1-555-0122', 91.20, 'Available'],
    ['Linda Anderson', 'DL-9900881', 'Class A CDL', '2029-01-15', '+1-555-0111', 97.40, 'On Trip'],
    ['Elizabeth Thomas', 'DL-5566778', 'Class B CDL', '2027-03-04', '+1-555-0100', 88.50, 'Available'],
    ['Barbara Jackson', 'DL-1144225', 'Class A CDL', '2028-07-09', '+1-555-0211', 93.00, 'Available'],
    ['Susan White', 'DL-3377558', 'Class C', '2026-12-14', '+1-555-0222', 82.30, 'Available'],
    ['Joseph Harris', 'DL-9944661', 'Class A CDL', '2028-02-28', '+1-555-0233', 90.70, 'Available'],
    ['Thomas Martin', 'DL-8822551', 'Class B CDL', '2027-05-19', '+1-555-0244', 85.00, 'Available'],
    ['Charles Garcia', 'DL-7733441', 'Class A CDL', '2028-08-01', '+1-555-0255', 95.00, 'Available'],
    // Added 10 more
    ['Paul Walker', 'DL-2233445', 'Class A CDL', '2028-10-12', '+1-555-0311', 94.80, 'Available'],
    ['Vin Diesel', 'DL-5566779', 'Class A CDL', '2027-12-01', '+1-555-0322', 99.10, 'Available'],
    ['Michelle Rodriguez', 'DL-9988001', 'Class B CDL', '2028-04-15', '+1-555-0333', 92.50, 'Available'],
    ['Tyrese Gibson', 'DL-4411223', 'Class A CDL', '2029-06-20', '+1-555-0344', 86.40, 'Available'],
    ['Ludacris Bridges', 'DL-3355771', 'Class B CDL', '2026-10-30', '+1-555-0355', 97.90, 'Available'],
    ['Jordana Brewster', 'DL-1212343', 'Class C', '2027-02-14', '+1-555-0366', 91.00, 'Available'],
    ['Jason Statham', 'DL-7788112', 'Class A CDL', '2028-09-18', '+1-555-0377', 98.70, 'Available'],
    ['Dwayne Johnson', 'DL-4499221', 'Class A CDL', '2029-11-22', '+1-555-0388', 95.20, 'Available'],
    ['Gal Gadot', 'DL-8822991', 'Class B CDL', '2027-08-05', '+1-555-0399', 96.00, 'Available'],
    ['Kurt Russell', 'DL-9933881', 'Class A CDL', '2028-01-15', '+1-555-0400', 89.90, 'Available']
  ]

  const driverIds = []
  for (const d of drivers) {
    const res = await client.query(`
      INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, status
    `, d)
    driverIds.push(res.rows[0])
  }

  // Helper map to find items
  const getVehicleByModel = (model) => vehicleIds.find(v => v.name_model.includes(model))
  const getDriverByName = (name) => driverIds.find(d => d.name.includes(name))

  // 4. Seed 25 detailed Trips
  console.log('Inserting 25 trips...')
  const tripsData = [
    // Completed Trips
    ['Volvo FH16 (Heavy Truck)', 'John Doe', 'Warehouse A', 'Distribution Center B', 12000.00, 150.00, 'Completed', 12000.00, 12150.00, 48.00],
    ['Ford Transit (Cargo Van)', 'Jane Smith', 'HQ Depot', 'Retail Hub C', 800.00, 45.00, 'Completed', 34000.00, 34045.00, 12.00],
    ['Isuzu NPR (Box Truck)', 'Robert Johnson', 'Port Terminal 1', 'Factory Logistics', 3500.00, 120.00, 'Completed', 85000.00, 85120.00, 35.00],
    ['Freightliner Cascadia (Heavy)', 'James Wilson', 'Cargo Docks', 'East Warehouse', 24000.00, 350.00, 'Completed', 311000.00, 311350.00, 110.00],
    ['Scania R500 (Heavy Truck)', 'David Miller', 'Warehouse B', 'Midtown Center', 18000.00, 220.00, 'Completed', 141000.00, 141220.00, 72.00],
    ['Ram ProMaster (Cargo Van)', 'Patricia Taylor', 'Local Bakery', 'Supermarket Row', 1200.00, 30.00, 'Completed', 45000.00, 45030.00, 8.00],
    ['Kenworth T680 (Heavy Truck)', 'Charles Garcia', 'Steel Mill', 'Bridge Construction', 26000.00, 80.00, 'Completed', 184500.00, 184580.00, 28.00],
    ['Peterbilt 579 (Heavy Truck)', 'Joseph Harris', 'Agriculture Silos', 'Processing Plant', 22000.00, 190.00, 'Completed', 94000.00, 94190.00, 60.00],
    ['Mack Anthem (Heavy Truck)', 'Thomas Martin', 'Chemical Depot', 'Industrial Zone', 15000.00, 140.00, 'Completed', 61000.00, 61140.00, 45.00],
    ['Hino 268 (Box Truck)', 'Elizabeth Thomas', 'Distribution Hub', 'Metro Retailers', 6000.00, 65.00, 'Completed', 118000.00, 118065.00, 20.00],
    ['Mercedes Sprinter (Cargo Van)', 'Barbara Jackson', 'Pharma Lab', 'City Hospital', 900.00, 25.00, 'Completed', 27900.00, 27925.00, 6.00],
    ['GMC Savana (Cargo Van)', 'Susan White', 'Postal Sorting', 'Airport Cargo', 1100.00, 50.00, 'Completed', 133800.00, 133850.00, 14.00],
    
    // More Completed Trips (using newly added vehicles/drivers)
    ['Hino Dutro', 'Paul Walker', 'Port Terminal 2', 'Warehouse B', 3800.00, 95.00, 'Completed', 78000.00, 78095.00, 22.00],
    ['Freightliner Cascadia Premium', 'Vin Diesel', 'Factory Logistics', 'Distribution Hub', 25000.00, 280.00, 'Completed', 242000.00, 242280.00, 90.00],
    ['Toyota Dyna', 'Michelle Rodriguez', 'Retail Hub C', 'HQ Depot', 2800.00, 70.00, 'Completed', 94500.00, 94570.00, 18.00],
    ['Nissan NV2500', 'Tyrese Gibson', 'Postal Sorting', 'Midtown Center', 1200.00, 40.00, 'Completed', 64100.00, 64140.00, 11.00],
    ['International MV', 'Ludacris Bridges', 'Warehouse A', 'Industrial Zone', 18000.00, 150.00, 'Completed', 166500.00, 166650.00, 55.00],
    ['Peterbilt 389', 'Jason Statham', 'Cargo Docks', 'East Warehouse', 26000.00, 310.00, 'Completed', 339000.00, 339310.00, 105.00],
    ['Ford Transit Custom', 'Jordana Brewster', 'Local Bakery', 'Retail Outlet 5', 1000.00, 35.00, 'Completed', 23900.00, 23935.00, 9.00],
    ['Volvo VNL 860', 'Dwayne Johnson', 'Steel Mill', 'Port Terminal 1', 27000.00, 110.00, 'Completed', 55800.00, 55910.00, 38.00],
    
    // Active (On Trip) Trips
    ['Mercedes Actros (Heavy Truck)', 'Michael Brown', 'HQ Depot', 'South Terminal', 20000.00, 400.00, 'Dispatched', null, null, null],
    ['Peterbilt 579 (Heavy Truck)', 'Linda Anderson', 'Port Terminal 1', 'North Warehouse', 21000.00, 280.00, 'Dispatched', null, null, null],
    
    // Pending / Dispatched / Draft Trips
    ['Volvo FH16 (Heavy Truck)', 'John Doe', 'Warehouse A', 'Port Terminal 2', 15000.00, 180.00, 'Dispatched', null, null, null],
    ['Ford Transit (Cargo Van)', 'Jane Smith', 'Distribution Hub', 'Retail Outlet 5', 1000.00, 55.00, 'Dispatched', null, null, null],
    ['Scania R500 (Heavy Truck)', 'James Wilson', 'Factory Logistics', 'Distribution Center B', 14000.00, 90.00, 'Draft', null, null, null],
    ['Hino 268 (Box Truck)', 'Patricia Taylor', 'Pharma Lab', 'Express Logistics', 4500.00, 110.00, 'Draft', null, null, null]
  ]

  for (const t of tripsData) {
    const v = getVehicleByModel(t[0])
    const d = getDriverByName(t[1])
    if (v && d) {
      await client.query(`
        INSERT INTO trips (
          vehicle_id, driver_id, source, destination, cargo_weight, 
          planned_distance, status, final_odometer, fuel_consumed
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [v.id, d.id, t[2], t[3], t[4], t[5], t[6], t[8], t[9]])
    }
  }

  // 5. Seed 25 Maintenance Logs
  console.log('Inserting 25 maintenance logs...')
  const maintData = [
    ['Volvo FH16 (Heavy Truck)', 'Oil Change', '2026-06-01', 350.00, false],
    ['Ford Transit (Cargo Van)', 'Tire Rotation', '2026-06-10', 120.00, false],
    ['Isuzu NPR (Box Truck)', 'Brake Replacement', '2026-05-15', 480.00, false],
    ['Mercedes Actros (Heavy Truck)', 'Engine Tuning', '2026-04-20', 1250.00, false],
    ['Scania R500 (Heavy Truck)', 'General Inspection', '2026-06-18', 200.00, false],
    ['Freightliner Cascadia (Heavy)', 'Brake Replacement', '2026-03-12', 550.00, false],
    ['Peterbilt 579 (Heavy Truck)', 'Oil Change', '2026-05-28', 380.00, false],
    ['Hino 268 (Box Truck)', 'Tire Rotation', '2026-02-14', 150.00, false],
    ['Mercedes Sprinter (Cargo Van)', 'Engine Tuning', '2026-06-25', 920.00, false],
    ['GMC Savana (Cargo Van)', 'Oil Change', '2026-01-10', 110.00, false],
    ['Hino Dutro', 'General Inspection', '2026-06-05', 130.00, false],
    ['Freightliner Cascadia Premium', 'Oil Change', '2026-07-02', 400.00, false],
    ['Toyota Dyna', 'Brake Replacement', '2026-06-12', 320.00, false],
    ['Nissan NV2500', 'Tire Rotation', '2026-05-20', 110.00, false],
    ['International MV', 'Engine Tuning', '2026-06-28', 980.00, false],
    ['Peterbilt 389', 'Oil Change', '2026-04-18', 420.00, false],
    ['Ford Transit Custom', 'Tire Rotation', '2026-07-01', 115.00, false],
    ['Volvo VNL 860', 'Brake Replacement', '2026-06-19', 490.00, false],
    ['Kenworth W990', 'General Inspection', '2026-07-03', 250.00, false],
    ['Chevrolet Express 3500', 'Oil Change', '2026-05-14', 105.00, false],
    ['Mack Anthem (Heavy Truck)', 'Tire Rotation', '2026-06-22', 160.00, false],
    ['Mitsubishi Fuso (Box Truck)', 'Oil Change', '2026-03-10', 125.00, false],
    ['GMC Savana (Cargo Van)', 'Brake Replacement', '2026-04-12', 290.00, false],
    // Active In-shop logs
    ['Isuzu NPR (Box Truck)', 'Engine Tuning', '2026-07-11', 850.00, true],
    ['Kenworth T680 (Heavy Truck)', 'Brake Replacement', '2026-07-12', 600.00, true]
  ]

  for (const m of maintData) {
    const v = getVehicleByModel(m[0])
    if (v) {
      await client.query(`
        INSERT INTO maintenance_logs (vehicle_id, type, date, cost, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `, [v.id, m[1], m[2], m[3], m[4]])
    }
  }

  // 6. Seed 25 Fuel Purchase Logs
  console.log('Inserting 25 fuel logs...')
  const fuelData = [
    ['Volvo FH16 (Heavy Truck)', 150.00, 220.00, '2026-06-02'],
    ['Volvo FH16 (Heavy Truck)', 180.00, 260.00, '2026-06-15'],
    ['Ford Transit (Cargo Van)', 60.00, 90.00, '2026-06-11'],
    ['Ford Transit (Cargo Van)', 55.00, 85.00, '2026-06-25'],
    ['Mercedes Actros (Heavy Truck)', 200.00, 310.00, '2026-05-01'],
    ['Mercedes Actros (Heavy Truck)', 220.00, 340.00, '2026-05-18'],
    ['Scania R500 (Heavy Truck)', 140.00, 210.00, '2026-06-20'],
    ['Freightliner Cascadia (Heavy)', 210.00, 315.00, '2026-03-14'],
    ['Peterbilt 579 (Heavy Truck)', 180.00, 275.00, '2026-05-30'],
    ['Kenworth T680 (Heavy Truck)', 190.00, 290.00, '2026-06-05'],
    ['Hino 268 (Box Truck)', 90.00, 135.00, '2026-02-16'],
    ['Mercedes Sprinter (Cargo Van)', 70.00, 105.00, '2026-06-26'],
    ['GMC Savana (Cargo Van)', 80.00, 120.00, '2026-01-12'],
    ['Scania R500 (Heavy Truck)', 150.00, 225.00, '2026-07-01'],
    ['Peterbilt 579 (Heavy Truck)', 170.00, 255.00, '2026-07-05'],
    // 10 more
    ['Hino Dutro', 85.00, 128.00, '2026-06-06'],
    ['Freightliner Cascadia Premium', 220.00, 341.00, '2026-07-03'],
    ['Toyota Dyna', 95.00, 142.00, '2026-06-13'],
    ['Nissan NV2500', 50.00, 75.00, '2026-05-21'],
    ['International MV', 160.00, 245.00, '2026-06-29'],
    ['Peterbilt 389', 230.00, 350.00, '2026-04-19'],
    ['Ford Transit Custom', 55.00, 83.00, '2026-07-02'],
    ['Volvo VNL 860', 190.00, 292.00, '2026-06-20'],
    ['Kenworth W990', 210.00, 325.00, '2026-07-04'],
    ['Chevrolet Express 3500', 65.00, 98.00, '2026-05-15']
  ]

  for (const f of fuelData) {
    const v = getVehicleByModel(f[0])
    if (v) {
      await client.query(`
        INSERT INTO fuel_logs (vehicle_id, liters, cost, date)
        VALUES ($1, $2, $3, $4)
      `, [v.id, f[1], f[2], f[3]])
    }
  }

  // 7. Seed 25 General Operational Expenses
  console.log('Inserting 25 expenses...')
  const expenseData = [
    ['Volvo FH16 (Heavy Truck)', 'Toll', 45.00, '2026-06-02'],
    ['Volvo FH16 (Heavy Truck)', 'Permit', 150.00, '2026-05-10'],
    ['Ford Transit (Cargo Van)', 'Toll', 12.00, '2026-06-11'],
    ['Ford Transit (Cargo Van)', 'Insurance', 350.00, '2026-06-01'],
    ['Mercedes Actros (Heavy Truck)', 'Toll', 85.00, '2026-05-02'],
    ['Mercedes Actros (Heavy Truck)', 'Permit', 250.00, '2026-04-15'],
    ['Scania R500 (Heavy Truck)', 'Toll', 65.00, '2026-06-21'],
    ['Freightliner Cascadia (Heavy)', 'Insurance', 400.00, '2026-03-01'],
    ['Peterbilt 579 (Heavy Truck)', 'Toll', 55.00, '2026-05-30'],
    ['Kenworth T680 (Heavy Truck)', 'Permit', 200.00, '2026-06-01'],
    ['Hino 268 (Box Truck)', 'Toll', 24.00, '2026-02-17'],
    ['Mercedes Sprinter (Cargo Van)', 'Toll', 18.00, '2026-06-26'],
    ['GMC Savana (Cargo Van)', 'Toll', 15.00, '2026-01-13'],
    ['Mack Anthem (Heavy Truck)', 'Permit', 180.00, '2026-07-02'],
    ['Peterbilt 579 (Heavy Truck)', 'Other', 75.00, '2026-07-06'],
    // 10 more
    ['Hino Dutro', 'Toll', 22.00, '2026-06-07'],
    ['Freightliner Cascadia Premium', 'Toll', 95.00, '2026-07-04'],
    ['Toyota Dyna', 'Toll', 18.00, '2026-06-14'],
    ['Nissan NV2500', 'Insurance', 280.00, '2026-05-01'],
    ['International MV', 'Toll', 55.00, '2026-06-30'],
    ['Peterbilt 389', 'Permit', 300.00, '2026-04-20'],
    ['Ford Transit Custom', 'Toll', 10.00, '2026-07-03'],
    ['Volvo VNL 860', 'Insurance', 420.00, '2026-06-01'],
    ['Kenworth W990', 'Toll', 70.00, '2026-07-05'],
    ['Chevrolet Express 3500', 'Toll', 14.00, '2026-05-16']
  ]

  for (const e of expenseData) {
    const v = getVehicleByModel(e[0])
    if (v) {
      await client.query(`
        INSERT INTO expenses (vehicle_id, category, amount, date)
        VALUES ($1, $2, $3, $4)
      `, [v.id, e[1], e[2], e[3]])
    }
  }

  await client.end()
  console.log('Seeding of 25+ rich dataset completed successfully!')
}

main().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
