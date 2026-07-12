import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import VehicleTable from '../components/vehicles/VehicleTable'

export default function Vehicles() {
  const { token, role, authFetch } = useAuth()

  const [vehicles, setVehicles] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    const sp = new URLSearchParams()
    if (statusFilter) sp.set('status', statusFilter)
    const s = sp.toString()
    return s ? `?${s}` : ''
  }, [statusFilter])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(
        token,
        `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/vehicles${query}`,
        { method: 'GET' }
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message ?? 'Failed to load vehicles')

      setVehicles(data.vehicles ?? [])
    } catch (e) {
      setError(e?.message ?? 'Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const canMutate = role === 'Fleet Manager'

  useEffect(() => {
    if (!canMutate) return

    async function onRequestDelete(e) {
      const { id } = e.detail
      setError(null)
      try {
        const res = await authFetch(
          token,
          `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/vehicles/${id}`,
          { method: 'DELETE' }
        )

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.message ?? 'Failed to delete vehicle')
        }

        await load()
      } catch (err) {
        setError(err?.message ?? 'Failed to delete vehicle')
      }
    }

    window.addEventListener('vehicles:request-delete', onRequestDelete)
    return () => window.removeEventListener('vehicles:request-delete', onRequestDelete)
  }, [canMutate, authFetch, token, load])


  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Vehicles</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
            <span>Status</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </label>
          {canMutate ? (
            <Link to="/vehicles/add" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>
              Add Vehicle
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? <div>Loading…</div> : null}
      {error ? <div style={{ color: 'crimson', marginTop: 10 }}>{error}</div> : null}

      <div style={{ marginTop: 16 }}>
        <VehicleTable
          vehicles={vehicles}
          canMutate={canMutate}
          onRefresh={load}
        />
      </div>
    </div>
  )
}


