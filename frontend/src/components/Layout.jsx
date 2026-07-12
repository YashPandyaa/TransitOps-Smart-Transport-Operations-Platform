import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div>
      <NavBar />
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}


