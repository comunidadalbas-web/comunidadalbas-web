'use client';

import { useState } from 'react';

interface FeeConcept {
  id: string;
  name: string;
  amount: number;
  authoritySource: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface Props {
  items: FeeConcept[];
  csrfToken: string;
}

function mxn(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);
}

export default function ConceptsClient({ items, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeeConcept | null>(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    authoritySource: 'Asamblea general',
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setForm({ name: '', amount: '', authoritySource: 'Asamblea general', status: 'ACTIVE' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: FeeConcept) => {
    setEditing(c);
    setForm({ name: c.name, amount: String(c.amount), authoritySource: c.authoritySource, status: c.status });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.name.trim() || !form.amount.trim() || !form.authoritySource.trim()) {
      setError('Nombre, monto y fuente de autoridad son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/admin/fee-concepts/${editing.id}` : '/api/admin/fee-concepts';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          name: form.name,
          amount: Number(form.amount),
          authoritySource: form.authoritySource,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const field = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(field || data.error || 'No se pudo guardar');
      }
      const item: FeeConcept = {
        id: data.item.id,
        name: data.item.name,
        amount: Number(data.item.amount),
        authoritySource: data.item.authoritySource,
        status: data.item.status,
      };
      setRows((prev) => (editing ? prev.map((r) => (r.id === editing.id ? item : r)) : [...prev, item]));
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: FeeConcept) => {
    const next = c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/fee-concepts/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar');
      setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, status: next } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  const remove = async (c: FeeConcept) => {
    if (!confirm(`¿Eliminar el concepto "${c.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/fee-concepts/${c.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      setRows((prev) => prev.filter((r) => r.id !== c.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <button className="btn btn-primary" onClick={openNew} style={{ marginBottom: '1rem' }}>
        {showForm ? 'Ocultar formulario' : '+ Nuevo concepto'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.name}` : 'Nuevo concepto de cuota'}
          </h2>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={120}
              placeholder="Ej: Cuota de mantenimiento"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Monto (MXN) *</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="Ej: 850.00"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Fuente de autoridad *</label>
            <input
              className="form-input"
              value={form.authoritySource}
              onChange={(e) => setForm((f) => ({ ...f, authoritySource: e.target.value }))}
              maxLength={200}
              placeholder="Ej: Asamblea general"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'ACTIVE' | 'ARCHIVED' }))}>
              <option value="ACTIVE">Activo</option>
              <option value="ARCHIVED">Inactivo</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear concepto'}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="alert alert-info">No hay conceptos de cuota registrados.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto</th>
                <th>Fuente de autoridad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{mxn(c.amount)}</td>
                  <td>{c.authoritySource}</td>
                  <td>
                    <span className={c.status === 'ACTIVE' ? 'badge badge-resolved' : 'badge badge-archived'}>
                      {c.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(c)}>Editar</button>{' '}
                    <button className="btn btn-ghost" onClick={() => toggleStatus(c)}>
                      {c.status === 'ACTIVE' ? 'Archivar' : 'Activar'}
                    </button>{' '}
                    <button className="btn btn-ghost" onClick={() => remove(c)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
