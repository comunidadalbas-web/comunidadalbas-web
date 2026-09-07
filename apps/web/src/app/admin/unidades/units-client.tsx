'use client';

import Link from 'next/link';
import { useState } from 'react';
interface Building {
  id: string;
  code: string;
  name: string;
}
interface Unit {
  id: string;
  code: string;
  apartmentNumber: string;
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  status: 'ACTIVE' | 'ARCHIVED';
}
interface Props {
  buildings: Building[];
  items: Unit[];
  csrfToken: string;
}
const blank = {
  code: '',
  apartmentNumber: '',
  buildingId: '',
  status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED',
};

export default function UnitsClient({ buildings, items, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [form, setForm] = useState({ ...blank, buildingId: buildings[0]?.id ?? '' });
  const [editing, setEditing] = useState<Unit | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const reset = () => {
    setForm({ ...blank, buildingId: buildings[0]?.id ?? '' });
    setEditing(null);
    setOpen(false);
    setError('');
  };
  const edit = (item: Unit) => {
    setEditing(item);
    setForm({
      code: item.code,
      apartmentNumber: item.apartmentNumber,
      buildingId: item.buildingId,
      status: item.status,
    });
    setOpen(true);
  };
  const save = async () => {
    const response = await fetch(editing ? `/api/admin/units/${editing.id}` : '/api/admin/units', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      setError((Object.values(data.fieldErrors ?? {}).flat()[0] as string) || data.error);
      return;
    }
    const building = buildings.find((b) => b.id === data.item.buildingId)!;
    const item: Unit = { ...data.item, buildingCode: building.code, buildingName: building.name };
    setRows((current) =>
      editing ? current.map((row) => (row.id === item.id ? item : row)) : [...current, item],
    );
    reset();
  };
  const remove = async (item: Unit) => {
    if (!confirm(`¿Eliminar ${item.code}?`)) return;
    const response = await fetch(`/api/admin/units/${item.id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrfToken },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error);
      return;
    }
    setRows((current) => current.filter((row) => row.id !== item.id));
  };
  return (
    <>
      {buildings.length === 0 && (
        <div className="alert alert-info">
          Primero registra un edificio en <Link href="/admin/edificios">Edificios</Link>. No se
          inventaron departamentos.
        </div>
      )}
      {error && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
        </div>
      )}
      <button
        className="btn btn-primary"
        disabled={buildings.length === 0}
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        + Nuevo departamento
      </button>
      {open && (
        <div className="card" style={{ margin: '1rem 0' }}>
          <h2>{editing ? 'Editar departamento' : 'Nuevo departamento'}</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Código *</span>
              <input
                className="form-input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ej. A-101"
              />
            </label>
            <label className="form-group">
              <span className="form-label">Número *</span>
              <input
                className="form-input"
                value={form.apartmentNumber}
                onChange={(e) => setForm({ ...form, apartmentNumber: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Edificio *</span>
              <select
                className="form-select"
                value={form.buildingId}
                onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Estado</span>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as 'ACTIVE' | 'ARCHIVED' })
                }
              >
                <option value="ACTIVE">Activo</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </label>
          </div>
          <button className="btn btn-primary" onClick={save}>
            Guardar
          </button>{' '}
          <button className="btn btn-ghost" onClick={reset}>
            Cancelar
          </button>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          No hay departamentos registrados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Código</th>
                <th>Departamento</th>
                <th>Edificio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.code}</strong>
                  </td>
                  <td>{item.apartmentNumber}</td>
                  <td>
                    {item.buildingCode} — {item.buildingName}
                  </td>
                  <td>{item.status === 'ACTIVE' ? 'Activo' : 'Archivado'}</td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => edit(item)}>
                      Editar
                    </button>
                    <button className="btn btn-ghost" onClick={() => remove(item)}>
                      Eliminar
                    </button>
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
