import React, { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:3001/api'

export default function App() {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('transitops_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Active View Tab: 'trips' | 'maintenance'
  const [activeTab, setActiveTab] = useState('trips')

  // Platform Data State
  const [trips, setTrips] = useState([])
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  
  // Loading & Action States
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

  // Form State - Log Maintenance
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle_id: '',
    type: 'Oil Change',
    date: new Date().toISOString().split('T')[0],
    cost: ''
  })

  // Modal State - Complete Trip
  const [completingTrip, setCompletingTrip] = useState(null)
  const [completionForm, setCompletionForm] = useState({
    final_odometer: '',
    fuel_consumed: ''
  })

  // Save/Remove user session
  const loginUser = (userData) => {
    setUser(userData)
    localStorage.setItem('transitops_user', JSON.stringify(userData))
  }

  const logoutUser = () => {
    setUser(null)
    localStorage.removeItem('transitops_user')
    setTrips([])
    setMaintenanceLogs([])
    setVehicles([])
    setDrivers([])
  }

  // Fetch all dashboard data
  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)
      setErrorMsg(null)

      // 1. Fetch Trips
      const tripsRes = await fetch(`${API_BASE}/trips`)
      if (!tripsRes.ok) throw new Error('Failed to fetch trips log')
      const tripsData = await tripsRes.json()
      setTrips(tripsData)

      // 2. Fetch Maintenance Logs
      const maintenanceRes = await fetch(`${API_BASE}/maintenance`)
      if (!maintenanceRes.ok) throw new Error('Failed to fetch maintenance logs')
      const maintenanceData = await maintenanceRes.json()
      setMaintenanceLogs(maintenanceData)

      // 3. Fetch Available Vehicles
      const vehiclesRes = await fetch(`${API_BASE}/vehicles?status=Available`)
      if (!vehiclesRes.ok) throw new Error('Failed to fetch available vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData)

      // 4. Fetch Available Drivers
      const driversRes = await fetch(`${API_BASE}/drivers?available=true`)
      if (!driversRes.ok) throw new Error('Failed to fetch available drivers')
      const driversData = await driversRes.json()
      setDrivers(driversData)

    } catch (err) {
      setErrorMsg(err.message || 'Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  // Reload data on user login or tab switch
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // Clear success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoginLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }

      loginUser({ token: data.token, ...data.user })
      setLoginEmail('')
      setLoginPassword('')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  // Quick Login Autofill Helper
  const handleQuickLogin = (email, password) => {
    setLoginEmail(email)
    setLoginPassword(password)
    // Small timeout to allow state updates before submitting via ref/event
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn')
      if (btn) btn.click()
    }, 100)
  }

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

  // Complete Trip Form
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

  // Handle Log Maintenance (Protected: Fleet Manager only)
  const handleCreateMaintenance = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (user.role !== 'Fleet Manager') {
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
      const res = await fetch(`${API_BASE}/maintenance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
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

  // Handle Close Maintenance (Protected: Fleet Manager only)
  const handleCloseMaintenance = async (logId) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setActionLoading(logId)

    if (user.role !== 'Fleet Manager') {
      setErrorMsg('Forbidden: Only Fleet Managers can close maintenance records')
      setActionLoading(null)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/maintenance/${logId}/close`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${user.token}`
        }
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

  // Calculate metrics for stats cards
  const stats = {
    tripsTotal: trips.length,
    tripsDispatched: trips.filter(t => t.status === 'Dispatched').length,
    tripsCompleted: trips.filter(t => t.status === 'Completed').length,
    maintActive: maintenanceLogs.filter(m => m.is_active).length,
    maintTotal: maintenanceLogs.length,
    maintTotalCost: maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0)
  }

  // Render Login Card if not authenticated
  if (!user) {
    return (
      <div className="app-container">
        <header>
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">T</div>
              Transit<span>Ops</span>
            </div>
          </div>
        </header>
        <div className="login-overlay">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome to TransitOps</h2>
              <p>Sign in with your hackathon development account</p>
            </div>
            
            {errorMsg && (
              <div className="alert-banner">
                <div>{errorMsg}</div>
                <button className="alert-banner-close" onClick={() => setErrorMsg(null)}>&times;</button>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. manager@transitops.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="quick-login-grid">
              <button
                type="button"
                className="quick-login-btn"
                onClick={() => handleQuickLogin('manager@transitops.com', 'manager123')}
              >
                🔑 Fleet Manager
                <span>manager@transitops.com</span>
              </button>
              <button
                type="button"
                className="quick-login-btn"
                onClick={() => handleQuickLogin('driver@transitops.com', 'driver123')}
              >
                🚚 Driver
                <span>driver@transitops.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Dashboard Workspace
  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">T</div>
            Transit<span>Ops</span>
          </div>
          <nav>
            <button
              className={`nav-link ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => { setActiveTab('trips'); setErrorMsg(null); }}
            >
              Trips & Dispatch
            </button>
            <button
              className={`nav-link ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => { setActiveTab('maintenance'); setErrorMsg(null); }}
            >
              Maintenance Log
            </button>
            <div className="user-indicator">
              <span>{user.name}</span>
              <span className="user-badge">{user.role}</span>
            </div>
            <button className="nav-link" onClick={logoutUser} style={{ color: 'var(--error)' }}>
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {/* Error / Success Notifications */}
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

        {/* Dynamic Metric Counter Ribbon */}
        <section className="dashboard-grid">
          {activeTab === 'trips' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="stat-card total" style={{ borderLeft: '4px solid var(--accent)' }}>
                <span className="stat-label">Maintenance Records</span>
                <span className="stat-value">{stats.maintTotal}</span>
              </div>
              <div className="stat-card dispatched" style={{ borderLeft: '4px solid var(--warning)' }}>
                <span className="stat-label">Active In-Shop</span>
                <span className="stat-value">{stats.maintActive}</span>
              </div>
              <div className="stat-card completed" style={{ borderLeft: '4px solid var(--success)' }}>
                <span className="stat-label">Total Shop Expenses</span>
                <span className="stat-value">${stats.maintTotalCost.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span className="stat-label">Available Vehicles</span>
            <span className="stat-value">{vehicles.length}</span>
          </div>
        </section>

        {/* Tab 1: Trip Dispatch Layout */}
        {activeTab === 'trips' && (
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
        )}

        {/* Tab 2: Maintenance Layout */}
        {activeTab === 'maintenance' && (
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

              {user.role === 'Fleet Manager' ? (
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

                      {log.is_active && user.role === 'Fleet Manager' && (
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
        )}
      </main>

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
