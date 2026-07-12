import { Router } from 'express'
import { pool } from '../../config/db.js'

const router = Router()

// GET /api/drivers
// Supports filtering by availability: GET /api/drivers?available=true
router.get('/', async (req, res, next) => {
  try {
    const { available } = req.query
    let queryText = 'SELECT * FROM drivers'
    const queryParams = []

    if (available === 'true') {
      // Driver must be Available and license must not be expired
      queryText += " WHERE status = 'Available' AND license_expiry > CURRENT_DATE"
    }

    queryText += ' ORDER BY name ASC'

    const { rows } = await pool.query(queryText, queryParams)
    return res.json(rows)
  } catch (error) {
    next(error)
  }
})

export default router
