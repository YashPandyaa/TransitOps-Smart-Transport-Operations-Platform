import jwt from 'jsonwebtoken'
import { getEnv } from '../config/env.js'

const env = getEnv()

// Skeleton middleware for future use
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' })
  }

  const token = auth.slice('Bearer '.length)
  try {
    const payload = jwt.verify(token, env.jwt.secret)
    req.user = payload
    return next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid/expired token' })
  }
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    const userRole = req.user?.role
    if (!userRole || (roles.length > 0 && !roles.includes(userRole))) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}

