import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import DriverForm from '../components/drivers/DriverForm'

export default function DriverAdd() {
  const navigate = useNavigate()
  const { token, role, authFetch } = useAuth()

  const [serverError, setServerError] = useState(null)
  const [saving, setSaving] = useState(false)

  const canMutate = role === 'Fleet Manager' || role === 'Safety Officer'
  if (!canMutate) {
    return <div style={{ color: '#666' }}>Forbidden: Fleet Manager or Safety Officer role required.</div>
  }

  async function onSubmit(payload) {
    setSaving(true)
    setServerError(null)
    try {
      const res = await authFetch(token, `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(data?.message ?? 'Failed to add driver')
        return
      }

      navigate('/drivers')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <DriverForm mode="add" onSubmit={onSubmit} serverError={serverError} initialValues={null} />
      {saving ? <div style={{ marginTop: 10, opacity: 0.7 }}>Saving…</div> : null}
    </div>
  )
}

