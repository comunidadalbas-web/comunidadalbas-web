'use client';

import { useState } from 'react';

type Status = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface Campana {
  id: string;
  title: string;
  description: string;
  goalAmount: string | null;
  collectedAmount: string;
  status: Status;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_CLASS: Record<Status, string> = {
  DRAFT: 'badge badge-archived',
  ACTIVE: 'badge badge-resolved',
  COMPLETED: 'badge badge-new',
  CANCELLED: 'badge badge-review',
};

interface Props {
  items: Campana[];
  total: number;
  csrfToken: string;
}

const emptyForm = {
  title: '',
  description: '',
  goalAmount: '',
  status: 'DRAFT' as Status,
  startsAt: '',
  endsAt: '',
};

export default function CampaignsClient({ items, total, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<Campana | null>(null);
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

  const openEdit = (item: Campana) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      goalAmount: item.goalAmount ?? '',
      status: item.status,
      startsAt: item.startsAt ? item.startsAt.slice(0, 10) : '',
      endsAt: item.endsAt ? item.endsAt.slice(0, 10) : '',
    });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('El título y la descripción son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        goalAmount: form.goalAmount ? Number(form.goalAmount) : undefined,
        status: form.status,
        startsAt: form.startsAt ? new Date(form.startsAt + 'T12:00:00Z').toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt + 'T12:00:00Z').toISOString() : null,
      };
      const url = editing ? `/api/admin/campaigns/${editing.id}` : '/api/admin/campaigns';
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
        setRows((prev) => [data.item, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Campana) => {
    if (!confirm(`¿Eliminar la campaña "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${item.id}`, {
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
        {showForm ? 'Ocultar formulario' : '+ Nueva campaña'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.title}` : 'Nueva campaña'}
          </h2>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={200} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <textarea className="form-textarea" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={10000} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Meta (MXN)</label>
              <input className="form-input" type="number" min="0" value={form.goalAmount} onChange={(e) => setForm((f) => ({ ...f, goalAmount: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Estado</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}>
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activa</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Inicio</label>
              <input className="form-input" type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fin</label>
              <input className="form-input" type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear campaña'}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="alert alert-info">No hay campañas registradas.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Meta</th>
                <th>Recaudado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.title}</strong>
                    <br />
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {c.description.length > 90 ? c.description.slice(0, 90) + '…' : c.description}
                    </span>
                  </td>
                  <td>{c.goalAmount ? `$${Number(c.goalAmount).toLocaleString('es-MX')}` : '—'}</td>
                  <td>${Number(c.collectedAmount).toLocaleString('es-MX')}</td>
                  <td><span className={STATUS_CLASS[c.status]}>{STATUS_LABEL[c.status]}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(c)}>Editar</button>{' '}
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
