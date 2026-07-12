import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../../config/db.js'
import { getEnv } from '../../config/env.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'

const router = Router()
const env = getEnv()

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Sign JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    )

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/signup-request
// Allows a driver to submit a registration request with their license details
router.post('/signup-request', async (req, res, next) => {
  try {
    const { name, email, license_number, license_category, license_expiry, contact_number } = req.body

    if (!name || !email || !license_number || !license_category || !license_expiry || !contact_number) {
      return res.status(400).json({ message: 'All driver information fields are required' })
    }

    // Check if email already exists in users
    const userCheck = await pool.query('SELECT 1 FROM users WHERE email = $1', [email])
    if (userCheck.rowCount > 0) {
      return res.status(409).json({ message: 'Email is already registered as an active user account' })
    }

    // Check if email is already in requests
    const requestEmailCheck = await pool.query('SELECT 1 FROM signup_requests WHERE email = $1', [email])
    if (requestEmailCheck.rowCount > 0) {
      return res.status(409).json({ message: 'A signup request with this email already exists' })
    }

    // Check if license number is already registered in drivers
    const driverCheck = await pool.query('SELECT 1 FROM drivers WHERE license_number = $1', [license_number])
    if (driverCheck.rowCount > 0) {
      return res.status(409).json({ message: 'This driver license number is already registered' })
    }

    // Check if license is already in requests
    const requestLicenseCheck = await pool.query('SELECT 1 FROM signup_requests WHERE license_number = $1', [license_number])
    if (requestLicenseCheck.rowCount > 0) {
      return res.status(409).json({ message: 'A signup request with this license number already exists' })
    }

    // Insert signup request
    await pool.query(`
      INSERT INTO signup_requests (name, email, license_number, license_category, license_expiry, contact_number, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
    `, [name, email, license_number, license_category, license_expiry, contact_number])

    return res.status(201).json({ message: 'Registration request submitted. Waiting for admin approval.' })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/signup-requests
// Fleet Managers only: lists all signup requests
router.get('/signup-requests', requireAuth, requireRole(['Fleet Manager']), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM signup_requests ORDER BY created_at DESC')
    return res.json(rows)
  } catch (error) {
    next(error)
  }
})

// PUT /api/auth/signup-requests/:id/approve
// Fleet Managers only: approves a request
router.put('/signup-requests/:id/approve', requireAuth, requireRole(['Fleet Manager']), async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await pool.query(`
      UPDATE signup_requests 
      SET status = 'Approved' 
      WHERE id = $1 AND status = 'Pending'
      RETURNING *
    `, [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pending request not found' })
    }

    return res.json({ message: 'Request approved successfully', request: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// PUT /api/auth/signup-requests/:id/reject
// Fleet Managers only: rejects a request
router.put('/signup-requests/:id/reject', requireAuth, requireRole(['Fleet Manager']), async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await pool.query(`
      UPDATE signup_requests 
      SET status = 'Rejected' 
      WHERE id = $1 AND status = 'Pending'
      RETURNING *
    `, [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Pending request not found' })
    }

    return res.json({ message: 'Request rejected successfully', request: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/complete-signup
// Allows driver to complete signup with password after admin approval
router.post('/complete-signup', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    // Get the request details
    const reqRes = await client.query(`
      SELECT * FROM signup_requests 
      WHERE email = $1 AND status = 'Approved'
    `, [email])

    if (reqRes.rowCount === 0) {
      return res.status(400).json({ message: 'No approved registration request found for this email. Please check status.' })
    }

    const request = reqRes.rows[0]
    const passwordHash = await bcrypt.hash(password, 10)

    // Run transaction
    await client.query('BEGIN')

    // 1. Insert into users
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'Driver')
    `, [request.name, request.email, passwordHash])

    // 2. Insert into drivers
    await client.query(`
      INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, status)
      VALUES ($1, $2, $3, $4, $5, 'Available')
    `, [request.name, request.license_number, request.license_category, request.license_expiry, request.contact_number])

    // 3. Mark request as Completed
    await client.query(`
      UPDATE signup_requests
      SET status = 'Completed'
      WHERE id = $1
    `, [request.id])

    await client.query('COMMIT')
    return res.status(201).json({ message: 'Signup completed successfully. You can now log in.' })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

export default router
