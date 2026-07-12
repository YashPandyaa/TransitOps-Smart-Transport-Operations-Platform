import React, { useMemo, useState } from 'react'

const STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended']

export default function DriverForm({ mode, initialValues, onSubmit, serverError }) {
  const [form, setForm] = useState(() => ({
    name: initialValues?.name ?? '',
    license_number: initialValues?.license_number ?? '',
    license_category: initialValues?.license_category ?? '',
    license_expiry: initialValues?.license_expiry ?? '',
    contact_number: initialValues?.contact_number ?? '',
    safety_score: initialValues?.safety_score ?? '',
    status: initialValues?.status ?? 'Available'
  }))

  const title = useMemo(() => {
    if (mode === 'edit') return 'Edit Driver'
    return 'Add Driver'
  }, [mode])

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()

    const normalized = {
      ...form,
      safety_score: form.safety_score === '' ? '' : Number(form.safety_score)
    }

    await onSubmit(normalized)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>{title}</h1>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Name">
          <input required value={form.name} onChange={e => setField('name', e.target.value)} />
        </Field>

        <Field label="License Number">
          <input
            required
            value={form.license_number}
            onChange={e => setField('license_number', e.target.value)}
            placeholder="e.g. LIC-1001"
          />
        </Field>

        <Field label="License Category">
          <input
            required
            value={form.license_category}
            onChange={e => setField('license_category', e.target.value)}
            placeholder="e.g. Category A"
          />
        </Field>

        <Field label="License Expiry">
          <input
            required
            type="date"
            value={normalizeDateInputValue(form.license_expiry)}
            onChange={e => setField('license_expiry', e.target.value)}
          />
        </Field>

        <Field label="Contact Number">
          <input
            required
            value={form.contact_number}
            onChange={e => setField('contact_number', e.target.value)}
            placeholder="e.g. +1 555 1234"
          />
        </Field>

        <Field label="Safety Score">
          <input
            required
            type="number"
            step="0.01"
            value={form.safety_score}
            onChange={e => setField('safety_score', e.target.value)}
          />
        </Field>

        <Field label="Status">
          <select value={form.status} onChange={e => setField('status', e.target.value)}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        {serverError ? <div style={{ color: 'crimson' }}>{serverError}</div> : null}

        <button type="submit" style={{ padding: '10px 14px', cursor: 'pointer' }}>
          {mode === 'edit' ? 'Save Changes' : 'Add Driver'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  )
}

function normalizeDateInputValue(v) {
  if (!v) return ''
  // If it's already YYYY-MM-DD keep it.
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const dt = new Date(s)
  if (Number.isNaN(dt.getTime())) return ''
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

