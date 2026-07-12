import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider, useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'

import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import VehicleAdd from './pages/VehicleAdd'
import VehicleEdit from './pages/VehicleEdit'
import Drivers from './pages/Drivers'
import DriverAdd from './pages/DriverAdd'
import DriverEdit from './pages/DriverEdit'
import Trips from './pages/Trips'
import Maintenance from './pages/Maintenance'
import FuelExpenses from './pages/FuelExpenses'
import Reports from './pages/Reports'


const ROLE_ROUTE_ALLOW = {
  'Fleet Manager': ['/', '/dashboard', '/vehicles', '/drivers', '/trips', '/maintenance', '/fuel-expenses', '/reports'],
  Driver: ['/', '/dashboard', '/trips', '/vehicles'],
  'Safety Officer': ['/', '/dashboard', '/drivers', '/maintenance', '/trips'],
  'Financial Analyst': ['/', '/dashboard', '/reports', '/fuel-expenses', '/vehicles']
}

function RoleProtectedRoute({ allowed, element }) {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />

  if (allowed && !allowed.includes(role)) return <Navigate to="/dashboard" replace />
  return element
}


export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]}
                element={<Dashboard />}
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]}
                element={<Dashboard />}
              />
            }
          />

          <Route
            path="vehicles"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Driver", "Financial Analyst"]}
                element={<Vehicles />}
              />
            }
          />

          <Route
            path="vehicles/add"
            element={
              <RoleProtectedRoute allowed={["Fleet Manager"]} element={<VehicleAdd />} />
            }
          />

          <Route
            path="vehicles/edit/:id"
            element={
              <RoleProtectedRoute allowed={["Fleet Manager"]} element={<VehicleEdit />} />
            }
          />


          <Route
            path="drivers"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Safety Officer"]}
                element={<Drivers />}
              />
            }
          />

          <Route
            path="drivers/add"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Safety Officer"]}
                element={<DriverAdd />}
              />
            }
          />

          <Route
            path="drivers/edit/:id"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Safety Officer"]}
                element={<DriverEdit />}
              />
            }
          />


          <Route
            path="trips"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Driver", "Safety Officer"]}
                element={<Trips />}
              />}
          />

          <Route
            path="maintenance"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Safety Officer"]}
                element={<Maintenance />}
              />
            }
          />

          <Route
            path="fuel-expenses"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Financial Analyst"]}
                element={<FuelExpenses />}
              />
            }
          />

          <Route
            path="reports"
            element={
              <RoleProtectedRoute
                allowed={["Fleet Manager", "Financial Analyst"]}
                element={<Reports />}
              />
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

