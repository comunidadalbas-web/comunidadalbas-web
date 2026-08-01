'use client';

import { useState } from 'react';
import { DOCUMENT_VISIBILITIES } from '@/lib/finance/validation';

type Visibility = (typeof DOCUMENT_VISIBILITIES)[number];
interface DocumentItem {
  id: string;
  title: string;
  category: string;
  version: string;
  visibility: Visibility;
  fileUrl: string;
  sha256: string;
  approved: boolean;
  approvedAt: string | null;
}
interface Props {
  items: DocumentItem[];
  csrfToken: string;
}
const visibilityLabels: Record<Visibility, string> = {
  PUBLIC: 'Público',
  PRIVATE: 'Privado',
  RESTRICTED: 'Restringido',
};
const blank = {
  title: '',
  category: 'Institucional',
  version: '1.0',
  visibility: 'RESTRICTED' as Visibility,
  fileUrl: '',
  sha256: '',
  approved: false,
};

export default function DocumentsClient({ items, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const reset = () => {
    setForm(blank);
    setEditing(null);
    setOpen(false);
    setError('');
  };
  const edit = (item: DocumentItem) => {
    setForm({
      title: item.title,
      category: item.category,
      version: item.version,
      visibility: item.visibility,
      fileUrl: item.fileUrl,
      sha256: item.sha256,
      approved: item.approved,
    });
    setEditing(item);
    setOpen(true);
    setError('');
  };
  const save = async () => {
    const response = await fetch(
      editing ? `/api/admin/documents/${editing.id}` : '/api/admin/documents',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(form),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError((Object.values(data.fieldErrors ?? {}).flat()[0] as string) || data.error);
      return;
    }
    const item: DocumentItem = { ...data.item, approved: Boolean(data.item.approvedAt) };
    setRows((current) =>
      editing ? current.map((row) => (row.id === item.id ? item : row)) : [...current, item],
    );
    reset();
  };
  const remove = async (item: DocumentItem) => {
    if (!confirm(`¿Eliminar el registro de "${item.title}"?`)) return;
    const response = await fetch(`/api/admin/documents/${item.id}`, {
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
      {error && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className="alert alert-info">
        Los archivos se alojan en una URL HTTPS institucional; el SHA-256 permite verificar que no
        fueron sustituidos. Sólo los documentos aprobados y públicos aparecen en el sitio.
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        + Registrar documento
      </button>
      {open && (
        <div className="card" style={{ margin: '1rem 0' }}>
          <h2>{editing ? 'Editar documento' : 'Nuevo documento'}</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Título *</span>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Categoría *</span>
              <input
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Versión</span>
              <input
                className="form-input"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Visibilidad</span>
              <select
                className="form-select"
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
              >
                {DOCUMENT_VISIBILITIES.map((value) => (
                  <option key={value} value={value}>
                    {visibilityLabels[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="form-group">
            <span className="form-label">URL HTTPS del archivo *</span>
            <input
              className="form-input"
              type="url"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            />
          </label>
          <label className="form-group">
            <span className="form-label">SHA-256 *</span>
            <input
              className="form-input"
              value={form.sha256}
              maxLength={64}
              onChange={(e) => setForm({ ...form, sha256: e.target.value.toLowerCase() })}
            />
          </label>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.approved}
              onChange={(e) => setForm({ ...form, approved: e.target.checked })}
            />
            <span>Aprobado para publicación según visibilidad</span>
          </label>
          <br />
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
          No hay documentos registrados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Categoría</th>
                <th>Versión</th>
                <th>Visibilidad</th>
                <th>Integridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer">
                      <strong>{item.title}</strong>
                    </a>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.version}</td>
                  <td>
                    <span className="badge badge-review">{visibilityLabels[item.visibility]}</span>
                    {item.approved && (
                      <span className="badge badge-resolved" style={{ marginLeft: '.25rem' }}>
                        Aprobado
                      </span>
                    )}
                  </td>
                  <td>
                    <code title={item.sha256}>{item.sha256.slice(0, 12)}…</code>
                  </td>
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
