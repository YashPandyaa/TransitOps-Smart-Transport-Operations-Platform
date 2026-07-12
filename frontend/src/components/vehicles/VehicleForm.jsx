import React, { useMemo, useState } from 'react'

const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired']

export default function VehicleForm({ mode, initialValues, onSubmit, serverError }) {
  const [form, setForm] = useState(() => ({
    registration_number: initialValues?.registration_number ?? '',
    name_model: initialValues?.name_model ?? '',
    type: initialValues?.type ?? '',
    max_load_capacity: initialValues?.max_load_capacity ?? '',
    odometer: initialValues?.odometer ?? '',
    acquisition_cost: initialValues?.acquisition_cost ?? '',
    status: initialValues?.status ?? 'Available'
  }))

  const title = useMemo(() => {
    if (mode === 'edit') return 'Edit Vehicle'
    return 'Add Vehicle'
  }, [mode])

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()

    const normalized = {
      ...form,
      max_load_capacity: form.max_load_capacity === '' ? '' : Number(form.max_load_capacity),
      odometer: form.odometer === '' ? '' : Number(form.odometer),
      acquisition_cost: form.acquisition_cost === '' ? '' : Number(form.acquisition_cost)
    }

    await onSubmit(normalized)
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>{title}</h1>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Registration Number">
          <input
            required
            value={form.registration_number}
            onChange={e => setField('registration_number', e.target.value)}
            placeholder="e.g. V-1001"
          />
        </Field>

        <Field label="Name / Model">
          <input required value={form.name_model} onChange={e => setField('name_model', e.target.value)} />
        </Field>

        <Field label="Type">
          <input required value={form.type} onChange={e => setField('type', e.target.value)} placeholder="e.g. Bus / Van" />
        </Field>

        <Field label="Max Load Capacity">
          <input
            required
            type="number"
            step="0.01"
            value={form.max_load_capacity}
            onChange={e => setField('max_load_capacity', e.target.value)}
          />
        </Field>

        <Field label="Odometer">
          <input
            required
            type="number"
            step="0.01"
            value={form.odometer}
            onChange={e => setField('odometer', e.target.value)}
          />
        </Field>

        <Field label="Acquisition Cost">
          <input
            required
            type="number"
            step="0.01"
            value={form.acquisition_cost}
            onChange={e => setField('acquisition_cost', e.target.value)}
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
          {mode === 'edit' ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  )
}

