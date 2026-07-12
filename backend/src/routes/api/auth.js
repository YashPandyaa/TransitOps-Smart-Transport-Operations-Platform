import { Router } from 'express'

const router = Router()

// POST /api/auth/login (stub)
router.post('/login', async (req, res) => {
  return res.status(501).json({ message: 'Not implemented (hackathon stub)' })
})

export default router

