import React, { useEffect, useMemo, useState } from 'react'

import { authFetch, useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function Trips() {
  const { token } = useAuth()
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: ''
  })

  const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'Available'), [vehicles])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch(`${API_BASE}/api/trips`),
        authFetch(token, `${API_BASE}/api/vehicles`),
        authFetch(token, `${API_BASE}/api/drivers?available=true`)
      ])

      if (!tripsRes.ok) throw new Error('Failed to load trips')
      if (!vehiclesRes.ok) throw new Error('Failed to load vehicles')
      if (!driversRes.ok) throw new Error('Failed to load drivers')

      const tripsData = await tripsRes.json()
      const vehiclesData = await vehiclesRes.json()
      const driversData = await driversRes.json()

      setTrips(Array.isArray(tripsData) ? tripsData : tripsData.trips ?? [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles ?? [])
      setDrivers(Array.isArray(driversData) ? driversData : driversData.drivers ?? [])
    } catch (err) {
      setError(err?.message ?? 'Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createTrip(e) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`${API_BASE}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.message ?? 'Failed to create trip')
      return
    }
    setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' })
    await load()
  }

  async function updateTrip(id, action, body) {
    setError(null)
    const res = await fetch(`${API_BASE}/api/trips/${id}/${action}`, {
      method: 'PUT',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.message ?? `Failed to ${action} trip`)
      return
    }
    await load()
  }

  async function completeTrip(id) {
    const finalOdometer = window.prompt('Final odometer')
    if (!finalOdometer) return
    const fuelConsumed = window.prompt('Fuel consumed')
    if (!fuelConsumed) return
    await updateTrip(id, 'complete', { final_odometer: finalOdometer, fuel_consumed: fuelConsumed })
  }

  return (
    <div>
      <h1>Trips</h1>
      {error ? <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div> : null}

      <form onSubmit={createTrip} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))', gap: 8, marginBottom: 18 }}>
        <input placeholder="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} required />
        <input placeholder="Destination" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required />
        <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
          <option value="">Vehicle</option>
          {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
        </select>
        <select value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} required>
          <option value="">Driver</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input placeholder="Cargo kg" type="number" value={form.cargo_weight} onChange={e => setForm({ ...form, cargo_weight: e.target.value })} required />
        <input placeholder="Distance km" type="number" value={form.planned_distance} onChange={e => setForm({ ...form, planned_distance: e.target.value })} required />
        <button type="submit">Create Trip</button>
      </form>

      {loading ? <div>Loading...</div> : null}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Route</th>
            <th align="left">Vehicle</th>
            <th align="left">Driver</th>
            <th align="left">Status</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map(t => (
            <tr key={t.id}>
              <td>{t.source} {'->'} {t.destination}</td>
              <td>{t.vehicle_registration ?? t.vehicle_id}</td>
              <td>{t.driver_name ?? t.driver_id}</td>
              <td>{t.status}</td>
              <td>
                {t.status === 'Draft' ? <button onClick={() => updateTrip(t.id, 'dispatch')}>Dispatch</button> : null}
                {t.status === 'Dispatched' ? <button onClick={() => completeTrip(t.id)}>Complete</button> : null}
                {t.status === 'Dispatched' ? <button onClick={() => updateTrip(t.id, 'cancel')}>Cancel</button> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
