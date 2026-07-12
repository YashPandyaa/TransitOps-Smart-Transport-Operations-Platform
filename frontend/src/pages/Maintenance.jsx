import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api'

export default function Maintenance() {
  const { token, user, authFetch } = useAuth()

  // State
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [vehicles, setVehicles] = useState([]) // Available only
  const [allVehicles, setAllVehicles] = useState([]) // All vehicles
  
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Form State - Log Maintenance
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle_id: '',
    type: 'Oil Change',
    date: new Date().toISOString().split('T')[0],
    cost: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // Fetch Maintenance Logs
      const maintenanceRes = await fetch(`${API_BASE}/maintenance`)
      if (!maintenanceRes.ok) throw new Error('Failed to fetch maintenance logs')
      const maintenanceData = await maintenanceRes.json()
      setMaintenanceLogs(maintenanceData)

      // Fetch Available Vehicles
      const vehiclesRes = await fetch(`${API_BASE}/vehicles?status=Available`)
      if (!vehiclesRes.ok) throw new Error('Failed to fetch available vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData.vehicles || []))

      // Fetch All Vehicles
      const allVehiclesRes = await fetch(`${API_BASE}/vehicles`)
      if (allVehiclesRes.ok) {
        const allVehiclesData = await allVehiclesRes.json()
        setAllVehicles(Array.isArray(allVehiclesData) ? allVehiclesData : (allVehiclesData.vehicles || []))
      }

    } catch (err) {
      setErrorMsg(err.message || 'Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Clear success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Handle Log Maintenance
  const handleCreateMaintenance = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (user?.role !== 'Fleet Manager') {
      setErrorMsg('Forbidden: Only Fleet Managers can log maintenance')
      return
    }

    const payload = {
      vehicle_id: parseInt(maintenanceForm.vehicle_id, 10),
      type: maintenanceForm.type,
      date: maintenanceForm.date,
      cost: parseFloat(maintenanceForm.cost)
    }

    try {
      const res = await authFetch(token, `${API_BASE}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to log maintenance record')
      }

      setSuccessMsg(`Vehicle put in maintenance. Status updated to In Shop.`)
      setMaintenanceForm({
        vehicle_id: '',
        type: 'Oil Change',
        date: new Date().toISOString().split('T')[0],
        cost: ''
      })
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Handle Close Maintenance
  const handleCloseMaintenance = async (logId) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setActionLoading(logId)

    if (user?.role !== 'Fleet Manager') {
      setErrorMsg('Forbidden: Only Fleet Managers can close maintenance records')
      setActionLoading(null)
      return
    }

    try {
      const res = await authFetch(token, `${API_BASE}/maintenance/${logId}/close`, {
        method: 'PUT'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to close maintenance record')
      }

      setSuccessMsg('Maintenance complete. Vehicle is now Available.')
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Calculate metrics
  const stats = {
    maintActive: maintenanceLogs.filter(m => m.is_active).length,
    maintTotal: maintenanceLogs.length,
    financeTotalMaint: maintenanceLogs.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <h1>Maintenance Log</h1>

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
          <span className="stat-label">Maintenance Records</span>
          <span className="stat-value">{stats.maintTotal}</span>
        </div>
        <div className="stat-card dispatched" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-label">Active In-Shop</span>
          <span className="stat-value">{stats.maintActive}</span>
        </div>
        <div className="stat-card completed" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Shop Expenses</span>
          <span className="stat-value">${stats.financeTotalMaint.toLocaleString()}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Fleet Vehicles</span>
          <span className="stat-value">{allVehicles.length}</span>
        </div>
      </section>

      <div className="workspace-layout">
        {/* Create Maintenance Record (Protected: Fleet Manager only) */}
        <section className="panel">
          <h2 className="panel-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Log Maintenance
          </h2>

          {user?.role === 'Fleet Manager' ? (
            <form onSubmit={handleCreateMaintenance}>
              <div className="form-group">
                <label className="form-label">Select Vehicle (Available Only)</label>
                <select
                  className="form-select"
                  value={maintenanceForm.vehicle_id}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, vehicle_id: e.target.value })}
                  required
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name_model} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maintenance Category</label>
                <select
                  className="form-select"
                  value={maintenanceForm.type}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                  required
                >
                  <option value="Oil Change">Oil Change</option>
                  <option value="Brake Replacement">Brake Replacement</option>
                  <option value="Engine Tuning">Engine Tuning</option>
                  <option value="Tire Rotation">Tire Rotation</option>
                  <option value="General Inspection">General Inspection</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Service Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={maintenanceForm.date}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maintenance Cost ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 350"
                    min="0"
                    value={maintenanceForm.cost}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Send Vehicle In Shop
              </button>
            </form>
          ) : (
            <div className="empty-state" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
              <p style={{ color: 'var(--error)', fontWeight: 600 }}>Authorization Required</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Only users with the **Fleet Manager** role can log maintenance records and put vehicles In Shop.
              </p>
            </div>
          )}
        </section>

        {/* Maintenance Logs List */}
        <section className="panel">
          <h2 className="panel-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Maintenance logs & Shop History
          </h2>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Syncing maintenance log...</p>
            </div>
          ) : maintenanceLogs.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No shop history registered</p>
            </div>
          ) : (
            <div className="trips-container">
              {maintenanceLogs.map(log => (
                <div key={log.id} className="trip-card">
                  <div className="trip-card-header">
                    <span className="trip-route" style={{ fontSize: '1.05rem' }}>
                      🛠️ {log.type}
                    </span>
                    <span className={`badge ${log.is_active ? 'badge-active' : 'badge-completed'}`}>
                      {log.is_active ? 'In Shop (Active)' : 'Closed'}
                    </span>
                  </div>

                  <div className="trip-card-body" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Vehicle</span>
                      <span className="trip-meta-value">{log.vehicle_model} ({log.vehicle_registration})</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Service Date</span>
                      <span className="trip-meta-value">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Logged Expense</span>
                      <span className="trip-meta-value">${parseFloat(log.cost).toLocaleString()}</span>
                    </div>
                  </div>

                  {log.is_active && user?.role === 'Fleet Manager' && (
                    <div className="trip-card-actions">
                      <button
                        className="btn btn-success btn-action-sm"
                        disabled={actionLoading === log.id}
                        onClick={() => handleCloseMaintenance(log.id)}
                      >
                        {actionLoading === log.id && <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></div>}
                        Close Maintenance (Set Available)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
