import React, { useEffect, useState } from 'react'

import { authFetch, useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function Maintenance() {
  const { token, role } = useAuth()
  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    vehicle_id: '',
    type: 'Oil Change',
    date: new Date().toISOString().slice(0, 10),
    cost: ''
  })

  const canMutate = role === 'Fleet Manager'

  async function load() {
    setError(null)
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE}/api/maintenance`),
        authFetch(token, `${API_BASE}/api/vehicles`)
      ])
      if (!logsRes.ok) throw new Error('Failed to load maintenance logs')
      if (!vehiclesRes.ok) throw new Error('Failed to load vehicles')
      const logsData = await logsRes.json()
      const vehiclesData = await vehiclesRes.json()
      setLogs(Array.isArray(logsData) ? logsData : logsData.logs ?? [])
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles ?? [])
    } catch (err) {
      setError(err?.message ?? 'Failed to load maintenance')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createLog(e) {
    e.preventDefault()
    const res = await authFetch(token, `${API_BASE}/api/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.message ?? 'Failed to log maintenance')
      return
    }
    setForm({ vehicle_id: '', type: 'Oil Change', date: new Date().toISOString().slice(0, 10), cost: '' })
    await load()
  }

  async function closeLog(id) {
    const res = await authFetch(token, `${API_BASE}/api/maintenance/${id}/close`, { method: 'PUT' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.message ?? 'Failed to close maintenance')
      return
    }
    await load()
  }

  return (
    <div>
      <h1>Maintenance</h1>
      {error ? <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div> : null}

      {canMutate ? (
        <form onSubmit={createLog} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 8, marginBottom: 18 }}>
          <select value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
            <option value="">Vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
          </select>
          <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required />
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          <input placeholder="Cost" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required />
          <button type="submit">Log Maintenance</button>
        </form>
      ) : null}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Vehicle</th>
            <th align="left">Type</th>
            <th align="left">Date</th>
            <th align="left">Cost</th>
            <th align="left">Status</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.vehicle_registration ?? log.vehicle_id}</td>
              <td>{log.type}</td>
              <td>{String(log.date).slice(0, 10)}</td>
              <td>{log.cost}</td>
              <td>{log.is_active ? 'Active' : 'Closed'}</td>
              <td>{canMutate && log.is_active ? <button onClick={() => closeLog(log.id)}>Close</button> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
