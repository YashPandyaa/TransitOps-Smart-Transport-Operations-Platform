import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api'

export default function SignupRequests() {
  const { token, authFetch } = useAuth()

  // State
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const res = await authFetch(token, `${API_BASE}/auth/signup-requests`)
      if (!res.ok) throw new Error('Failed to fetch signup requests')
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Clear success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  // Handle Approve
  const handleApprove = async (id) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setActionLoading(id)

    try {
      const res = await authFetch(token, `${API_BASE}/auth/signup-requests/${id}/approve`, {
        method: 'PUT'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve request')
      }

      setSuccessMsg('Request approved successfully. The driver can now set their password.')
      fetchRequests()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Reject
  const handleReject = async (id) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setActionLoading(id)

    try {
      const res = await authFetch(token, `${API_BASE}/auth/signup-requests/${id}/reject`, {
        method: 'PUT'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reject request')
      }

      setSuccessMsg('Driver access request rejected.')
      fetchRequests()
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Statistics
  const pendingCount = requests.filter(r => r.status === 'Pending').length

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Driver Signup Requests</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and authorize new drivers trying to register on TransitOps</p>
        </div>
        <div style={{
          background: pendingCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
          border: pendingCount > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
          color: pendingCount > 0 ? 'var(--warning)' : 'var(--text-secondary)',
          borderRadius: '100px',
          padding: '0.5rem 1.25rem',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          {pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="alert-banner" style={{ marginBottom: '1.5rem' }}>
          <div><strong>Error:</strong> {errorMsg}</div>
          <button className="alert-banner-close" onClick={() => setErrorMsg(null)}>&times;</button>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner" style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', marginBottom: '1.5rem' }}>
          <div><strong>Success:</strong> {successMsg}</div>
          <button className="alert-banner-close" style={{ color: '#a7f3d0' }} onClick={() => setSuccessMsg(null)}>&times;</button>
        </div>
      )}

      {/* Requests panel */}
      <section className="panel">
        <h2 className="panel-title">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Verification Queue
        </h2>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching verification queue...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Queue is empty</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              No driver registration requests have been submitted yet.
            </p>
          </div>
        ) : (
          <div className="trips-container">
            {requests.map(req => {
              const statusClass = {
                'Pending': 'badge-draft',
                'Approved': 'badge-dispatched',
                'Completed': 'badge-completed',
                'Rejected': 'badge-cancelled'
              }[req.status] || 'badge-draft'

              return (
                <div key={req.id} className="trip-card" style={{ borderLeft: req.status === 'Pending' ? '4px solid var(--warning)' : '1px solid var(--border-color)' }}>
                  <div className="trip-card-header">
                    <div>
                      <span className="trip-route" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        👤 {req.name}
                      </span>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        📧 {req.email} &middot; 📞 {req.contact_number}
                      </div>
                    </div>
                    <span className={`badge ${statusClass}`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="trip-card-body" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">License Number</span>
                      <span className="trip-meta-value">{req.license_number}</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">License Category</span>
                      <span className="trip-meta-value">{req.license_category}</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">License Expiry</span>
                      <span className="trip-meta-value">{new Date(req.license_expiry).toLocaleDateString()}</span>
                    </div>
                    <div className="trip-meta-item">
                      <span className="trip-meta-label">Submitted On</span>
                      <span className="trip-meta-value">{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="trip-card-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-success btn-action-sm"
                        disabled={actionLoading !== null}
                        onClick={() => handleApprove(req.id)}
                      >
                        {actionLoading === req.id ? 'Approving...' : '✓ Approve Access'}
                      </button>
                      <button
                        className="btn btn-danger btn-action-sm"
                        style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }}
                        disabled={actionLoading !== null}
                        onClick={() => handleReject(req.id)}
                      >
                        {actionLoading === req.id ? 'Rejecting...' : '✗ Reject Request'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
