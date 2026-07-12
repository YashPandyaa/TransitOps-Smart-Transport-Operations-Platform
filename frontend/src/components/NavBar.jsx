import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const MENU_BY_ROLE = {
  'Fleet Manager': [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/vehicles', label: 'Vehicles' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/trips', label: 'Trips & Dispatch' },
    { to: '/signup-requests', label: 'Signup Requests' },
    { to: '/maintenance', label: 'Maintenance Log' },
    { to: '/fuel-expenses', label: 'Finance & Costs' },
    { to: '/reports', label: 'Reports & Analytics' }
  ],
  Driver: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/trips', label: 'Trips & Dispatch' },
    { to: '/vehicles', label: 'Vehicles' }
  ],
  'Safety Officer': [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/maintenance', label: 'Maintenance Log' },
    { to: '/trips', label: 'Trips & Dispatch' }
  ],
  'Financial Analyst': [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/reports', label: 'Reports & Analytics' },
    { to: '/fuel-expenses', label: 'Finance & Costs' },
    { to: '/vehicles', label: 'Vehicles' }
  ]
}

export default function NavBar() {
  const { role, user, logout, isAuthenticated } = useAuth()

  const menu = useMemo(() => {
    if (!role) return []
    return MENU_BY_ROLE[role] ?? []
  }, [role])

  if (!isAuthenticated) return null

  return (
    <header>
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">T</div>
          Transit<span>Ops</span>
        </div>
        <nav>
          {menu.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="user-indicator">
            <span>{user?.name}</span>
            <span className="user-badge">{role}</span>
          </div>

          <button
            className="nav-link logout-btn"
            onClick={logout}
            style={{ color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  )
}
