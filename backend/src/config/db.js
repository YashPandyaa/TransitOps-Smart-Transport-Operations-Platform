import { Pool } from 'pg'
import { getEnv } from './env.js'

const env = getEnv()

export const pool = new Pool({
  host: env.pg.host,
  port: env.pg.port,
  database: env.pg.database,
  user: env.pg.user,
  password: env.pg.password
})

