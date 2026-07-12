import React, { useState } from 'react'

import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Login</h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Email</span>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Password</span>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </label>

        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: 18, opacity: 0.7, fontSize: 13 }}>
        Test users: fleet.manager@transitops.local / driver@transitops.local / safety.officer@transitops.local / financial.analyst@transitops.local
      </div>
    </div>
  )
}



