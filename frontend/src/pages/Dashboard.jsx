import React, { useEffect, useMemo, useState } from "react"
import { useAuth } from "../auth/AuthContext"

const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"]

export default function Dashboard() {
  const { user } = useAuth()

  const [vehicleType, setVehicleType] = useState("")
  const [vehicleStatus, setVehicleStatus] = useState("")
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const vehicleTypes = useMemo(() => {
    return ["Truck", "Van", "Car", "Trailer"]
  }, [])

  async function fetchSummary() {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (vehicleType) params.set("vehicleType", vehicleType)
      if (vehicleStatus) params.set("vehicleStatus", vehicleStatus)

      const res = await fetch(`/api/dashboard/summary?${params.toString()}`)
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed: ${res.status}`)
      }
      const data = await res.json()
      setSummary(data)
    } catch (e) {
      setSummary(null)
      setError(e.message || "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [vehicleType, vehicleStatus])

  const cards = [
    {
      title: "Active Vehicles",
      value: summary ? summary.activeVehicles : 0,
      color: "var(--info)",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-4a1 1 0 00-.3-.7l-3-3a1 1 0 00-.7-.3h-4v8" />
        </svg>
      )
    },
    {
      title: "Available Vehicles",
      value: summary ? summary.availableVehicles : 0,
      color: "var(--success)",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Vehicles in Maintenance",
      value: summary ? summary.vehiclesInMaintenance : 0,
      color: "var(--warning)",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: "Active Trips",
      value: summary ? summary.activeTrips : 0,
      color: "var(--accent)",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      )
    },
    {
      title: "Pending Trips",
      value: summary ? summary.pendingTrips : 0,
      color: "var(--primary)",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Drivers On Duty",
      value: summary ? summary.driversOnDuty : 0,
      color: "#c084fc",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: "Fleet Utilization",
      value: summary ? summary.fleetUtilizationPercent : 0,
      color: "#ec4899",
      suffix: "%",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      )
    }
  ]

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Command Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name || "User"}</strong> ({user?.role})
          </p>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          borderRadius: '100px',
          padding: '0.5rem 1.25rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--accent)'
        }}>
          System Status: Operational Green
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert-banner" style={{ marginBottom: '1.5rem' }}>
          <div><strong>Error:</strong> {error}</div>
        </div>
      )}

      {/* Stats and Filter Controls Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', margin: 0, opacity: loading ? 0.6 : 1 }}>
            {cards.map((c) => (
              <div
                key={c.title}
                className="stat-card"
                style={{
                  borderLeft: `4px solid ${c.color}`,
                  background: 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '1rem' }}>
                  <span className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                    {c.title}
                  </span>
                  <span style={{ color: c.color }}>{c.icon}</span>
                </div>
                <span className="stat-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {c.value}
                  {c.suffix && <span style={{ fontSize: '1.2rem', fontWeight: 600, marginLeft: '2px', color: 'var(--text-secondary)' }}>{c.suffix}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Quick Filter Controls */}
        <section className="panel" style={{ margin: 0 }}>
          <h2 className="panel-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Fleet Stats
          </h2>

          <div className="form-group">
            <label className="form-label" htmlFor="vehicleType">Vehicle Type</label>
            <select
              id="vehicleType"
              className="form-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="">All types</option>
              {vehicleTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="vehicleStatus">Vehicle Status</label>
            <select
              id="vehicleStatus"
              className="form-select"
              value={vehicleStatus}
              onChange={(e) => setVehicleStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {VEHICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </section>

      </div>
    </div>
  )
}
