'use client';

import { useState } from 'react';
import { DOCUMENT_VISIBILITIES } from '@/lib/finance/validation';
import DocumentUploadField from '@/components/admin/document-upload-field';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_DETAILS,
  formatFileSize,
  type DocumentCategory,
  type DocumentStorageProvider,
} from '@/lib/documents';

type Visibility = (typeof DOCUMENT_VISIBILITIES)[number];
interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  documentDate: string;
  visibility: Visibility;
  fileUrl: string;
  fileSizeBytes: number | null;
  storageProvider: string;
  storageKey: string | null;
  sha256: string;
  isPermanent: boolean;
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
  description: '',
  category: 'Estatutos y reglamentos' as DocumentCategory,
  version: '1.0',
  documentDate: '',
  visibility: 'RESTRICTED' as Visibility,
  fileUrl: '',
  fileSizeBytes: null as number | null,
  storageProvider: 'EXTERNAL' as DocumentStorageProvider,
  storageKey: null as string | null,
  sha256: '',
  isPermanent: true,
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
      description: item.description,
      category: item.category as DocumentCategory,
      version: item.version,
      documentDate: item.documentDate,
      visibility: item.visibility,
      fileUrl: item.fileUrl,
      fileSizeBytes: item.fileSizeBytes,
      storageProvider: item.storageProvider as DocumentStorageProvider,
      storageKey: item.storageKey,
      sha256: item.sha256,
      isPermanent: item.isPermanent,
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
        <strong>Carga directa segura:</strong> el PDF viaja desde este panel a Supabase Storage con
        una autorización temporal; la clave administrativa nunca llega al navegador. También puedes
        pegar una URL HTTPS institucional. El sistema registra procedencia, tamaño y huella SHA-256.
        El documento sólo aparece en <code>/documentos</code> cuando su visibilidad es{' '}
        <strong>Público</strong> y marcas la aprobación.
      </div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '.6rem' }}>Qué significa cada campo</h2>
        <ul style={{ marginLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>
            <strong>Título:</strong> nombre claro que verá la comunidad.
          </li>
          <li>
            <strong>Categoría:</strong> determina su ubicación en la biblioteca de transparencia.
          </li>
          <li>
            <strong>Versión:</strong> identifica la edición; usa 1.0 si es la primera publicada.
          </li>
          <li>
            <strong>Fecha documental:</strong> fecha del acta, informe, convocatoria o edición.
          </li>
          <li>
            <strong>Público:</strong> puede mostrarse en el sitio al aprobarlo.
          </li>
          <li>
            <strong>Restringido o privado:</strong> sólo se registra en el panel; la URL externa
            debe tener su propio control de acceso.
          </li>
          <li>
            <strong>SHA-256:</strong> huella digital de 64 caracteres que permite detectar si el
            archivo fue sustituido.
          </li>
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
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => {
                  const category = e.target.value as DocumentCategory;
                  setForm({
                    ...form,
                    category,
                    isPermanent: DOCUMENT_CATEGORY_DETAILS[category].permanent,
                  });
                }}
              >
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
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
              <span className="form-label">Fecha documental</span>
              <input
                className="form-input"
                type="date"
                value={form.documentDate}
                onChange={(e) => setForm({ ...form, documentDate: e.target.value })}
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
            <span className="form-label">Descripción pública</span>
            <textarea
              className="form-textarea"
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          {form.visibility === 'PUBLIC' ? (
            <DocumentUploadField
              csrfToken={csrfToken}
              onUploaded={(file) =>
                setForm((current) => ({
                  ...current,
                  fileUrl: file.url,
                  fileSizeBytes: file.size,
                  storageProvider: file.storageProvider,
                  storageKey: file.key,
                  sha256: file.sha256,
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
              onChange={(e) =>
                setForm({
                  ...form,
                  fileUrl: e.target.value,
                  storageProvider: 'EXTERNAL',
                  storageKey: null,
                  fileSizeBytes: null,
                })
              }
            />
            <small className="form-help">
              Se completa automáticamente al cargar un PDF; también puedes pegar una URL
              institucional existente.
            </small>
          </label>
          {form.fileSizeBytes && (
            <p className="text-muted">
              Archivo registrado: {formatFileSize(form.fileSizeBytes)} · {form.storageProvider}
            </p>
          )}
          <label className="form-group">
            <span className="form-label">SHA-256 *</span>
            <input
              className="form-input"
              value={form.sha256}
              maxLength={64}
              onChange={(e) => setForm({ ...form, sha256: e.target.value.toLowerCase() })}
            />
            <small className="form-help">
              Se calcula automáticamente al cargar. Si usas una URL externa, obtén la huella del
              archivo original antes de registrarlo.
            </small>
          </label>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={form.isPermanent}
              onChange={(e) => setForm({ ...form, isPermanent: e.target.checked })}
            />
            <span>Documento permanente (protege el registro contra eliminación accidental)</span>
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
                <th>Fecha / tamaño</th>
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
                    {item.documentDate || 'Sin fecha'}
                    {item.fileSizeBytes ? (
                      <>
                        <br />
                        <span className="text-muted">{formatFileSize(item.fileSizeBytes)}</span>
                      </>
                    ) : null}
                  </td>
                  <td>
                    <span className="badge badge-review">{visibilityLabels[item.visibility]}</span>
                    {item.approved && (
                      <span className="badge badge-resolved" style={{ marginLeft: '.25rem' }}>
                        Aprobado
                      </span>
                    )}
                    {item.isPermanent && (
                      <span className="badge badge-review" style={{ marginLeft: '.25rem' }}>
                        Permanente
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
                    <button
                      className="btn btn-ghost"
                      onClick={() => remove(item)}
                      disabled={item.isPermanent}
                      title={
                        item.isPermanent
                          ? 'Edita el registro y desmarca Permanente antes de eliminarlo.'
                          : undefined
                      }
                    >
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
