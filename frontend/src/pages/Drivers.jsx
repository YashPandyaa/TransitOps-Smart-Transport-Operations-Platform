import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import DriverTable from '../components/drivers/DriverTable'

export default function Drivers() {
  const { token, role, authFetch } = useAuth()

  const [drivers, setDrivers] = useState([])
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    const sp = new URLSearchParams()
    if (onlyAvailable) sp.set('available', 'true')
    const s = sp.toString()
    return s ? `?${s}` : ''
  }, [onlyAvailable])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(
        token,
        `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/drivers${query}`,
        { method: 'GET' }
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message ?? 'Failed to load drivers')

      setDrivers(data.drivers ?? [])
    } catch (e) {
      setError(e?.message ?? 'Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const canMutate = role === 'Fleet Manager' || role === 'Safety Officer'

  useEffect(() => {
    if (!canMutate) return

    async function onRequestDelete(e) {
      const { id } = e.detail
      setError(null)
      try {
        const res = await authFetch(
          token,
          `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/drivers/${id}`,
          { method: 'DELETE' }
        )

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.message ?? 'Failed to delete driver')
        }

        await load()
      } catch (err) {
        setError(err?.message ?? 'Failed to delete driver')
      }
    }

    window.addEventListener('drivers:request-delete', onRequestDelete)
    return () => window.removeEventListener('drivers:request-delete', onRequestDelete)
  }, [canMutate, authFetch, token, load])

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Drivers</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <span>Only Available</span>
            <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} />
          </label>
          {canMutate ? (
            <Link to="/drivers/add" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>
              Add Driver
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div> : null}

      <div style={{ marginTop: 16 }}>
        <DriverTable drivers={drivers} canMutate={canMutate} onRefresh={load} />
      </div>
    </div>
  )
}


