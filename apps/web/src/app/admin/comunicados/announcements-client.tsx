'use client';

import { useState } from 'react';

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface Comunicado {
  id: string;
  title: string;
  body: string;
  category: string;
  status: Status;
  publishedAt: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

const STATUS_CLASS: Record<Status, string> = {
  DRAFT: 'badge badge-archived',
  PUBLISHED: 'badge badge-resolved',
  ARCHIVED: 'badge badge-review',
};

const CATEGORIES = ['aviso', 'convocatoria', 'informe', 'reglamento', 'evento', 'otro'];

interface Props {
  items: Comunicado[];
  total: number;
  csrfToken: string;
}

export default function AnnouncementsClient({ items, total, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<Comunicado | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', body: '', category: 'aviso', status: 'DRAFT' as Status });

  const resetForm = () => {
    setForm({ title: '', body: '', category: 'aviso', status: 'DRAFT' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: Comunicado) => {
    setEditing(item);
    setForm({ title: item.title, body: item.body, category: item.category, status: item.status });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError('El título y el contenido son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/admin/announcements/${editing.id}` : '/api/admin/announcements';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo guardar');
      }
      const data = await res.json();
      if (editing) {
        setRows((prev) => prev.map((r) => (r.id === editing.id ? data.item : r)));
      } else {
        setRows((prev) => [data.item, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item: Comunicado, status: Status) => {
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo actualizar');
      }
      const data = await res.json();
      setRows((prev) => prev.map((r) => (r.id === item.id ? data.item : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  const remove = async (item: Comunicado) => {
    if (!confirm(`¿Eliminar el comunicado "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo eliminar');
      }
      setRows((prev) => prev.filter((r) => r.id !== item.id));
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
        {showForm ? 'Ocultar formulario' : '+ Nuevo comunicado'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.title}` : 'Nuevo comunicado'}
          </h2>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contenido *</label>
            <textarea
              className="form-textarea"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              maxLength={10000}
              rows={5}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear comunicado'}
            </button>
            {showForm && (
              <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="alert alert-info">No hay comunicados registrados.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Publicado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <br />
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {a.body.length > 90 ? a.body.slice(0, 90) + '…' : a.body}
                    </span>
                  </td>
                  <td>{a.category}</td>
                  <td><span className={STATUS_CLASS[a.status]}>{STATUS_LABEL[a.status]}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(a)}>Editar</button>{' '}
                    {a.status === 'DRAFT' && (
                      <button className="btn btn-primary" onClick={() => changeStatus(a, 'PUBLISHED')}>Publicar</button>
                    )}
                    {a.status === 'PUBLISHED' && (
                      <button className="btn btn-ghost" onClick={() => changeStatus(a, 'ARCHIVED')}>Archivar</button>
                    )}
                    {' '}
                    <button className="btn btn-ghost" onClick={() => remove(a)}>Eliminar</button>
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
