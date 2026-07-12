import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api'

export default function Trips() {
  const { user } = useAuth()

  // State
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([]) // Available only
  const [allVehicles, setAllVehicles] = useState([]) // All vehicles for stats
  const [drivers, setDrivers] = useState([]) // Available only
  
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Form State - Create Trip
  const [tripForm, setTripForm] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: ''
  })

  // Modal State - Complete Trip
  const [completingTrip, setCompletingTrip] = useState(null)
  const [completionForm, setCompletionForm] = useState({
    final_odometer: '',
    fuel_consumed: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // Fetch Trips
      const tripsRes = await fetch(`${API_BASE}/trips`)
      if (!tripsRes.ok) throw new Error('Failed to fetch trips log')
      const tripsData = await tripsRes.json()
      setTrips(tripsData)

      // Fetch Available Vehicles
      const vehiclesRes = await fetch(`${API_BASE}/vehicles?status=Available`)
      if (!vehiclesRes.ok) throw new Error('Failed to fetch available vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData.vehicles || []))

      // Fetch All Vehicles (for total fleet count)
      const allVehiclesRes = await fetch(`${API_BASE}/vehicles`)
      if (allVehiclesRes.ok) {
        const allVehiclesData = await allVehiclesRes.json()
        setAllVehicles(Array.isArray(allVehiclesData) ? allVehiclesData : (allVehiclesData.vehicles || []))
      }

      // Fetch Available Drivers
      const driversRes = await fetch(`${API_BASE}/drivers?available=true`)
      if (!driversRes.ok) throw new Error('Failed to fetch available drivers')
      const driversData = await driversRes.json()
      // Support both array and object response
      setDrivers(Array.isArray(driversData) ? driversData : (driversData.drivers || []))

    } catch (err) {
      setErrorMsg(err.message || 'Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Clear success messages after timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Handle Create Trip
  const handleCreateTrip = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const payload = {
      source: tripForm.source,
      destination: tripForm.destination,
      vehicle_id: parseInt(tripForm.vehicle_id, 10),
      driver_id: parseInt(tripForm.driver_id, 10),
      cargo_weight: parseFloat(tripForm.cargo_weight),
      planned_distance: parseFloat(tripForm.planned_distance)
    }

    try {
      const res = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create trip')
      }

      setSuccessMsg(`Draft trip successfully created!`)
      setTripForm({
        source: '',
        destination: '',
        vehicle_id: '',
        driver_id: '',
        cargo_weight: '',
        planned_distance: ''
      })
      fetchData()
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
        throw new Error(data.message || 'Dispatch failed')
      }

      setSuccessMsg('Trip dispatched! Vehicle and Driver status updated to On Trip.')
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
        throw new Error(data.message || 'Cancellation failed')
      }

      setSuccessMsg('Trip cancelled. Vehicle and Driver released.')
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Complete Trip Modal Control
  const openCompletionModal = (trip) => {
    setErrorMsg(null)
    setCompletingTrip(trip)
    setCompletionForm({ final_odometer: '', fuel_consumed: '' })
  }

  const handleCompleteSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`${API_BASE}/trips/${completingTrip.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_odometer: parseFloat(completionForm.final_odometer),
          fuel_consumed: parseFloat(completionForm.fuel_consumed)
        })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Completion failed')
      }

      setSuccessMsg('Trip completed. Vehicle and Driver released.')
      setCompletingTrip(null)
      fetchData()
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Calculate metrics for stats cards
  const stats = {
    tripsTotal: trips.length,
    tripsDispatched: trips.filter(t => t.status === 'Dispatched').length,
    tripsCompleted: trips.filter(t => t.status === 'Completed').length,
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <h1>Trips & Dispatch</h1>

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
        <div className="stat-card total">
          <span className="stat-label">Total Logged Trips</span>
          <span className="stat-value">{stats.tripsTotal}</span>
        </div>
        <div className="stat-card dispatched">
          <span className="stat-label">Active / Dispatched</span>
          <span className="stat-value">{stats.tripsDispatched}</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-label">Completed Trips</span>
          <span className="stat-value">{stats.tripsCompleted}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Fleet Vehicles</span>
          <span className="stat-value">{allVehicles.length}</span>
        </div>
      </section>

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
                value={tripForm.source}
                onChange={e => setTripForm({ ...tripForm, source: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Destination Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Port Terminal B"
                value={tripForm.destination}
                onChange={e => setTripForm({ ...tripForm, destination: e.target.value })}
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
                  value={tripForm.cargo_weight}
                  onChange={e => setTripForm({ ...tripForm, cargo_weight: e.target.value })}
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
                  value={tripForm.planned_distance}
                  onChange={e => setTripForm({ ...tripForm, planned_distance: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Vehicle (Available Only)</label>
              <select
                className="form-select"
                value={tripForm.vehicle_id}
                onChange={e => setTripForm({ ...tripForm, vehicle_id: e.target.value })}
                required
              >
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name_model} ({v.registration_number}) - Max Load: {parseFloat(v.max_load_capacity)}kg
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Driver (Available Only)</label>
              <select
                className="form-select"
                value={tripForm.driver_id}
                onChange={e => setTripForm({ ...tripForm, driver_id: e.target.value })}
                required
              >
                <option value="">Select a driver...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} (License: {d.license_category})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Create Draft Trip
            </button>
          </form>
        </section>

        {/* Trip List */}
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
              <p>Syncing log records...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No operations logged yet</p>
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
                      <span className="trip-meta-value">{trip.vehicle_model} ({trip.vehicle_registration})</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Assigned Driver</span>
                      <span className="trip-meta-value">{trip.driver_name}</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Cargo Weight</span>
                      <span className="trip-meta-value">{trip.cargo_weight.toLocaleString()} kg</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Distance</span>
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
                          <span className="trip-meta-value">{trip.fuel_consumed} L</span>
                        </div>
                      </>
                    )}
                  </div>

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

      {/* Modal Dialog: Complete Trip */}
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
