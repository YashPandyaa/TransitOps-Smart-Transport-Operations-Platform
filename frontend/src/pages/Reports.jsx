import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api'

export default function Reports() {
  const { user } = useAuth()

  // State
  const [reportsData, setReportsData] = useState([])
  const [allVehicles, setAllVehicles] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchReports = async () => {
    try {
      setReportsLoading(true)
      setErrorMsg(null)
      const res = await fetch(`${API_BASE}/reports/vehicles`)
      if (!res.ok) throw new Error('Failed to fetch analytics data')
      const data = await res.json()
      setReportsData(data)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setReportsLoading(false)
    }
  }

  const fetchAllVehicles = async () => {
    try {
      const allVehiclesRes = await fetch(`${API_BASE}/vehicles`)
      if (allVehiclesRes.ok) {
        const allVehiclesData = await allVehiclesRes.json()
        setAllVehicles(Array.isArray(allVehiclesData) ? allVehiclesData : (allVehiclesData.vehicles || []))
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchReports()
    fetchAllVehicles()
  }, [])

  // Clear success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // CSV Export
  const handleExportCSV = () => {
    if (reportsData.length === 0) return
    const headers = [
      'Registration', 'Vehicle Model', 'Type', 'Status',
      'Trips Completed', 'Total Distance (km)',
      'Fuel Efficiency (km/L)', 'Fleet Utilization (%)',
      'Fuel Cost ($)', 'Maintenance Cost ($)', 'Other Expenses ($)', 'Operational Cost ($)',
      'Revenue ($)', 'ROI (%)', 'Acquisition Cost ($)'
    ]
    const rows = reportsData.map(r => [
      r.registration_number,
      `"${r.name_model}"`,
      r.type,
      r.status,
      r.trips_completed,
      r.total_distance_km,
      r.fuel_efficiency_km_per_l !== null ? r.fuel_efficiency_km_per_l : 'N/A',
      r.fleet_utilization_pct,
      r.fuel_cost.toFixed(2),
      r.maintenance_cost.toFixed(2),
      r.other_expense_cost.toFixed(2),
      r.operational_cost.toFixed(2),
      r.revenue.toFixed(2),
      r.roi_pct !== null ? r.roi_pct.toFixed(2) : 'N/A',
      r.acquisition_cost.toFixed(2)
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `transitops_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <h1>Reports & Analytics</h1>

      {/* Notifications */}
      {errorMsg && (
        <div className="alert-banner" style={{ marginBottom: '1.5rem' }}>
          <div><strong>Error:</strong> {errorMsg}</div>
          <button className="alert-banner-close" onClick={() => setErrorMsg(null)}>&times;</button>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner" style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', marginBottom: '1.5rem' }}>
          <div><strong>Success:</strong> {successMsg}</div>
          <button className="alert-banner-close" style={{ color: '#a7f3d0' }} onClick={() => setSuccessMsg(null)}>&times;</button>
        </div>
      )}

      {/* Metric Counters Ribbon */}
      <section className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card total" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="stat-label">Vehicles Analysed</span>
          <span className="stat-value">{reportsData.length}</span>
        </div>
        <div className="stat-card dispatched" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-label">Fleet Utilization</span>
          <span className="stat-value">{reportsData[0]?.fleet_utilization_pct ?? '—'}%</span>
        </div>
        <div className="stat-card completed" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Total Fleet Revenue</span>
          <span className="stat-value">${reportsData.reduce((s, r) => s + r.revenue, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Fleet Vehicles</span>
          <span className="stat-value">{allVehicles.length}</span>
        </div>
      </section>

      <div className="workspace-layout">
        <section className="panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Fleet Analytics Report
            </h2>
            <button id="reports-export-csv" className="btn btn-primary" onClick={handleExportCSV} disabled={reportsLoading || reportsData.length === 0}>
              ⬇ Export CSV
            </button>
          </div>

          {reportsLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Generating analytics...</p>
            </div>
          ) : reportsData.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No vehicle data available</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Add vehicles and complete trips to generate analytics.
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Trips</th>
                      <th style={{ textAlign: 'right' }}>Dist (km)</th>
                      <th style={{ textAlign: 'right' }}>⛽ Efficiency</th>
                      <th style={{ textAlign: 'right' }}>Fuel Cost</th>
                      <th style={{ textAlign: 'right' }}>Maint. Cost</th>
                      <th style={{ textAlign: 'right' }}>Op. Cost</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'right' }}>ROI</th>
                      <th style={{ textAlign: 'center' }}>Fleet Util.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsData.map(r => {
                      const roiColor = r.roi_pct === null
                        ? 'var(--text-muted)'
                        : r.roi_pct >= 0 ? 'var(--success)' : 'var(--error)'
                      const statusClass = {
                        'Available': 'badge-completed',
                        'On Trip': 'badge-dispatched',
                        'In Shop': 'badge-draft',
                        'Retired': 'badge-cancelled'
                      }[r.status] || 'badge-draft'
                      return (
                        <tr key={r.vehicle_id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name_model}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {r.registration_number} &middot; {r.type}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${statusClass}`}>{r.status}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.trips_completed}</td>
                          <td style={{ textAlign: 'right' }}>{r.total_distance_km.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            {r.fuel_efficiency_km_per_l !== null
                              ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                  {r.fuel_efficiency_km_per_l.toFixed(2)} km/L
                                </span>
                              : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No trip data</span>
                            }
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                            ${r.fuel_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                            ${r.maintenance_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>
                              ${r.operational_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: r.revenue > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                              ${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: roiColor, fontSize: '0.95rem' }}>
                              {r.roi_pct !== null
                                ? `${r.roi_pct > 0 ? '+' : ''}${r.roi_pct.toFixed(1)}%`
                                : '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              background: 'rgba(6,182,212,0.12)',
                              color: 'var(--accent)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}>
                              {r.fleet_utilization_pct}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Methodology footnote */}
              <div style={{
                marginTop: '1.5rem',
                padding: '0.9rem 1.25rem',
                background: 'rgba(79,70,229,0.06)',
                borderRadius: '10px',
                border: '1px solid rgba(79,70,229,0.18)',
                fontSize: '0.79rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7
              }}>
                <strong style={{ color: 'var(--text-secondary)' }}>📐 Methodology — </strong>
                <strong>Fuel Efficiency</strong>: Σ planned_distance / Σ fuel_consumed (Completed trips only)&nbsp;&middot;&nbsp;
                <strong>Revenue</strong>: Σ planned_distance × $2 flat rate/km&nbsp;&middot;&nbsp;
                <strong>ROI</strong>: (Revenue − Fuel − Maintenance) / Acquisition Cost × 100&nbsp;&middot;&nbsp;
                <strong>Fleet Utilization</strong>: On Trip / non-Retired vehicles × 100 (fleet-wide)
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
