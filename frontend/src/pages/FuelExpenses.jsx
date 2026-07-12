import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api'

export default function FuelExpenses() {
  const { user } = useAuth()

  // State
  const [fuelLogs, setFuelLogs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [allVehicles, setAllVehicles] = useState([])
  
  const [selectedCostVehicleId, setSelectedCostVehicleId] = useState('')
  const [selectedCosts, setSelectedCosts] = useState(null)
  const [vehicleFuelHistory, setVehicleFuelHistory] = useState([])
  const [vehicleExpenseHistory, setVehicleExpenseHistory] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

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

  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // Fetch All Vehicles
      const allVehiclesRes = await fetch(`${API_BASE}/vehicles`)
      if (!allVehiclesRes.ok) throw new Error('Failed to fetch fleet vehicles')
      const allVehiclesData = await allVehiclesRes.json()
      setAllVehicles(Array.isArray(allVehiclesData) ? allVehiclesData : (allVehiclesData.vehicles || []))

      // Fetch Fuel Logs
      const fuelRes = await fetch(`${API_BASE}/fuel-logs`)
      if (fuelRes.ok) {
        const fuelData = await fuelRes.json()
        setFuelLogs(fuelData)
      }

      // Fetch Expenses
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

  useEffect(() => {
    fetchData()
  }, [])

  // Reload vehicle costs when selection changes
  useEffect(() => {
    fetchVehicleCosts(selectedCostVehicleId)
  }, [selectedCostVehicleId])

  // Clear success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

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
      if (selectedCostVehicleId && selectedCostVehicleId === payload.vehicle_id.toString()) {
        fetchVehicleCosts(selectedCostVehicleId)
      }
    } catch (err) {
      setErrorMsg(err.message)
    }
  }

  const stats = {
    financeTotalFuel: fuelLogs.reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0),
    financeTotalExpense: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <h1>Finance & Costs</h1>

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
          <span className="stat-label">Fuel Expenses</span>
          <span className="stat-value">${stats.financeTotalFuel.toLocaleString()}</span>
        </div>
        <div className="stat-card dispatched" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-label">Other Expenses</span>
          <span className="stat-value">${stats.financeTotalExpense.toLocaleString()}</span>
        </div>
        <div className="stat-card completed" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Total Fleet Cost</span>
          <span className="stat-value">${(stats.financeTotalFuel + stats.financeTotalExpense).toLocaleString()}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Fleet Vehicles</span>
          <span className="stat-value">{allVehicles.length}</span>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top Row: Two log forms side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>

          {/* Log Fuel Form */}
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
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name_model || f.vehicle_model || '—'}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({f.registration_number || f.vehicle_registration})</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{f.liters}L</span>
                        <span style={{ color: 'var(--text-secondary)', margin: '0 0.3rem' }}>·</span>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>${parseFloat(f.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{new Date(f.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Log Expense Form */}
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
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{ex.name_model || ex.vehicle_model || '—'} ({ex.registration_number || ex.vehicle_registration})</div>
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
                              <td style={{ padding: '0.6rem 0.75rem', color: 'var(--success)', fontWeight: 600 }}>${parseFloat(f.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
    </div>
  )
}
