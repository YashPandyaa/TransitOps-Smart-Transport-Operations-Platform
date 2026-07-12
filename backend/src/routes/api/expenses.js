import { Router } from 'express'
import { pool } from '../../config/db.js'

const router = Router()

const VALID_CATEGORIES = ['Toll', 'Insurance', 'Permit', 'Maintenance', 'Other']

// GET /api/expenses
// Supports optional ?vehicle_id= filter. Returns logs joined with vehicle info.
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_id } = req.query
    let queryText = `
      SELECT e.*,
             v.registration_number AS vehicle_registration,
             v.name_model          AS vehicle_model
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
    `
    const params = []
    if (vehicle_id) {
      queryText += ' WHERE e.vehicle_id = $1'
      params.push(vehicle_id)
    }
    queryText += ' ORDER BY e.date DESC, e.id DESC LIMIT 50'

    const { rows } = await pool.query(queryText, params)
    return res.json(rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    })))
  } catch (error) {
    next(error)
  }
})

// POST /api/expenses
// Body: { vehicle_id, category, amount, date }
// category must be one of: Toll | Insurance | Permit | Maintenance | Other
router.post('/', async (req, res, next) => {
  try {
    const { vehicle_id, category, amount, date } = req.body

    if (!vehicle_id || !category || !amount || !date) {
      return res.status(400).json({ message: 'Missing required fields: vehicle_id, category, amount, date' })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      })
    }

    const expenseAmount = parseFloat(amount)
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a valid positive number' })
    }

    const vehicleCheck = await pool.query('SELECT 1 FROM vehicles WHERE id = $1', [vehicle_id])
    if (vehicleCheck.rowCount === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    const query = `
      INSERT INTO expenses (vehicle_id, category, amount, date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const { rows } = await pool.query(query, [vehicle_id, category, expenseAmount, date])
    return res.status(201).json({
      ...rows[0],
      amount: parseFloat(rows[0].amount)
    })
  } catch (error) {
    next(error)
  }
})

export default router
