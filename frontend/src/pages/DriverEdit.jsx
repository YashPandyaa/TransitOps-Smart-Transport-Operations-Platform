import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import DriverForm from '../components/drivers/DriverForm'

export default function DriverEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token, role, authFetch } = useAuth()

  const [initialValues, setInitialValues] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(true)

  const canMutate = role === 'Fleet Manager' || role === 'Safety Officer'
  if (!canMutate) {
    return <div style={{ color: '#666' }}>Forbidden: Fleet Manager or Safety Officer role required.</div>
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setServerError(null)
      try {
        const res = await authFetch(token, `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/drivers`, { method: 'GET' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message ?? 'Failed to load drivers')

        const d = (data.drivers ?? []).find(x => String(x.id) === String(id))
        if (!d) throw new Error('Driver not found')
        setInitialValues(d)
      } catch (e) {
        setServerError(e?.message ?? 'Failed to load driver')
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
      `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/drivers/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setServerError(data?.message ?? 'Failed to update driver')
      return
    }

    navigate('/drivers')
  }

  if (loading) return <div>Loading…</div>

  return (
    <div>
      {serverError ? <div style={{ color: 'crimson', marginBottom: 12 }}>{serverError}</div> : null}
      {initialValues ? (
        <DriverForm mode="edit" initialValues={initialValues} onSubmit={onSubmit} serverError={null} />
      ) : null}
    </div>
  )
}

