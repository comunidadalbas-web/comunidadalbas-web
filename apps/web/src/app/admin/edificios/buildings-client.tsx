'use client';

import { useState } from 'react';

interface Building {
  id: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'ARCHIVED';
  units: number;
}

interface Props {
  items: Building[];
  csrfToken: string;
}

export default function BuildingsClient({ items, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({ code: '', name: '', status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setForm({ code: '', name: '', status: 'ACTIVE' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (b: Building) => {
    setEditing(b);
    setForm({ code: b.code, name: b.name, status: b.status });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('El código y el nombre son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/admin/buildings/${editing.id}` : '/api/admin/buildings';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const field = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(field || data.error || 'No se pudo guardar');
      }
      setRows((prev) =>
        editing
          ? prev.map((r) => (r.id === editing.id ? { ...r, ...data.item, units: r.units } : r))
          : [...prev, { id: data.item.id, code: data.item.code, name: data.item.name, status: data.item.status, units: 0 }],
      );
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (b: Building) => {
    const next = b.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/buildings/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar');
      setRows((prev) => prev.map((r) => (r.id === b.id ? { ...r, status: next } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  const remove = async (b: Building) => {
    if (!confirm(`¿Eliminar el edificio ${b.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/buildings/${b.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      setRows((prev) => prev.filter((r) => r.id !== b.id));
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
        {showForm ? 'Ocultar formulario' : '+ Nuevo edificio'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.name}` : 'Nuevo edificio'}
          </h2>
          <div className="form-group">
            <label className="form-label">Código *</label>
            <input
              className="form-input"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              maxLength={20}
              placeholder="Ej: B01"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={120}
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
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear edificio'}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="alert alert-info">No hay edificios registrados.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Departamentos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.code}</strong></td>
                  <td>{b.name}</td>
                  <td>{b.units}</td>
                  <td>
                    <span className={b.status === 'ACTIVE' ? 'badge badge-resolved' : 'badge badge-archived'}>
                      {b.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(b)}>Editar</button>{' '}
                    <button className="btn btn-ghost" onClick={() => toggleStatus(b)}>
                      {b.status === 'ACTIVE' ? 'Archivar' : 'Activar'}
                    </button>{' '}
                    <button className="btn btn-ghost" onClick={() => remove(b)}>Eliminar</button>
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
