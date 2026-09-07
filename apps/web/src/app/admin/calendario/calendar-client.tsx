'use client';

import { useState } from 'react';

type Status = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

interface Evento {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  status: Status;
}

const STATUS_LABEL: Record<Status, string> = {
  SCHEDULED: 'Programado',
  COMPLETED: 'Realizado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASS: Record<Status, string> = {
  SCHEDULED: 'badge badge-new',
  COMPLETED: 'badge badge-resolved',
  CANCELLED: 'badge badge-review',
};

interface Props {
  items: Evento[];
  total: number;
  csrfToken: string;
}

const emptyForm = {
  title: '',
  description: '',
  location: '',
  startsAt: '',
  endsAt: '',
  status: 'SCHEDULED' as Status,
};

export default function CalendarClient({ items, total, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: Evento) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? '',
      location: item.location ?? '',
      startsAt: item.startsAt.slice(0, 10) + 'T' + item.startsAt.slice(11, 16),
      endsAt: item.endsAt ? item.endsAt.slice(0, 10) + 'T' + item.endsAt.slice(11, 16) : '',
      status: item.status,
    });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.title.trim() || !form.startsAt) {
      setError('El título y la fecha de inicio son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        status: form.status,
      };
      const url = editing ? `/api/admin/calendar-events/${editing.id}` : '/api/admin/calendar-events';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo guardar');
      }
      const data = await res.json();
      if (editing) {
        setRows((prev) => prev.map((r) => (r.id === editing.id ? data.item : r)));
      } else {
        setRows((prev) => [...prev, data.item].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Evento) => {
    if (!confirm(`¿Eliminar el evento "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/calendar-events/${item.id}`, {
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
        {showForm ? 'Ocultar formulario' : '+ Nuevo evento'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.title}` : 'Nuevo evento'}
          </h2>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={200} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={2000} />
          </div>
          <div className="form-group">
            <label className="form-label">Ubicación</label>
            <input className="form-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} maxLength={200} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Inicio *</label>
              <input className="form-input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fin</label>
              <input className="form-input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Estado</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}>
                <option value="SCHEDULED">Programado</option>
                <option value="COMPLETED">Realizado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear evento'}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="alert alert-info">No hay eventos registrados.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Evento</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(e.startsAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <br />
                    <span className="text-muted">{new Date(e.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td>
                    <strong>{e.title}</strong>
                    {e.description && (
                      <br />
                    )}
                    {e.description && (
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {e.description.length > 80 ? e.description.slice(0, 80) + '…' : e.description}
                      </span>
                    )}
                  </td>
                  <td>{e.location || '—'}</td>
                  <td><span className={STATUS_CLASS[e.status]}>{STATUS_LABEL[e.status]}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(e)}>Editar</button>{' '}
                    <button className="btn btn-ghost" onClick={() => remove(e)}>Eliminar</button>
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
