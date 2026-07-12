import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()

  // State
  const [mode, setMode] = useState('login') // 'login' | 'request' | 'complete'
  
  // Login State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Request Signup State
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    license_number: '',
    license_category: 'Class A CDL',
    license_expiry: '',
    contact_number: ''
  })
  
  // Complete Signup State
  const [completeEmail, setCompleteEmail] = useState('')
  const [completePassword, setCompletePassword] = useState('')

  // Notifications
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  // Handle Login Submit
  async function onLoginSubmit(e) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)
    try {
      await login({ email, password })
    } catch (err) {
      setErrorMsg(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle Request Signup Submit
  async function onRequestSubmit(e) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm)
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Request failed')
      }

      setSuccessMsg('Your registration request has been submitted to the Admin. Please wait for approval before setting a password.')
      setMode('login')
      setRequestForm({
        name: '',
        email: '',
        license_number: '',
        license_category: 'Class A CDL',
        license_expiry: '',
        contact_number: ''
      })
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle Complete Signup Submit
  async function onCompleteSubmit(e) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: completeEmail, password: completePassword })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Signup completion failed')
      }

      setSuccessMsg('Registration complete! You can now log in with your credentials.')
      setEmail(completeEmail)
      setPassword(completePassword)
      setMode('login')
      setCompleteEmail('')
      setCompletePassword('')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setMode('login')
    setEmail(quickEmail)
    setPassword(quickPassword)
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn')
      if (btn) btn.click()
    }, 100)
  }

  return (
    <div className="app-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <header style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'transparent', borderBottom: 'none' }}>
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">T</div>
            Transit<span>Ops</span>
          </div>
        </div>
      </header>
      
      <div className="login-overlay" style={{ padding: '4rem 1rem 2rem 1rem' }}>
        <div className="login-card" style={{ maxWidth: mode === 'request' ? '540px' : '420px', transition: 'max-width 0.3s ease' }}>
          
          {/* Header */}
          <div className="login-header">
            <h2>
              {mode === 'login' && 'Welcome to TransitOps'}
              {mode === 'request' && 'Driver Access Request'}
              {mode === 'complete' && 'Set Driver Password'}
            </h2>
            <p>
              {mode === 'login' && 'Sign in with your hackathon development account'}
              {mode === 'request' && 'Enter your profile details to register as a fleet driver'}
              {mode === 'complete' && 'If your signup request was approved, set your password below'}
            </p>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="alert-banner" style={{ marginBottom: '1.25rem' }}>
              <div>{errorMsg}</div>
              <button className="alert-banner-close" onClick={() => setErrorMsg(null)}>&times;</button>
            </div>
          )}

          {successMsg && (
            <div className="alert-banner" style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', marginBottom: '1.25rem' }}>
              <div>{successMsg}</div>
              <button className="alert-banner-close" style={{ color: '#a7f3d0' }} onClick={() => setSuccessMsg(null)}>&times;</button>
            </div>
          )}

          {/* Mode 1: Log In */}
          {mode === 'login' && (
            <form onSubmit={onLoginSubmit}>
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
          )}

          {/* Mode 2: Request Signup */}
          {mode === 'request' && (
            <form onSubmit={onRequestSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={requestForm.name}
                    onChange={e => setRequestForm({ ...requestForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@example.com"
                    value={requestForm.email}
                    onChange={e => setRequestForm({ ...requestForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. DL-1122334"
                    value={requestForm.license_number}
                    onChange={e => setRequestForm({ ...requestForm, license_number: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">License Category</label>
                  <select
                    className="form-select"
                    value={requestForm.license_category}
                    onChange={e => setRequestForm({ ...requestForm, license_category: e.target.value })}
                    required
                  >
                    <option value="Class A CDL">Class A CDL</option>
                    <option value="Class B CDL">Class B CDL</option>
                    <option value="Class C">Class C</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">License Expiry</label>
                  <input
                    type="date"
                    className="form-input"
                    value={requestForm.license_expiry}
                    onChange={e => setRequestForm({ ...requestForm, license_expiry: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+1-555-0199"
                    value={requestForm.contact_number}
                    onChange={e => setRequestForm({ ...requestForm, contact_number: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? 'Submitting request...' : 'Send Access Request'}
              </button>
            </form>
          )}

          {/* Mode 3: Complete Signup */}
          {mode === 'complete' && (
            <form onSubmit={onCompleteSubmit}>
              <div className="form-group">
                <label className="form-label">Approved Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. john@example.com"
                  value={completeEmail}
                  onChange={e => setCompleteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Set Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Choose a secure password"
                  value={completePassword}
                  onChange={e => setCompletePassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading}
              >
                {loading ? 'Setting password...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* Navigation Toggles */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', textAlign: 'center' }}>
            {mode === 'login' && (
              <>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>New driver? </span>
                  <button type="button" onClick={() => setMode('request')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                    Request Driver Access
                  </button>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Approved request? </span>
                  <button type="button" onClick={() => setMode('complete')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                    Complete Signup & Set Password
                  </button>
                </div>
              </>
            )}

            {mode !== 'login' && (
              <div>
                <button type="button" onClick={() => setMode('login')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>

          {/* Quick Login Grid (Only show in login mode) */}
          {mode === 'login' && (
            <div className="quick-login-grid" style={{ marginTop: '1.5rem' }}>
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
          )}

        </div>
      </div>
    </div>
  )
}
