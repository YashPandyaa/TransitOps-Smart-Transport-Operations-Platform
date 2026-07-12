import React, { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3001/api'

export default function App() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  
  // Loading & Error States
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // ID of trip being acted upon
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Form State for Create Trip
  const [form, setForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: ''
  })

  // Modal State for Complete Trip
  const [completingTrip, setCompletingTrip] = useState(null) // Holds trip object
  const [completionForm, setCompletionForm] = useState({
    final_odometer: '',
    fuel_consumed: ''
  })

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // Fetch trips
      const tripsRes = await fetch(`${API_BASE}/trips`)
      if (!tripsRes.ok) throw new Error('Failed to fetch trips')
      const tripsData = await tripsRes.json()
      setTrips(tripsData)

      // Fetch available vehicles
      const vehiclesRes = await fetch(`${API_BASE}/vehicles?status=Available`)
      if (!vehiclesRes.ok) throw new Error('Failed to fetch vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData)

      // Fetch available drivers
      const driversRes = await fetch(`${API_BASE}/drivers?available=true`)
      if (!driversRes.ok) throw new Error('Failed to fetch drivers')
      const driversData = await driversRes.json()
      setDrivers(driversData)

    } catch (err) {
      setErrorMsg(err.message || 'Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Handle Create Trip Submit
  const handleCreateTrip = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Form validation
    if (!form.source || !form.destination || !form.vehicle_id || !form.driver_id || !form.cargo_weight || !form.planned_distance) {
      setErrorMsg('Please fill in all fields.')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: form.source,
          destination: form.destination,
          vehicle_id: parseInt(form.vehicle_id, 10),
          driver_id: parseInt(form.driver_id, 10),
          cargo_weight: parseFloat(form.cargo_weight),
          planned_distance: parseFloat(form.planned_distance)
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create trip')
      }

      setSuccessMsg(`Draft trip created from ${form.source} to ${form.destination}!`)
      setForm({
        source: '',
        destination: '',
        vehicle_id: '',
        driver_id: '',
        cargo_weight: '',
        planned_distance: ''
      })
      fetchData() // Refresh list and dropdowns
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Handle Dispatch Trip
  const handleDispatch = async (tripId) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setActionLoading(tripId)

    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/dispatch`, {
        method: 'PUT'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to dispatch trip')
      }

      setSuccessMsg('Trip successfully dispatched!')
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Cancel Trip
  const handleCancel = async (tripId) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setActionLoading(tripId)

    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/cancel`, {
        method: 'PUT'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel trip')
      }

      setSuccessMsg('Trip successfully cancelled.')
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Open completion modal
  const openCompletionModal = (trip) => {
    setErrorMsg(null)
    setCompletingTrip(trip)
    // Prefill final odometer with current odometer
    setCompletionForm({
      final_odometer: '',
      fuel_consumed: ''
    })
  }

  // Handle Complete Trip Submit
  const handleCompleteSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!completionForm.final_odometer || !completionForm.fuel_consumed) {
      setErrorMsg('Odometer and fuel fields are required')
      return
    }

    const tripId = completingTrip.id
    try {
      const res = await fetch(`${API_BASE}/trips/${tripId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_odometer: parseFloat(completionForm.final_odometer),
          fuel_consumed: parseFloat(completionForm.fuel_consumed)
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to complete trip')
      }

      setSuccessMsg('Trip successfully completed!')
      setCompletingTrip(null)
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Calculate stats for Dashboard
  const stats = {
    total: trips.length,
    draft: trips.filter(t => t.status === 'Draft').length,
    dispatched: trips.filter(t => t.status === 'Dispatched').length,
    completed: trips.filter(t => t.status === 'Completed').length,
    cancelled: trips.filter(t => t.status === 'Cancelled').length,
    totalDistance: trips
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + (t.planned_distance || 0), 0)
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">T</div>
            Transit<span>Ops</span>
          </div>
          <nav>
            <a href="#dashboard" className="nav-link active">Trip Management</a>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Error and Success Banners */}
        {errorMsg && (
          <div className="alert-banner">
            <div>
              <strong>Error:</strong> {errorMsg}
            </div>
            <button className="alert-banner-close" onClick={() => setErrorMsg(null)}>&times;</button>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner" style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0' }}>
            <div>
              <strong>Success:</strong> {successMsg}
            </div>
            <button className="alert-banner-close" style={{ color: '#a7f3d0' }} onClick={() => setSuccessMsg(null)}>&times;</button>
          </div>
        )}

        {/* Dashboard Stat Counter Grid */}
        <section className="dashboard-grid">
          <div className="stat-card total">
            <span className="stat-label">Total Trips</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card dispatched">
            <span className="stat-label">Active / Dispatched</span>
            <span className="stat-value">{stats.dispatched}</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-label">Completed Trips</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
          <div className="stat-card cancelled">
            <span className="stat-label">Cancelled</span>
            <span className="stat-value">{stats.cancelled}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <span className="stat-label">Delivered Distance</span>
            <span className="stat-value">{stats.totalDistance.toFixed(0)} km</span>
          </div>
        </section>

        {/* Workspace Layout */}
        <div className="workspace-layout">
          {/* Create Trip Form */}
          <section className="panel">
            <h2 className="panel-title">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create New Trip
            </h2>
            <form onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label className="form-label">Source Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Warehouse A"
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Port Terminal B"
                  value={form.destination}
                  onChange={e => setForm({ ...form, destination: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5000"
                    min="1"
                    value={form.cargo_weight}
                    onChange={e => setForm({ ...form, cargo_weight: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Planned Distance (km)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 240"
                    min="1"
                    value={form.planned_distance}
                    onChange={e => setForm({ ...form, planned_distance: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Vehicle (Available Only)</label>
                <select
                  className="form-select"
                  value={form.vehicle_id}
                  onChange={e => setForm({ ...form, vehicle_id: e.target.value })}
                  required
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name_model} ({v.registration_number}) - Max Load: {parseFloat(v.max_load_capacity)}kg
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && !loading && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
                    No available vehicles in the database.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Assign Driver (Available Only)</label>
                <select
                  className="form-select"
                  value={form.driver_id}
                  onChange={e => setForm({ ...form, driver_id: e.target.value })}
                  required
                >
                  <option value="">Select a driver...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (License: {d.license_category})
                    </option>
                  ))}
                </select>
                {drivers.length === 0 && !loading && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
                    No available drivers with valid licenses.
                  </p>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Create Draft Trip
              </button>
            </form>
          </section>

          {/* Trip List View */}
          <section className="panel">
            <h2 className="panel-title">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Operations & Trip Log
            </h2>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Retrieving platform data...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No operations logged yet</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Assign an available vehicle and driver to log the first transport trip.
                </p>
              </div>
            ) : (
              <div className="trips-container">
                {trips.map(trip => (
                  <div key={trip.id} className="trip-card">
                    <div className="trip-card-header">
                      <span className="trip-route">
                        {trip.source}
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        {trip.destination}
                      </span>
                      <span className={`badge badge-${trip.status.toLowerCase()}`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="trip-card-body">
                      <div className="trip-meta-item">
                        <span className="trip-meta-label">Vehicle</span>
                        <span className="trip-meta-value">{trip.vehicle_model || 'Unknown'} ({trip.vehicle_registration || 'N/A'})</span>
                      </div>
                      <div className="trip-meta-item">
                        <span className="trip-meta-label">Assigned Driver</span>
                        <span className="trip-meta-value">{trip.driver_name || 'Unassigned'}</span>
                      </div>
                      <div className="trip-meta-item">
                        <span className="trip-meta-label">Cargo Weight</span>
                        <span className="trip-meta-value">{trip.cargo_weight.toLocaleString()} kg</span>
                      </div>
                      <div className="trip-meta-item">
                        <span className="trip-meta-label">Planned Distance</span>
                        <span className="trip-meta-value">{trip.planned_distance} km</span>
                      </div>

                      {trip.status === 'Completed' && (
                        <>
                          <div className="trip-meta-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '0.5rem' }}>
                            <span className="trip-meta-label">Odometer (Final)</span>
                            <span className="trip-meta-value">{trip.final_odometer} km</span>
                          </div>
                          <div className="trip-meta-item">
                            <span className="trip-meta-label">Fuel Consumed</span>
                            <span className="trip-meta-value">{trip.fuel_consumed} Liters</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    {trip.status !== 'Completed' && trip.status !== 'Cancelled' && (
                      <div className="trip-card-actions">
                        {trip.status === 'Draft' && (
                          <button
                            className="btn btn-primary btn-action-sm"
                            disabled={actionLoading === trip.id}
                            onClick={() => handleDispatch(trip.id)}
                          >
                            {actionLoading === trip.id && <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></div>}
                            Dispatch Trip
                          </button>
                        )}
                        {trip.status === 'Dispatched' && (
                          <>
                            <button
                              className="btn btn-danger btn-action-sm"
                              disabled={actionLoading === trip.id}
                              onClick={() => handleCancel(trip.id)}
                            >
                              {actionLoading === trip.id && <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></div>}
                              Cancel
                            </button>
                            <button
                              className="btn btn-success btn-action-sm"
                              disabled={actionLoading === trip.id}
                              onClick={() => openCompletionModal(trip)}
                            >
                              Complete Trip
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal Dialog for Completing Trip */}
      {completingTrip && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-header">Complete Operational Trip</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Finalize transport logs for vehicle of registration <strong>{completingTrip.vehicle_registration}</strong>.
            </p>
            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group">
                <label className="form-label">Final Odometer Reading (km)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Must exceed current vehicle odometer"
                  min="0"
                  value={completionForm.final_odometer}
                  onChange={e => setCompletionForm({ ...completionForm, final_odometer: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Liters of fuel used"
                  min="0"
                  step="0.1"
                  value={completionForm.fuel_consumed}
                  onChange={e => setCompletionForm({ ...completionForm, fuel_consumed: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCompletingTrip(null)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--success)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                  Submit Log & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
