import bcrypt from 'bcrypt'

import { pool } from '../src/config/db.js'

const PASSWORDS = {
  fleet: 'FleetManager123!',
  driver: 'Driver123!',
  safety: 'SafetyOfficer123!',
  finance: 'FinancialAnalyst123!'
}

const USERS = [
  {
    email: 'fleet.manager@transitops.local',
    name: 'Fleet Manager Test',
    role: 'Fleet Manager',
    password: PASSWORDS.fleet
  },
  {
    email: 'driver@transitops.local',
    name: 'Driver Test',
    role: 'Driver',
    password: PASSWORDS.driver
  },
  {
    email: 'safety.officer@transitops.local',
    name: 'Safety Officer Test',
    role: 'Safety Officer',
    password: PASSWORDS.safety
  },
  {
    email: 'financial.analyst@transitops.local',
    name: 'Financial Analyst Test',
    role: 'Financial Analyst',
    password: PASSWORDS.finance
  }
]

async function ensureUsers() {
  for (const u of USERS) {
    const password_hash = await bcrypt.hash(u.password, 12)

    // Upsert by email
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role`,
      [u.name, u.email, password_hash, u.role]
    )
  }
}

async function main() {
  try {
    await ensureUsers()
    console.log('Seeded/updated 4 test users in users table.')
    console.log('Passwords used:')
    console.log(`- Fleet Manager: ${PASSWORDS.fleet}`)
    console.log(`- Driver: ${PASSWORDS.driver}`)
    console.log(`- Safety Officer: ${PASSWORDS.safety}`)
    console.log(`- Financial Analyst: ${PASSWORDS.finance}`)
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await pool.end().catch(() => {})
  }
}

main()

