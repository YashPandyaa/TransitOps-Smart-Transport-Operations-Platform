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

export default router
