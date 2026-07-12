import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../src/config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const migrationsDir = path.join(__dirname, '..', 'migrations')

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

async function appliedMigrations() {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations')
  return new Set(rows.map(r => r.filename))
}

async function markApplied(filename) {
  await pool.query('INSERT INTO schema_migrations(filename) VALUES($1)', [filename])
}

async function main() {
  await ensureMigrationsTable()
  const applied = await appliedMigrations()

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No migrations found.')
    return
  }

  for (const file of files) {
    if (applied.has(file)) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    console.log(`Applying migration: ${file}`)

    await pool.query('BEGIN')
    try {
      await pool.query(sql)
      await pool.query('COMMIT')
      await markApplied(file)
      console.log(`Applied: ${file}`)
    } catch (e) {
      await pool.query('ROLLBACK')
      throw e
    }
  }

  console.log('Migrations complete.')
}

main()
  .catch(err => {
    console.error('Migration failed:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())

