import { Router } from 'express'

import { pool } from '../../config/db.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'

const router = Router()

function parseDriverPayload(body = {}) {
  const {
    name,
    license_number,
    license_category,
    license_expiry,
    contact_number,
    safety_score,
    status
  } = body

  return {
    name,
    license_number,
    license_category,
    license_expiry,
    contact_number,
    safety_score,
    status
  }
}

function requireFleetOrSafetyForMutations(req, res, next) {
  // For POST/PUT/DELETE only; other roles can GET.
  return requireAuth(req, res, () => requireRole(['Fleet Manager', 'Safety Officer'])(req, res, next))
}

// GET /api/drivers
// Optional query param: available=true
// Availability per spec: status = Available AND license_expiry > today AND status != Suspended
router.get('/', async (req, res) => {
  const { available } = req.query

  if (String(available).toLowerCase() === 'true') {
    const q = await pool.query(
      `SELECT id,
              name,
              license_number,
              license_category,
              license_expiry,
              contact_number,
              safety_score,
              status
       FROM drivers
       WHERE status = 'Available'
         AND license_expiry > CURRENT_DATE
         AND status != 'Suspended'
       ORDER BY id ASC`
    )

    return res.json({ drivers: q.rows })
  }

  const q = await pool.query(
    `SELECT id,
            name,
            license_number,
            license_category,
            license_expiry,
            contact_number,
            safety_score,
            status
     FROM drivers
     ORDER BY id ASC`
  )

  return res.json({ drivers: q.rows })
})

// POST /api/drivers (Fleet Manager + Safety Officer)
router.post('/', requireFleetOrSafetyForMutations, async (req, res) => {
  const payload = parseDriverPayload(req.body)

  const required = ['name', 'license_number', 'license_category', 'license_expiry', 'contact_number', 'safety_score', 'status']
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return res.status(400).json({ message: `${field} is required` })
    }
  }

  try {
    const q = await pool.query(
      `INSERT INTO drivers (
        name,
        license_number,
        license_category,
        license_expiry,
        contact_number,
        safety_score,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id,
                name,
                license_number,
                license_category,
                license_expiry,
                contact_number,
                safety_score,
                status`,
      [
        payload.name,
        payload.license_number,
        payload.license_category,
        payload.license_expiry,
        payload.contact_number,
        payload.safety_score,
        payload.status
      ]
    )

    return res.status(201).json({ driver: q.rows[0] })
  } catch (err) {
    if (err?.code === '23505') {
      // license_number unique constraint
      return res.status(409).json({ message: 'License number already exists' })
    }
    throw err
  }
})

// PUT /api/drivers/:id (Fleet Manager + Safety Officer)
router.put('/:id', requireFleetOrSafetyForMutations, async (req, res) => {
  const { id } = req.params
  const payload = parseDriverPayload(req.body)

  const required = ['name', 'license_number', 'license_category', 'license_expiry', 'contact_number', 'safety_score', 'status']
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return res.status(400).json({ message: `${field} is required` })
    }
  }

  try {
    const q = await pool.query(
      `UPDATE drivers
       SET name = $1,
           license_number = $2,
           license_category = $3,
           license_expiry = $4,
           contact_number = $5,
           safety_score = $6,
           status = $7
       WHERE id = $8
       RETURNING id,
                 name,
                 license_number,
                 license_category,
                 license_expiry,
                 contact_number,
                 safety_score,
                 status`,
      [
        payload.name,
        payload.license_number,
        payload.license_category,
        payload.license_expiry,
        payload.contact_number,
        payload.safety_score,
        payload.status,
        id
      ]
    )

    if (q.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' })
    }

    return res.json({ driver: q.rows[0] })
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ message: 'License number already exists' })
    }
    throw err
  }
})

// DELETE /api/drivers/:id (Fleet Manager + Safety Officer)
router.delete('/:id', requireFleetOrSafetyForMutations, async (req, res) => {
  const { id } = req.params

  try {
    const q = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING id', [id])
    if (q.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' })
    }

    return res.json({ message: 'Driver deleted' })
  } catch (err) {
    throw err
  }
})

export default router



