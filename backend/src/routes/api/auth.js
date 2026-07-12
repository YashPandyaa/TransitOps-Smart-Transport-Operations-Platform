import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { pool } from '../../config/db.js'
import { getEnv } from '../../config/env.js'

const router = Router()
const env = getEnv()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  const q = await pool.query('SELECT id, email, password_hash, role, name FROM users WHERE email = $1', [email])
  const user = q.rows[0]

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    {
      user_id: user.id,
      role: user.role,
      email: user.email
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  )

  return res.json({
    token,
    user: {
      user_id: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    }
  })
})

export default router


