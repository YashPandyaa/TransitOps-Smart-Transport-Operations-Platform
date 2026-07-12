import { Router } from 'express'
import { pool } from '../../config/db.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'

const router = Router()

// GET /api/maintenance
// Retrieves all maintenance logs joined with vehicle details. Open to all roles.
router.get('/', async (req, res, next) => {
  try {
    const query = `
      SELECT m.*, 
             v.registration_number AS vehicle_registration, 
             v.name_model AS vehicle_model
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `
    const { rows } = await pool.query(query)
    const formatted = rows.map(r => ({
      ...r,
      cost: parseFloat(r.cost)
    }))
    return res.json(formatted)
  } catch (error) {
    next(error)
  }
})

// POST /api/maintenance
// Logs a new active maintenance record and sets the vehicle's status to 'In Shop'.
// Restricted to Fleet Managers.
router.post('/', requireAuth, requireRole(['Fleet Manager']), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { vehicle_id, type, date, cost } = req.body

    if (!vehicle_id || !type || !date || !cost) {
      return res.status(400).json({ message: 'Missing required maintenance fields' })
    }

    const logCost = parseFloat(cost)
    if (isNaN(logCost) || logCost < 0) {
      return res.status(400).json({ message: 'Cost must be a valid positive number' })
    }

    await client.query('BEGIN')

    // 1. Validate vehicle exists and is not Retired
    const vehicleRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id])
    if (vehicleRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const vehicle = vehicleRes.rows[0]
    if (vehicle.status === 'Retired') {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Cannot put a retired vehicle into maintenance' })
    }

    // 2. Insert maintenance log (is_active = true by default)
    const insertQuery = `
      INSERT INTO maintenance_logs (vehicle_id, type, date, cost, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `
    const logRes = await client.query(insertQuery, [vehicle_id, type, date, logCost])

    // 3. Update vehicle status to 'In Shop'
    await client.query("UPDATE vehicles SET status = 'In Shop' WHERE id = $1", [vehicle_id])

    // 4. Auto-insert to expenses (helps for hackathon completeness!)
    await client.query(`
      INSERT INTO expenses (vehicle_id, category, amount, date)
      VALUES ($1, 'Maintenance', $2, $3)
    `, [vehicle_id, logCost, date])

    await client.query('COMMIT')
    return res.status(201).json(logRes.rows[0])
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

// PUT /api/maintenance/:id/close
// Closes an active maintenance log and sets the vehicle's status to 'Available' (unless Retired).
// Restricted to Fleet Managers.
router.put('/:id/close', requireAuth, requireRole(['Fleet Manager']), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const logId = req.params.id

    await client.query('BEGIN')

    // 1. Fetch maintenance log
    const logRes = await client.query('SELECT * FROM maintenance_logs WHERE id = $1', [logId])
    if (logRes.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Maintenance record not found' })
    }
    const log = logRes.rows[0]

    if (!log.is_active) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'Maintenance record is already closed' })
    }

    // 2. Fetch vehicle
    const vehicleRes = await client.query('SELECT * FROM vehicles WHERE id = $1', [log.vehicle_id])
    const vehicle = vehicleRes.rows[0]

    // 3. Close the maintenance log
    await client.query('UPDATE maintenance_logs SET is_active = false WHERE id = $1', [logId])

    // 4. Reset vehicle status to 'Available' (unless Retired)
    if (vehicle.status !== 'Retired') {
      await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [log.vehicle_id])
    }

    await client.query('COMMIT')
    return res.json({ message: 'Maintenance record successfully closed' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

export default router
