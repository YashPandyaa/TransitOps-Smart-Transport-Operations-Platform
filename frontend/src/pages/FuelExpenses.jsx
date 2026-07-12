import React, { useEffect, useState } from 'react'

import { authFetch, useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function FuelExpenses() {
  const { token } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [costs, setCosts] = useState(null)
  const [error, setError] = useState(null)
  const today = new Date().toISOString().slice(0, 10)
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', liters: '', cost: '', date: today })
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: '', category: 'Toll', amount: '', date: today })

  async function load() {
    setError(null)
    try {
      const [vehiclesRes, fuelRes, expensesRes] = await Promise.all([
        authFetch(token, `${API_BASE}/api/vehicles`),
        fetch(`${API_BASE}/api/fuel-logs`),
        fetch(`${API_BASE}/api/expenses`)
      ])
      if (!vehiclesRes.ok) throw new Error('Failed to load vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles ?? [])
      setFuelLogs(fuelRes.ok ? await fuelRes.json() : [])
      setExpenses(expensesRes.ok ? await expensesRes.json() : [])
    } catch (err) {
      setError(err?.message ?? 'Failed to load fuel and expenses')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function loadCosts() {
      if (!selectedVehicle) {
        setCosts(null)
        return
      }
      const res = await authFetch(token, `${API_BASE}/api/vehicles/${selectedVehicle}/costs`)
      setCosts(res.ok ? await res.json() : null)
    }
    loadCosts()
  }, [selectedVehicle, token])

  async function submit(path, form, reset) {
    const res = await fetch(`${API_BASE}/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data?.message ?? `Failed to save ${path}`)
      return
    }
    reset()
    await load()
  }

  return (
    <div>
      <h1>Fuel / Expenses</h1>
      {error ? <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <form onSubmit={e => { e.preventDefault(); submit('fuel-logs', fuelForm, () => setFuelForm({ vehicle_id: '', liters: '', cost: '', date: today })) }}>
          <h2>Fuel Log</h2>
          <select value={fuelForm.vehicle_id} onChange={e => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} required>
            <option value="">Vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
          </select>
          <input placeholder="Liters" type="number" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} required />
          <input placeholder="Cost" type="number" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} required />
          <input type="date" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} required />
          <button type="submit">Add Fuel</button>
        </form>

        <form onSubmit={e => { e.preventDefault(); submit('expenses', expenseForm, () => setExpenseForm({ vehicle_id: '', category: 'Toll', amount: '', date: today })) }}>
          <h2>Expense</h2>
          <select value={expenseForm.vehicle_id} onChange={e => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} required>
            <option value="">Vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
          </select>
          <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
            {['Toll', 'Insurance', 'Permit', 'Maintenance', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Amount" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
          <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
          <button type="submit">Add Expense</button>
        </form>
      </div>

      <h2>Vehicle Cost Center</h2>
      <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
        <option value="">Select vehicle</option>
        {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
      </select>
      {costs ? (
        <p>Fuel: {costs.fuel_cost} | Maintenance: {costs.maintenance_cost} | Other: {costs.other_expense_cost} | Total: {costs.total_cost}</p>
      ) : null}

      <h2>Recent Logs</h2>
      <p>Fuel logs: {fuelLogs.length} | Expenses: {expenses.length}</p>
    </div>
  )
}
