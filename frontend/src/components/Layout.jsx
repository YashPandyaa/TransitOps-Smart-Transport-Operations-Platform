import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout({ children }) {
  // children already contains nested Routes in App.jsx. We keep Outlet for future use.
  return (
    <div>
      <NavBar />
      <main style={{ padding: 16 }}>
        {children ?? <Outlet />}
      </main>
    </div>
  )
}

