import { Router } from 'express'

const router = Router()

router.get('/', async (req, res) => {
  return res.status(501).json({ message: 'Not implemented (hackathon stub)' })
})

export default router

