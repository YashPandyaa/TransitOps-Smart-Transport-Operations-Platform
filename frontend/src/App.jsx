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

  // Active View Tab: 'trips' | 'maintenance' | 'finance' | 'reports'
  const [activeTab, setActiveTab] = useState('trips')

  // Platform Data State
  const [trips, setTrips] = useState([])
  const [maintenanceLogs, setMaintenanceLogs] = useState([])
  const [vehicles, setVehicles] = useState([]) // Available only (for dispatch/maintenance creator)
  const [allVehicles, setAllVehicles] = useState([]) // All vehicles (for finance dropdowns)
  const [drivers, setDrivers] = useState([])
  
  // Finance Data State
  const [fuelLogs, setFuelLogs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedCostVehicleId, setSelectedCostVehicleId] = useState('')
  const [selectedCosts, setSelectedCosts] = useState(null)

  // Per-vehicle history (filtered by the selected vehicle in cost summary)
  const [vehicleFuelHistory, setVehicleFuelHistory] = useState([])
  const [vehicleExpenseHistory, setVehicleExpenseHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Reports & Analytics State
  const [reportsData, setReportsData] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)

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

  // Form State - Fuel Log
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Form State - Expense Log
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    category: 'Toll',
    amount: '',
    date: new Date().toISOString().split('T')[0]
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
    setAllVehicles([])
    setDrivers([])
    setFuelLogs([])
    setExpenses([])
    setSelectedCostVehicleId('')
    setSelectedCosts(null)
    setVehicleFuelHistory([])
    setVehicleExpenseHistory([])
    setReportsData([])
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

      // 4. Fetch All Vehicles
      const allVehiclesRes = await fetch(`${API_BASE}/vehicles`)
      if (!allVehiclesRes.ok) throw new Error('Failed to fetch fleet vehicles')
      const allVehiclesData = await allVehiclesRes.json()
      setAllVehicles(allVehiclesData)

      // 5. Fetch Available Drivers
      const driversRes = await fetch(`${API_BASE}/drivers?available=true`)
      if (!driversRes.ok) throw new Error('Failed to fetch available drivers')
      const driversData = await driversRes.json()
      setDrivers(driversData)

      // 6. Fetch Fuel Logs
      const fuelRes = await fetch(`${API_BASE}/fuel-logs`)
      if (fuelRes.ok) {
        const fuelData = await fuelRes.json()
        setFuelLogs(fuelData)
      }

      // 7. Fetch Expenses
      const expensesRes = await fetch(`${API_BASE}/expenses`)
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        setExpenses(expensesData)
      }

    } catch (err) {
      setErrorMsg(err.message || 'Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  // Fetch costs + per-vehicle history for selected vehicle
  const fetchVehicleCosts = async (vehicleId) => {
    if (!vehicleId) {
      setSelectedCosts(null)
      setVehicleFuelHistory([])
      setVehicleExpenseHistory([])
      return
    }
    try {
      setHistoryLoading(true)
      const [costsRes, fuelHistRes, expHistRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles/${vehicleId}/costs`),
        fetch(`${API_BASE}/fuel-logs?vehicle_id=${vehicleId}`),
        fetch(`${API_BASE}/expenses?vehicle_id=${vehicleId}`)
      ])
      if (!costsRes.ok) throw new Error('Failed to fetch vehicle cost center')
      const costsData = await costsRes.json()
      setSelectedCosts(costsData)
      if (fuelHistRes.ok) setVehicleFuelHistory(await fuelHistRes.json())
      if (expHistRes.ok) setVehicleExpenseHistory(await expHistRes.json())
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Fetch Reports & Analytics
  const fetchReports = async () => {
    try {
      setReportsLoading(true)
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

  // Reload data on user login
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // Reload vehicle costs when selection changes
  useEffect(() => {
    fetchVehicleCosts(selectedCostVehicleId)
  }, [selectedCostVehicleId])

  // Fetch reports when Reports tab is activated
  useEffect(() => {
    if (activeTab === 'reports' && user) {
      fetchReports()
    }
  }, [activeTab])

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

  // Handle Log Maintenance
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

  // Handle Close Maintenance
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

  // Handle Log Fuel
  const handleLogFuel = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const payload = {
      vehicle_id: parseInt(fuelForm.vehicle_id, 10),
      liters: parseFloat(fuelForm.liters),
      cost: parseFloat(fuelForm.cost),
      date: fuelForm.date
    }

    try {
      const res = await fetch(`${API_BASE}/fuel-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to log fuel purchase')
      }

      setSuccessMsg('Fuel purchase log created successfully.')
      setFuelForm({
        vehicle_id: '',
        liters: '',
        cost: '',
        date: new Date().toISOString().split('T')[0]
      })
      fetchData()
      // Refresh cost summary + history if that vehicle is currently selected
      if (selectedCostVehicleId && selectedCostVehicleId === payload.vehicle_id.toString()) {
        fetchVehicleCosts(selectedCostVehicleId)
      }
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Handle Log Expense
  const handleLogExpense = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const payload = {
      vehicle_id: parseInt(expenseForm.vehicle_id, 10),
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      date: expenseForm.date
    }

    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to log expense')
      }

      setSuccessMsg('Fleet expense record created successfully.')
      setExpenseForm({
        vehicle_id: '',
        category: 'Toll',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      })
      fetchData()
      // Refresh cost summary + history if that vehicle is currently selected
      if (selectedCostVehicleId && selectedCostVehicleId === payload.vehicle_id.toString()) {
        fetchVehicleCosts(selectedCostVehicleId)
      }
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  // Calculate metrics for stats cards
  const stats = {
    tripsTotal: trips.length,
    tripsDispatched: trips.filter(t => t.status === 'Dispatched').length,
    tripsCompleted: trips.filter(t => t.status === 'Completed').length,
    maintActive: maintenanceLogs.filter(m => m.is_active).length,
    maintTotal: maintenanceLogs.length,
    financeTotalFuel: fuelLogs.reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0),
    financeTotalExpense: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
    financeTotalMaint: maintenanceLogs.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0)
  }

  // CSV Export for Reports tab
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
            <button
              className={`nav-link ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => { setActiveTab('finance'); setErrorMsg(null); }}
            >
              Finance & Costs
            </button>
            <button
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => { setActiveTab('reports'); setErrorMsg(null); }}
            >
              Reports & Analytics
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
        {/* Notifications */}
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

        {/* Metric Counters Ribbon */}
        <section className="dashboard-grid">
          {activeTab === 'trips' && (
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
          )}
          {activeTab === 'maintenance' && (
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
                <span className="stat-label">Shop Expenses</span>
                <span className="stat-value">${stats.financeTotalMaint.toLocaleString()}</span>
              </div>
            </>
          )}
          {activeTab === 'finance' && (
            <>
              <div className="stat-card total" style={{ borderLeft: '4px solid var(--accent)' }}>
                <span className="stat-label">Fuel Expenses</span>
                <span className="stat-value">${stats.financeTotalFuel.toLocaleString()}</span>
              </div>
              <div className="stat-card dispatched" style={{ borderLeft: '4px solid var(--warning)' }}>
                <span className="stat-label">Other Expenses</span>
                <span className="stat-value">${stats.financeTotalExpense.toLocaleString()}</span>
              </div>
              <div className="stat-card completed" style={{ borderLeft: '4px solid var(--success)' }}>
                <span className="stat-label">Total Operating Cost</span>
                <span className="stat-value">${(stats.financeTotalFuel + stats.financeTotalExpense + stats.financeTotalMaint).toLocaleString()}</span>
              </div>
            </>
          )}
          {activeTab === 'reports' && (
            <>
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
            </>
          )}
          <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <span className="stat-label">Total Fleet Vehicles</span>
            <span className="stat-value">{allVehicles.length}</span>
          </div>
        </section>

        {/* Tab 1: Trips Workspace */}
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

        {/* Tab 2: Maintenance Workspace */}
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

        {/* Tab 3: Finance & Cost Workspace */}
        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Top Row: Two log forms side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>

              {/* ⛽ Log Fuel Form */}
              <section className="panel">
                <h2 className="panel-title">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h2l2 10h10l2-10h2M3 10V6a2 2 0 012-2h4m6 0h2a2 2 0 012 2v4M9 4h6" />
                  </svg>
                  Add Fuel Log
                </h2>
                <form onSubmit={handleLogFuel} id="fuel-log-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fuel-vehicle">Vehicle</label>
                    <select
                      id="fuel-vehicle"
                      className="form-select"
                      value={fuelForm.vehicle_id}
                      onChange={e => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                      required
                    >
                      <option value="">Select a vehicle...</option>
                      {allVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name_model} ({v.registration_number}) [{v.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="fuel-liters">Liters</label>
                      <input
                        id="fuel-liters"
                        type="number"
                        className="form-input"
                        placeholder="e.g. 80"
                        min="0.1"
                        step="0.1"
                        value={fuelForm.liters}
                        onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="fuel-cost">Total Cost ($)</label>
                      <input
                        id="fuel-cost"
                        type="number"
                        className="form-input"
                        placeholder="e.g. 120"
                        min="0.01"
                        step="0.01"
                        value={fuelForm.cost}
                        onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="fuel-date">Date</label>
                    <input
                      id="fuel-date"
                      type="date"
                      className="form-input"
                      value={fuelForm.date}
                      onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <button id="fuel-log-submit" type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    ⛽ Log Fuel Purchase
                  </button>
                </form>

                {/* Recent fuel log records */}
                {fuelLogs.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Recent Fleet Fuel Logs
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {fuelLogs.slice(0, 8).map(f => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(6, 182, 212, 0.06)', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.12)', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.vehicle_model || '—'}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({f.vehicle_registration})</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{f.liters}L</span>
                            <span style={{ color: 'var(--text-secondary)', margin: '0 0.3rem' }}>·</span>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>${f.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{new Date(f.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* 💳 Log Expense Form */}
              <section className="panel">
                <h2 className="panel-title">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Add Expense
                </h2>
                <form onSubmit={handleLogExpense} id="expense-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-vehicle">Vehicle</label>
                    <select
                      id="exp-vehicle"
                      className="form-select"
                      value={expenseForm.vehicle_id}
                      onChange={e => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                      required
                    >
                      <option value="">Select a vehicle...</option>
                      {allVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name_model} ({v.registration_number}) [{v.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="exp-category">Category</label>
                    <select
                      id="exp-category"
                      className="form-select"
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      required
                    >
                      <option value="Toll">🛣️ Toll Fee</option>
                      <option value="Insurance">🛡️ Insurance Payment</option>
                      <option value="Permit">📋 Permits / Licenses</option>
                      <option value="Maintenance">🔧 Maintenance / Spare Parts</option>
                      <option value="Other">📦 Other Miscellaneous</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="exp-amount">Amount ($)</label>
                      <input
                        id="exp-amount"
                        type="number"
                        className="form-input"
                        placeholder="e.g. 45"
                        min="0.01"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="exp-date">Date</label>
                      <input
                        id="exp-date"
                        type="date"
                        className="form-input"
                        value={expenseForm.date}
                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button id="expense-submit" type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    💳 Log Expense
                  </button>
                </form>

                {/* Recent expenses */}
                {expenses.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Recent Fleet Expenses
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {expenses.slice(0, 8).map(ex => {
                        const catEmoji = { Toll: '🛣️', Insurance: '🛡️', Permit: '📋', Maintenance: '🔧', Other: '📦' }[ex.category] || '💳'
                        return (
                          <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(245, 158, 11, 0.06)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.12)', fontSize: '0.82rem' }}>
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{catEmoji} {ex.category}</span>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{ex.vehicle_model || '—'} ({ex.vehicle_registration})</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--warning)', fontWeight: 700 }}>${parseFloat(ex.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{new Date(ex.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Bottom Row: Full-width Cost Summary */}
            <section className="panel" id="vehicle-cost-summary">
              <h2 className="panel-title">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Per-Vehicle Cost Summary
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
                {/* Left: Selector + totals */}
                <div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" htmlFor="cost-vehicle-select">Select Vehicle</label>
                    <select
                      id="cost-vehicle-select"
                      className="form-select"
                      value={selectedCostVehicleId}
                      onChange={e => setSelectedCostVehicleId(e.target.value)}
                    >
                      <option value="">Choose a vehicle...</option>
                      {allVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name_model} ({v.registration_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  {historyLoading && (
                    <div className="loading-container" style={{ padding: '2rem' }}>
                      <div className="spinner" />
                      <p>Loading cost data...</p>
                    </div>
                  )}

                  {selectedCosts && !historyLoading && (
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      {/* Grand Total Card */}
                      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(79,70,229,0.4)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Grand Total · {selectedCosts.name_model}
                        </p>
                        <p style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${selectedCosts.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{selectedCosts.registration_number}</p>
                      </div>

                      {/* Category breakdown rows with progress bars */}
                      {(() => {
                        const total = selectedCosts.total_cost || 1
                        const items = [
                          { label: 'Fuel Purchases', icon: '⛽', value: selectedCosts.fuel_cost, color: 'var(--accent)' },
                          { label: 'Maintenance', icon: '🔧', value: selectedCosts.maintenance_cost, color: 'var(--warning)' },
                          { label: 'Other Expenses', icon: '💳', value: selectedCosts.other_expense_cost, color: 'var(--primary)' }
                        ]
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {items.map(item => (
                              <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                  <span style={{ fontSize: '0.875rem' }}>{item.icon} {item.label}</span>
                                  <strong style={{ fontSize: '0.95rem', color: item.color }}>
                                    ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </strong>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, (item.value / total) * 100).toFixed(1)}%`, background: item.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                                </div>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'right' }}>
                                  {((item.value / total) * 100).toFixed(1)}% of total
                                </p>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {!selectedCostVehicleId && !historyLoading && (
                    <div className="empty-state">
                      <p style={{ fontSize: '1rem', fontWeight: 600 }}>No vehicle selected</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Pick a vehicle above to see its full cost breakdown and history.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: History tables */}
                {selectedCosts && !historyLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.4s ease-out' }}>

                    {/* Fuel logs history table */}
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        ⛽ Fuel Log History · {vehicleFuelHistory.length} record{vehicleFuelHistory.length !== 1 ? 's' : ''}
                      </p>
                      {vehicleFuelHistory.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                          No fuel logs recorded for this vehicle
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                {['Date', 'Liters', 'Cost', 'Price/L'].map(h => (
                                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {vehicleFuelHistory.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{new Date(f.date).toLocaleDateString()}</td>
                                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{f.liters} L</td>
                                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--success)', fontWeight: 600 }}>${f.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>${(f.cost / f.liters).toFixed(3)}/L</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Expenses history table */}
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        💳 Expense History · {vehicleExpenseHistory.length} record{vehicleExpenseHistory.length !== 1 ? 's' : ''}
                      </p>
                      {vehicleExpenseHistory.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                          No expenses recorded for this vehicle
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                {['Date', 'Category', 'Amount'].map(h => (
                                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {vehicleExpenseHistory.map(ex => {
                                const catEmoji = { Toll: '🛣️', Insurance: '🛡️', Permit: '📋', Maintenance: '🔧', Other: '📦' }[ex.category] || '💳'
                                const catColor = { Toll: 'var(--info)', Insurance: 'var(--success)', Permit: 'var(--accent)', Maintenance: 'var(--warning)', Other: 'var(--text-secondary)' }[ex.category] || 'var(--text-secondary)'
                                return (
                                  <tr key={ex.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{new Date(ex.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.6rem 0.75rem' }}>
                                      <span style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${catColor}40`, color: catColor, padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                                        {catEmoji} {ex.category}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--warning)', fontWeight: 600 }}>${parseFloat(ex.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tab 4: Reports & Analytics Workspace */}
        {activeTab === 'reports' && (
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
