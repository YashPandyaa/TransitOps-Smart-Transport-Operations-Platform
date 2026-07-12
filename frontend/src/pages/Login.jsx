import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)
    try {
      await login({ email, password })
    } catch (err) {
      setErrorMsg(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail)
    setPassword(quickPassword)
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn')
      if (btn) btn.click()
    }, 100)
  }

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">T</div>
            Transit<span>Ops</span>
          </div>
        </div>
      </header>
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-header">
            <h2>Welcome to TransitOps</h2>
            <p>Sign in with your hackathon development account</p>
          </div>

          {errorMsg && (
            <div className="alert-banner">
              <div>{errorMsg}</div>
              <button className="alert-banner-close" onClick={() => setErrorMsg(null)}>&times;</button>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. manager@transitops.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="quick-login-grid">
            <button
              type="button"
              className="quick-login-btn"
              onClick={() => handleQuickLogin('manager@transitops.com', 'manager123')}
            >
              🔑 Fleet Manager
              <span>manager@transitops.com</span>
            </button>
            <button
              type="button"
              className="quick-login-btn"
              onClick={() => handleQuickLogin('driver@transitops.com', 'driver123')}
            >
              🚚 Driver
              <span>driver@transitops.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
