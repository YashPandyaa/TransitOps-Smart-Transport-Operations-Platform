import { Router } from 'express'
import { pool } from '../../config/db.js'

const router = Router()

// GET /api/trips
// Retrieves all trips joined with vehicle and driver details.
router.get('/', async (req, res, next) => {
  try {
    const query = `
      SELECT t.*, 
             v.name_model AS vehicle_model, v.registration_number AS vehicle_registration,
             d.name AS driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `
    const { rows } = await pool.query(query)
    const formatted = rows.map(r => ({
      ...r,
      cargo_weight: parseFloat(r.cargo_weight),
      planned_distance: parseFloat(r.planned_distance),
      final_odometer: r.final_odometer ? parseFloat(r.final_odometer) : null,
      fuel_consumed: r.fuel_consumed ? parseFloat(r.fuel_consumed) : null
    }))
    return res.json(formatted)
  } catch (error) {
    next(error)
  }
})

// POST /api/trips
// Creates a trip in Draft status.
router.post('/', async (req, res, next) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body

    if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
      return res.status(400).json({ message: 'Missing required trip fields' })
    }

    const query = `
      INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
      RETURNING *
    `
    const { rows } = await pool.query(query, [
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance
    ])

    return res.status(201).json(rows[0])
  } catch (error) {
    next(error)
  }
})

// PUT /api/trips/:id/dispatch
// Dispatches a trip after validating driver license, driver availability, and vehicle capacity/availability.
router.put('/:id/dispatch', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const tripId = req.params.id

    await client.query('BEGIN')

    // 1. Get the trip
    const tripRes = await client.query('SELECT * FROM trips WHERE id = $1', [tripId])
    if (tripRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Trip not found' })
    }
    const trip = tripRes.rows[0]

    // 2. Validate trip status
    if (trip.status !== 'Draft') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Only Draft trips can be dispatched' })
    }

    // 3. Get vehicle and driver
    const vehicleRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [trip.vehicle_id])
    if (vehicleRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Associated vehicle not found' })
    }
    const vehicle = vehicleRes.rows[0]

    const driverRes = await client.query('SELECT * FROM drivers WHERE id = $1', [trip.driver_id])
    if (driverRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Associated driver not found' })
    }
    const driver = driverRes.rows[0]

    // 4. Validate vehicle capacity
    const cargoWeight = parseFloat(trip.cargo_weight)
    const maxCapacity = parseFloat(vehicle.max_load_capacity)
    if (cargoWeight > maxCapacity) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${maxCapacity} kg)` })
    }

    // 5. Validate vehicle status
    if (vehicle.status !== 'Available') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: `Vehicle ${vehicle.registration_number} is not Available (currently: ${vehicle.status})` })
    }

    // 6. Validate driver status
    if (driver.status !== 'Available') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: `Driver ${driver.name} is not Available (currently: ${driver.status})` })
    }

    // 7. Validate driver license expiry
    const expiryDate = new Date(driver.license_expiry)
    const today = new Date()
    expiryDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (expiryDate < today) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: `Driver ${driver.name}'s license is expired (expired on: ${driver.license_expiry})` })
    }

    // 8. Update statuses
    await client.query("UPDATE trips SET status = 'Dispatched' WHERE id = $1", [tripId])
    await client.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [trip.vehicle_id])
    await client.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [trip.driver_id])

    await client.query('COMMIT')
    return res.json({ message: 'Trip successfully dispatched' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

// PUT /api/trips/:id/complete
// Completes a dispatched trip, updates odometer and makes resources available.
router.put('/:id/complete', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const tripId = req.params.id
    const { final_odometer, fuel_consumed } = req.body

    if (final_odometer === undefined || fuel_consumed === undefined) {
      return res.status(400).json({ message: 'Missing final_odometer or fuel_consumed' })
    }

    await client.query('BEGIN')

    // 1. Get the trip
    const tripRes = await client.query('SELECT * FROM trips WHERE id = $1', [tripId])
    if (tripRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Trip not found' })
    }
    const trip = tripRes.rows[0]

    // 2. Validate trip status
    if (trip.status !== 'Dispatched') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Only Dispatched trips can be completed' })
    }

    // 3. Get vehicle
    const vehicleRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [trip.vehicle_id])
    const vehicle = vehicleRes.rows[0]

    // 4. Validate final odometer
    const currentOdo = parseFloat(vehicle.odometer)
    const finalOdo = parseFloat(final_odometer)
    if (isNaN(finalOdo) || finalOdo < currentOdo) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: `Final odometer (${finalOdo}) cannot be less than current odometer (${currentOdo})` })
    }

    const fuel = parseFloat(fuel_consumed)
    if (isNaN(fuel) || fuel < 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Fuel consumed must be a valid positive number' })
    }

    // 5. Update statuses
    await client.query(
      "UPDATE trips SET status = 'Completed', final_odometer = $1, fuel_consumed = $2 WHERE id = $3",
      [finalOdo, fuel, tripId]
    )
    await client.query(
      "UPDATE vehicles SET status = 'Available', odometer = $1 WHERE id = $2",
      [finalOdo, trip.vehicle_id]
    )
    await client.query(
      "UPDATE drivers SET status = 'Available' WHERE id = $1",
      [trip.driver_id]
    )

    // Insert automatically to fuel logs
    await client.query(
      "INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES ($1, $2, $3, CURRENT_DATE)",
      [trip.vehicle_id, fuel, fuel * 1.5]
    )

    await client.query('COMMIT')
    return res.json({ message: 'Trip successfully completed' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

// PUT /api/trips/:id/cancel
// Cancels a dispatched trip and resets driver & vehicle to available.
router.put('/:id/cancel', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const tripId = req.params.id

    await client.query('BEGIN')

    // 1. Get the trip
    const tripRes = await client.query('SELECT * FROM trips WHERE id = $1', [tripId])
    if (tripRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Trip not found' })
    }
    const trip = tripRes.rows[0]

    // 2. Validate trip status
    if (trip.status !== 'Dispatched') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Only Dispatched trips can be cancelled' })
    }

    // 3. Update statuses
    await client.query("UPDATE trips SET status = 'Cancelled' WHERE id = $1", [tripId])
    await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id])
    await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id])

    await client.query('COMMIT')
    return res.json({ message: 'Trip successfully cancelled' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

export default router
