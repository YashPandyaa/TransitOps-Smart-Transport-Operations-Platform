import { Router } from 'express'
import { pool } from '../../config/db.js'

const router = Router()

// GET /api/fuel-logs
// Supports optional ?vehicle_id= filter. Returns logs joined with vehicle info.
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_id } = req.query
    let queryText = `
      SELECT f.*,
             v.registration_number AS vehicle_registration,
             v.name_model          AS vehicle_model
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
    `
    const params = []
    if (vehicle_id) {
      queryText += ' WHERE f.vehicle_id = $1'
      params.push(vehicle_id)
    }
    queryText += ' ORDER BY f.date DESC, f.id DESC LIMIT 50'

    const { rows } = await pool.query(queryText, params)
    return res.json(rows.map(r => ({
      ...r,
      liters: parseFloat(r.liters),
      cost:   parseFloat(r.cost)
    })))
  } catch (error) {
    next(error)
  }
})

// POST /api/fuel-logs
// Body: { vehicle_id, liters, cost, date }
router.post('/', async (req, res, next) => {
  try {
    const { vehicle_id, liters, cost, date } = req.body

    if (!vehicle_id || !liters || !cost || !date) {
      return res.status(400).json({ message: 'Missing required fields: vehicle_id, liters, cost, date' })
    }

    const fuelLiters = parseFloat(liters)
    const fuelCost   = parseFloat(cost)
    if (isNaN(fuelLiters) || fuelLiters <= 0) {
      return res.status(400).json({ message: 'Liters must be a positive number' })
    }
    if (isNaN(fuelCost) || fuelCost <= 0) {
      return res.status(400).json({ message: 'Cost must be a positive number' })
    }

    const vehicleCheck = await pool.query('SELECT 1 FROM vehicles WHERE id = $1', [vehicle_id])
    if (vehicleCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    const query = `
      INSERT INTO fuel_logs (vehicle_id, liters, cost, date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const { rows } = await pool.query(query, [vehicle_id, fuelLiters, fuelCost, date])
    return res.status(201).json({
      ...rows[0],
      liters: parseFloat(rows[0].liters),
      cost:   parseFloat(rows[0].cost)
    })
  } catch (error) {
    next(error)
  }
})

export default router
