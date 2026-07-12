import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const dotenv = await import('dotenv')
  dotenv.config({ path: path.join(__dirname, '..', '.env') })

  const host = process.env.PGHOST || 'localhost'
  const port = parseInt(process.env.PGPORT || '5432', 10)
  const user = process.env.PGUSER || 'postgres'
  const password = process.env.PGPASSWORD || 'MyNewPassword123'
  const database = process.env.PGDATABASE || 'transitops'

  const client = new Client({
    host,
    port,
    user,
    password,
    database
  })

  await client.connect()

  console.log('Creating signup_requests table...')
  await client.query(`
    CREATE TABLE IF NOT EXISTS signup_requests (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      license_number TEXT NOT NULL,
      license_category TEXT NOT NULL,
      license_expiry DATE NOT NULL,
      contact_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `)

  await client.end()
  console.log('Table signup_requests verified/created successfully!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
