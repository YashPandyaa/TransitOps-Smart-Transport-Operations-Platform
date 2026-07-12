import { Router } from 'express'

import { pool } from '../../config/db.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'

const router = Router()

function parseVehiclePayload(body = {}) {
  const {
    registration_number,
    name_model,
    type,
    max_load_capacity,
    odometer,
    acquisition_cost,
    status
  } = body

  return {
    registration_number,
    name_model,
    type,
    max_load_capacity,
    odometer,
    acquisition_cost,
    status
  }
}

function requireFleetManagerForMutations(req, res, next) {
  // For POST/PUT/DELETE only; other roles can GET.
  return requireAuth(req, res, () => requireRole(['Fleet Manager'])(req, res, next))
}

// GET /api/vehicles?status=Available
router.get('/', async (req, res) => {
  const { status } = req.query

  if (status) {
    const q = await pool.query(
      `SELECT id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status
       FROM vehicles
       WHERE status = $1
       ORDER BY id ASC`,
      [status]
    )

    return res.json({ vehicles: q.rows })
  }

  const q = await pool.query(
    `SELECT id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status
     FROM vehicles
     ORDER BY id ASC`
  )

  return res.json({ vehicles: q.rows })
})

// POST /api/vehicles (Fleet Manager only)
router.post('/', requireFleetManagerForMutations, async (req, res) => {
  const payload = parseVehiclePayload(req.body)

  const required = ['registration_number', 'name_model', 'type', 'max_load_capacity', 'odometer', 'acquisition_cost', 'status']
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return res.status(400).json({ message: `${field} is required` })
    }
  }

  try {
    const q = await pool.query(
      `INSERT INTO vehicles (
        registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status`,
      [
        payload.registration_number,
        payload.name_model,
        payload.type,
        payload.max_load_capacity,
        payload.odometer,
        payload.acquisition_cost,
        payload.status
      ]
    )

    return res.status(201).json({ vehicle: q.rows[0] })
  } catch (err) {
    if (err?.code === '23505') {
      // registration_number unique constraint
      return res.status(409).json({ message: 'Registration number already exists' })
    }
    throw err
  }
})

// PUT /api/vehicles/:id (Fleet Manager only)
router.put('/:id', requireFleetManagerForMutations, async (req, res) => {
  const { id } = req.params
  const payload = parseVehiclePayload(req.body)

  const required = ['registration_number', 'name_model', 'type', 'max_load_capacity', 'odometer', 'acquisition_cost', 'status']
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return res.status(400).json({ message: `${field} is required` })
    }
  }

  try {
    const q = await pool.query(
      `UPDATE vehicles
       SET registration_number = $1,
           name_model = $2,
           type = $3,
           max_load_capacity = $4,
           odometer = $5,
           acquisition_cost = $6,
           status = $7
       WHERE id = $8
       RETURNING id, registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status`,
      [
        payload.registration_number,
        payload.name_model,
        payload.type,
        payload.max_load_capacity,
        payload.odometer,
        payload.acquisition_cost,
        payload.status,
        id
      ]
    )

    if (q.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    return res.json({ vehicle: q.rows[0] })
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ message: 'Registration number already exists' })
    }
    throw err
  }
})

// DELETE /api/vehicles/:id (Fleet Manager only)
router.delete('/:id', requireFleetManagerForMutations, async (req, res) => {
  const { id } = req.params

  try {
    const q = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id])
    if (q.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    return res.json({ message: 'Vehicle deleted' })
  } catch (err) {
    throw err
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



