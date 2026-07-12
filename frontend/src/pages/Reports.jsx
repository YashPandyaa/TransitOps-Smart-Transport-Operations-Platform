import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function Reports() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/reports/vehicles`)
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error(data?.message ?? 'Failed to load reports')
        setRows(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err?.message ?? 'Failed to load reports')
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1>Reports</h1>
      {error ? <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div> : null}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Vehicle</th>
            <th align="left">Status</th>
            <th align="left">Fuel Efficiency</th>
            <th align="left">Utilization</th>
            <th align="left">Operational Cost</th>
            <th align="left">ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.vehicle_id}>
              <td>{row.registration_number} - {row.name_model}</td>
              <td>{row.status}</td>
              <td>{row.fuel_efficiency_km_per_l ?? 'n/a'}</td>
              <td>{row.fleet_utilization_pct}%</td>
              <td>{row.operational_cost}</td>
              <td>{row.roi_pct ?? 'n/a'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
