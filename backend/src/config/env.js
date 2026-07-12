import 'dotenv/config'

export function getEnv() {
  const required = [
    'PORT',
    'CLIENT_ORIGIN',
    'PGHOST',
    'PGPORT',
    'PGDATABASE',
    'PGUSER',
    'PGPASSWORD',
    'JWT_SECRET',
    'JWT_EXPIRES_IN'
  ]

  for (const k of required) {
    if (!process.env[k]) {
      throw new Error(`Missing required env var: ${k}`)
    }
  }

  return {
    port: Number(process.env.PORT),
    clientOrigin: process.env.CLIENT_ORIGIN,

    pg: {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  }
}

