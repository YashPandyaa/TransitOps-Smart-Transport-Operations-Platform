import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { getEnv } from './config/env.js'

import { errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/api/auth.js'
import vehiclesRoutes from './routes/api/vehicles.js'
import driversRoutes from './routes/api/drivers.js'
import tripsRoutes from './routes/api/trips.js'
import maintenanceRoutes from './routes/api/maintenance.js'
import fuelLogsRoutes from './routes/api/fuel-logs.js'
import expensesRoutes from './routes/api/expenses.js'
import reportsRoutes from './routes/api/reports.js'
import dashboardRoutes from './routes/api/dashboard.js'

const env = getEnv()

export const app = express()

app.use(cors({ origin: env.clientOrigin, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehiclesRoutes)
app.use('/api/drivers', driversRoutes)
app.use('/api/trips', tripsRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/fuel-logs', fuelLogsRoutes)
app.use('/api/expenses', expensesRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/dashboard', dashboardRoutes)

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }))

app.use(errorHandler)


