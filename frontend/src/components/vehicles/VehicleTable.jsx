import React from 'react'
import { Link } from 'react-router-dom'

function statusStyle(status) {
  switch (status) {
    case 'Available':
      return { background: '#e9fbe9', color: '#0f7a0f', borderColor: '#7be07b' }
    case 'On Trip':
      return { background: '#eaf3ff', color: '#0b62d6', borderColor: '#7fb3ff' }
    case 'In Shop':
      return { background: '#fff4e6', color: '#b35a00', borderColor: '#ffcc80' }
    case 'Retired':
      return { background: '#f2f2f2', color: '#666', borderColor: '#d7d7d7' }
    default:
      return { background: '#f2f2f2', color: '#666', borderColor: '#d7d7d7' }
  }
}

export default function VehicleTable({ vehicles = [], canMutate, onRefresh }) {
  async function onDelete(id) {
    const ok = window.confirm('Delete this vehicle?')
    if (!ok) return

    // Let parent refresh after delete using a custom event
    const ev = new CustomEvent('vehicles:delete', { detail: { id } })
    window.dispatchEvent(ev)
  }

  return (
    <div>
      {vehicles.length === 0 ? <div>No vehicles found.</div> : null}

      {vehicles.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Registration Number</th>
              <th style={thStyle}>Name/Model</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Odometer</th>
              <th style={thStyle}>Status</th>
              {canMutate ? <th style={thStyle}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id}>
                <td style={tdStyle}>{v.registration_number}</td>
                <td style={tdStyle}>{v.name_model}</td>
                <td style={tdStyle}>{v.type}</td>
                <td style={tdStyle}>{v.odometer}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      border: '1px solid',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      ...statusStyle(v.status)
                    }}
                  >
                    {v.status}
                  </span>
                </td>
                {canMutate ? (
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link to={`/vehicles/edit/${v.id}`} style={btnStyle}>Edit</Link>
                      <button onClick={() => onDelete(v.id)} style={btnStyleDanger}>Delete</button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <DeleteBridge canMutate={canMutate} onRefresh={onRefresh} />
    </div>
  )
}

function DeleteBridge({ canMutate, onRefresh }) {
  React.useEffect(() => {
    if (!canMutate) return

    async function handler(e) {
      // Fetch via session token stored in AuthContext isn't accessible here.
      // We'll dispatch a second event; the Vehicles page listens.
      window.dispatchEvent(new CustomEvent('vehicles:request-delete', { detail: e.detail }))
    }

    window.addEventListener('vehicles:delete', handler)
    return () => window.removeEventListener('vehicles:delete', handler)
  }, [canMutate, onRefresh])

  return null
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
  fontSize: 13
}

const btnStyleDanger = {
  ...btnStyle,
  borderColor: '#f0b0b0',
  color: '#b00020'
}

