import React from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #e5e5e5' }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/vehicles">Vehicles</Link>
      <Link to="/drivers">Drivers</Link>
      <Link to="/trips">Trips</Link>
      <Link to="/maintenance">Maintenance</Link>
      <Link to="/fuel-expenses">Fuel/Expenses</Link>
      <Link to="/reports">Reports</Link>

      <div style={{ marginLeft: 'auto' }}>
        <span style={{ opacity: 0.7 }}>Nav placeholder</span>
      </div>
    </nav>
  )
}

