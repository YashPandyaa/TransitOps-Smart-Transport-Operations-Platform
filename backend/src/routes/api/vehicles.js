import { Router } from 'express'
import { pool } from '../../config/db.js'

const router = Router()

// GET /api/vehicles
// Supports filtering by status: e.g. GET /api/vehicles?status=Available
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query
    let queryText = 'SELECT * FROM vehicles'
    const queryParams = []

    if (status) {
      queryText += ' WHERE status = $1'
      queryParams.push(status)
    }

    queryText += ' ORDER BY registration_number ASC'

    const { rows } = await pool.query(queryText, queryParams)
    return res.json(rows)
  } catch (error) {
    next(error)
  }
})

// GET /api/vehicles/:id/costs
// Returns aggregated fuel, maintenance, other expenses, and total costs.
router.get('/:id/costs', async (req, res, next) => {
  try {
    const vehicleId = req.params.id

    // Check if vehicle exists
    const vehicleRes = await pool.query('SELECT name_model, registration_number FROM vehicles WHERE id = $1', [vehicleId])
    if (vehicleRes.rowCount === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    const vehicle = vehicleRes.rows[0]

    // 1. Sum Fuel Logs Cost
    const fuelRes = await pool.query('SELECT COALESCE(SUM(cost), 0) AS total FROM fuel_logs WHERE vehicle_id = $1', [vehicleId])
    const fuelCost = parseFloat(fuelRes.rows[0].total)

    // 2. Sum Maintenance logs Cost
    const maintRes = await pool.query('SELECT COALESCE(SUM(cost), 0) AS total FROM maintenance_logs WHERE vehicle_id = $1', [vehicleId])
    const maintenanceCost = parseFloat(maintRes.rows[0].total)

    // 3. Sum Expenses Cost (toll, other etc)
    const expRes = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE vehicle_id = $1', [vehicleId])
    const otherCost = parseFloat(expRes.rows[0].total)

    const totalCost = fuelCost + maintenanceCost + otherCost

    return res.json({
      vehicle_id: parseInt(vehicleId, 10),
      name_model: vehicle.name_model,
      registration_number: vehicle.registration_number,
      fuel_cost: fuelCost,
      maintenance_cost: maintenanceCost,
      other_expense_cost: otherCost,
      total_cost: totalCost
    })
  } catch (error) {
    next(error)
  }
})

export default router
