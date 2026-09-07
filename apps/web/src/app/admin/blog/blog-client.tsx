'use client';

import { useState } from 'react';
import FileUploadField from '@/components/admin/file-upload-field';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  commentsEnabled: boolean;
  commentCounts: { total: number; pending: number; published: number };
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  items: BlogPost[];
  total: number;
  csrfToken: string;
}

const STATUS_LABEL: Record<BlogPost['status'], string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export default function BlogClient({ items, total, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [count, setCount] = useState(total);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    slugTouched: false,
    summary: '',
    content: '',
    coverImageUrl: '',
    coverImageAlt: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setForm({ title: '', slug: '', slugTouched: false, summary: '', content: '', coverImageUrl: '', coverImageAlt: '', status: 'DRAFT' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      slugTouched: true,
      summary: p.summary ?? '',
      content: p.content,
      coverImageUrl: p.coverImageUrl ?? '',
      coverImageAlt: p.coverImageAlt ?? '',
      status: p.status,
    });
    setShowForm(true);
    setError('');
  };

  const updateTitle = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      ...(f.slugTouched ? {} : { slug: slugify(title) }),
    }));
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('El título y el contenido son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : '/api/admin/blog';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          title: form.title,
          slug: form.slugTouched && form.slug.trim() ? form.slug.trim() : undefined,
          summary: form.summary,
          content: form.content,
          coverImageUrl: form.coverImageUrl,
          coverImageAlt: form.coverImageAlt,
          status: form.status,
          commentsEnabled: editing?.commentsEnabled ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const field = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(field || data.error || 'No se pudo guardar');
      }
      const item: BlogPost = {
        id: data.item.id,
        title: data.item.title,
        slug: data.item.slug,
        summary: data.item.summary ?? null,
        content: data.item.content,
        coverImageUrl: data.item.coverImageUrl ?? null,
        coverImageAlt: data.item.coverImageAlt ?? null,
        status: data.item.status,
        commentsEnabled: data.item.commentsEnabled ?? false,
        commentCounts: editing?.commentCounts ?? { total: 0, pending: 0, published: 0 },
        authorName: editing ? editing.authorName : (data.item.authorName ?? ''),
        publishedAt: data.item.publishedAt ?? null,
        createdAt: editing ? editing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (editing) {
        setRows((prev) => prev.map((r) => (r.id === editing.id ? item : r)));
      } else {
        setRows((prev) => [item, ...prev]);
        setCount((c) => c + 1);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (p: BlogPost, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      const res = await fetch(`/api/admin/blog/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar');
      setRows((prev) => prev.map((r) => (r.id === p.id ? { ...r, status, publishedAt: data.item.publishedAt?.toISOString() ?? r.publishedAt } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  const remove = async (p: BlogPost) => {
    if (!confirm(`¿Eliminar la publicación "${p.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/blog/${p.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar');
      setRows((prev) => prev.filter((r) => r.id !== p.id));
      setCount((c) => Math.max(0, c - 1));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  const toggleComments = async (p: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/blog/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ commentsEnabled: !p.commentsEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar');
      setRows((current) => current.map((row) => row.id === p.id ? { ...row, commentsEnabled: data.item.commentsEnabled } : row));
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'No se pudo actualizar');
    }
  };

  const statusBadge = (status: BlogPost['status']) =>
    status === 'PUBLISHED' ? 'badge badge-resolved' : status === 'DRAFT' ? 'badge badge-review' : 'badge badge-archived';

  return (
    <>
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <button className="btn btn-primary" onClick={openNew} style={{ marginBottom: '1rem' }}>
        {showForm ? 'Ocultar formulario' : '+ Nueva publicación'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.title}` : 'Nueva publicación'}
          </h2>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => updateTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Slug (URL)</label>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
              maxLength={160}
              placeholder="Se genera automáticamente desde el título"
            />
            <small style={{ color: 'var(--color-text-light)' }}>Se usará en la URL pública: /blog/{form.slug || '...'}</small>
          </div>
          <div className="form-group">
            <label className="form-label">Resumen</label>
            <textarea
              className="form-input"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              maxLength={500}
              rows={2}
              placeholder="Breve resumen para la lista"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contenido *</label>
            <textarea
              className="form-input"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              maxLength={50000}
              rows={12}
              placeholder="Escribe la publicación. Separa párrafos con líneas en blanco."
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL de imagen de portada (alternativa)</label>
            <input
              className="form-input"
              value={form.coverImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
              maxLength={500}
              placeholder="https://..."
            />
            <small className="form-help">Puedes pegar una URL HTTPS existente o cargar una imagen desde tu equipo.</small>
          </div>
          <FileUploadField
            kind="image"
            label="Cargar imagen de portada"
            value={form.coverImageUrl}
            csrfToken={csrfToken}
            onUploaded={(file) => setForm((current) => ({ ...current, coverImageUrl: file.url }))}
          />
          <div className="form-group">
            <label className="form-label">Descripción accesible de la imagen</label>
            <input
              className="form-input"
              value={form.coverImageAlt}
              onChange={(e) => setForm((current) => ({ ...current, coverImageAlt: e.target.value }))}
              maxLength={240}
              placeholder="Ejemplo: Vecinas y vecinos participando en una jornada comunitaria"
            />
            <small className="form-help">Describe brevemente lo que muestra la imagen para personas que usan lectores de pantalla.</small>
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }))}
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear publicación'}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="alert alert-info">No hay publicaciones registradas.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Título</th>
                <th>Slug</th>
                <th>Autor</th>
                <th>Estado</th>
                <th>Publicado</th>
                <th>Opiniones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.title}</strong></td>
                  <td><code>/blog/{p.slug}</code></td>
                  <td>{p.authorName}</td>
                  <td><span className={statusBadge(p.status)}>{STATUS_LABEL[p.status]}</span></td>
                  <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('es-MX') : '—'}</td>
                  <td>
                    <div>{p.commentCounts.total} totales · {p.commentCounts.pending} pendientes · {p.commentCounts.published} publicadas</div>
                    <button className="btn btn-ghost" onClick={() => toggleComments(p)}>
                      {p.commentsEnabled ? 'Deshabilitar opiniones' : 'Habilitar opiniones'}
                    </button>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(p)}>Editar</button>{' '}
                    {p.status === 'PUBLISHED' ? (
                      <button className="btn btn-ghost" onClick={() => setStatus(p, 'DRAFT')}>Despublicar</button>
                    ) : p.status === 'DRAFT' ? (
                      <button className="btn btn-ghost" onClick={() => setStatus(p, 'PUBLISHED')}>Publicar</button>
                    ) : null}{' '}
                    <button className="btn btn-ghost" onClick={() => remove(p)}>Eliminar</button>
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
