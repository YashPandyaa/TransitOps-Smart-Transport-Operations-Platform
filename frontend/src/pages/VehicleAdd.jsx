import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import VehicleForm from '../components/vehicles/VehicleForm'

export default function VehicleAdd() {
  const navigate = useNavigate()
  const { token, role, authFetch } = useAuth()

  const [serverError, setServerError] = useState(null)
  const [saving, setSaving] = useState(false)

  if (role !== 'Fleet Manager') {
    return <div style={{ color: '#666' }}>Forbidden: Fleet Manager role required.</div>
  }

  async function onSubmit(payload) {
    setSaving(true)
    setServerError(null)
    try {
      const res = await authFetch(
        token,
        `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/vehicles`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.message ?? 'Failed to add vehicle'
        setServerError(msg)
        return
      }

      navigate('/vehicles')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <VehicleForm mode="add" onSubmit={onSubmit} serverError={serverError} initialValues={null} />
      {saving ? <div style={{ marginTop: 10, opacity: 0.7 }}>Saving…</div> : null}
    </div>
  )
}

