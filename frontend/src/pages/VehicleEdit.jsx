import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import VehicleForm from '../components/vehicles/VehicleForm'

export default function VehicleEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token, role, authFetch } = useAuth()

  const [initialValues, setInitialValues] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(true)

  if (role !== 'Fleet Manager') {
    return <div style={{ color: '#666' }}>Forbidden: Fleet Manager role required.</div>
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setServerError(null)
      try {
        // no dedicated GET /:id endpoint; fetch all and find
        const res = await authFetch(token, `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/vehicles`, { method: 'GET' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message ?? 'Failed to load vehicle')
        const v = (data.vehicles ?? []).find(x => String(x.id) === String(id))
        if (!v) throw new Error('Vehicle not found')
        setInitialValues(v)
      } catch (e) {
        setServerError(e?.message ?? 'Failed to load vehicle')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, token, authFetch])

  async function onSubmit(payload) {
    setServerError(null)
    const res = await authFetch(
      token,
      `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/vehicles/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setServerError(data?.message ?? 'Failed to update vehicle')
      return
    }

    navigate('/vehicles')
  }

  if (loading) return <div>Loading…</div>

  return (
    <div>
      <VehicleForm mode="edit" initialValues={initialValues} onSubmit={onSubmit} serverError={serverError} />
    </div>
  )
}

