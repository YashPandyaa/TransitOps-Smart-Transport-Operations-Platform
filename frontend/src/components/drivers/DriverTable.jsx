import React from 'react'
import { Link } from 'react-router-dom'

function statusStyle(status) {
  switch (status) {
    case 'Available':
      return { background: '#e9fbe9', color: '#0f7a0f', borderColor: '#7be07b' }
    case 'On Trip':
      return { background: '#eaf3ff', color: '#0b62d6', borderColor: '#7fb3ff' }
    case 'Off Duty':
      return { background: '#fff4e6', color: '#b35a00', borderColor: '#ffcc80' }
    case 'Suspended':
      return { background: '#ffecec', color: '#b00020', borderColor: '#ffb3b3' }
    default:
      return { background: '#f2f2f2', color: '#666', borderColor: '#d7d7d7' }
  }
}

function formatDate(d) {
  if (!d) return ''
  return String(d)
}

function isExpired(licenseExpiry) {
  if (!licenseExpiry) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(String(licenseExpiry))
  expiry.setHours(0, 0, 0, 0)

  return expiry < today
}

export default function DriverTable({ drivers = [], canMutate, onRefresh }) {
  function onDelete(id) {
    const ok = window.confirm('Delete this driver?')
    if (!ok) return

    window.dispatchEvent(new CustomEvent('drivers:request-delete', { detail: { id } }))
  }

  return (
    <div>
      {drivers.length === 0 ? <div>No drivers found.</div> : null}

      {drivers.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>License Number</th>
              <th style={thStyle}>License Category</th>
              <th style={thStyle}>License Expiry</th>
              <th style={thStyle}>Safety Score</th>
              <th style={thStyle}>Status</th>
              {canMutate ? <th style={thStyle}>Actions</th> : null}
            </tr>
          </thead>

          <tbody>
            {drivers.map(d => {
              const expired = isExpired(d.license_expiry)
              return (
                <tr key={d.id}>
                  <td style={tdStyle}>{d.name}</td>
                  <td style={tdStyle}>{d.license_number}</td>
                  <td style={tdStyle}>{d.license_category}</td>
                  <td style={tdStyle}>
                    {expired ? (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          border: '1px solid',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: '#ffecec',
                          color: '#b00020',
                          borderColor: '#ffb3b3'
                        }}
                      >
                        Expired: {formatDate(d.license_expiry)}
                      </span>
                    ) : (
                      <span style={{ color: '#333' }}>{formatDate(d.license_expiry)}</span>
                    )}
                  </td>
                  <td style={tdStyle}>{d.safety_score}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        border: '1px solid',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        ...statusStyle(d.status)
                      }}
                    >
                      {d.status}
                    </span>
                  </td>

                  {canMutate ? (
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link to={`/drivers/edit/${d.id}`} style={btnStyle}>
                          Edit
                        </Link>
                        <button onClick={() => onDelete(d.id)} style={btnStyleDanger}>
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : null}

      {/* onRefresh kept for API parity with Vehicles table patterns */}
      {onRefresh ? null : null}
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 8px',
  borderBottom: '1px solid #e5e5e5',
  fontSize: 13,
  fontWeight: 700
}

const tdStyle = {
  padding: '10px 8px',
  borderBottom: '1px solid #f0f0f0',
  fontSize: 14
}

const btnStyle = {
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  textDecoration: 'none',
  color: '#222',
  display: 'inline-block'
}

const btnStyleDanger = {
  ...btnStyle,
  borderColor: '#f0b0b0',
  color: '#b00020'
}

