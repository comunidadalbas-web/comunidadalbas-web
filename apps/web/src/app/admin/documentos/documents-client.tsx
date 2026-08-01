'use client';

import { useState } from 'react';
import { DOCUMENT_VISIBILITIES } from '@/lib/finance/validation';
import FileUploadField from '@/components/admin/file-upload-field';

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
        <strong>Cómo funciona:</strong> carga un PDF público desde tu equipo o pega una URL HTTPS
        institucional. Al cargarlo, el sistema completa la URL y calcula automáticamente la huella
        SHA-256. El documento sólo aparece en <code>/documentos</code> cuando su visibilidad es
        <strong> Público</strong> y marcas la aprobación.
      </div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '.6rem' }}>Qué significa cada campo</h2>
        <ul style={{ marginLeft: '1.25rem', lineHeight: 1.6 }}>
          <li><strong>Título:</strong> nombre claro que verá la comunidad.</li>
          <li><strong>Categoría:</strong> agrupa documentos, por ejemplo Normativa, Institucional o Transparencia.</li>
          <li><strong>Versión:</strong> identifica la edición; usa 1.0 si es la primera publicada.</li>
          <li><strong>Público:</strong> puede mostrarse en el sitio al aprobarlo.</li>
          <li><strong>Restringido o privado:</strong> sólo se registra en el panel; la URL externa debe tener su propio control de acceso.</li>
          <li><strong>SHA-256:</strong> huella digital de 64 caracteres que permite detectar si el archivo fue sustituido.</li>
        </ul>
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
          {form.visibility === 'PUBLIC' ? (
            <FileUploadField
              kind="document"
              label="Cargar PDF desde este equipo"
              value={form.fileUrl}
              csrfToken={csrfToken}
              help="PDF público, máximo 25 MB. La carga no lo publica por sí sola: todavía debes guardar y aprobar el registro. No cargues información confidencial."
              onUploaded={(file) =>
                setForm((current) => ({
                  ...current,
                  fileUrl: file.url,
                  sha256: file.sha256 ?? current.sha256,
                }))
              }
            />
          ) : (
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
              La carga directa está reservada a PDFs públicos. Para un documento privado o
              restringido, pega una URL HTTPS que ya aplique autenticación o control de acceso.
            </div>
          )}
          <label className="form-group">
            <span className="form-label">URL HTTPS del archivo *</span>
            <input
              className="form-input"
              type="url"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            />
            <small className="form-help">Se completa automáticamente al cargar un PDF; también puedes pegar una URL institucional existente.</small>
          </label>
          <label className="form-group">
            <span className="form-label">SHA-256 *</span>
            <input
              className="form-input"
              value={form.sha256}
              maxLength={64}
              onChange={(e) => setForm({ ...form, sha256: e.target.value.toLowerCase() })}
            />
            <small className="form-help">Se calcula automáticamente al cargar. Si usas una URL externa, obtén la huella del archivo original antes de registrarlo.</small>
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
