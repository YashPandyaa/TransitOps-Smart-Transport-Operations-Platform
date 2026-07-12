import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'

const MENU_BY_ROLE = {
  'Fleet Manager': [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/vehicles', label: 'Vehicles' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/trips', label: 'Trips' },
    { to: '/maintenance', label: 'Maintenance' },
    { to: '/fuel-expenses', label: 'Fuel/Expenses' },
    { to: '/reports', label: 'Reports' }
  ],
  Driver: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/trips', label: 'Trips' },
    { to: '/vehicles', label: 'Vehicles' }
  ],
  'Safety Officer': [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/maintenance', label: 'Maintenance' },
    { to: '/trips', label: 'Trips' }
  ],
  'Financial Analyst': [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/reports', label: 'Reports' },
    { to: '/fuel-expenses', label: 'Fuel/Expenses' },
    { to: '/vehicles', label: 'Vehicles' }
  ]
}

export default function NavBar() {
  const { role, user, logout, isAuthenticated } = useAuth()

  const menu = useMemo(() => {
    if (!role) return []
    return MENU_BY_ROLE[role] ?? []
  }, [role])

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #e5e5e5' }}>
      {menu.map(item => (
        <Link key={item.to} to={item.to}>
          {item.label}
        </Link>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {isAuthenticated ? (
          <>
            <span style={{ opacity: 0.7, fontSize: 13 }}>{user?.name ?? 'User'} ({role})</span>
            <button onClick={logout} style={{ cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <span style={{ opacity: 0.7, fontSize: 13 }}>Not logged in</span>
        )}
      </div>
    </nav>
  )
}


