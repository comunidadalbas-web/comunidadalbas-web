'use client';

import { useState } from 'react';

type CommentStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export interface AdminComment {
  id: string;
  postTitle: string;
  parentId: string | null;
  displayName: string;
  email: string;
  body: string;
  status: CommentStatus;
  isInstitutional: boolean;
  createdAt: string;
}

export default function CommentsAdmin({ initialItems, csrfToken }: { initialItems: AdminComment[]; csrfToken: string }) {
  const [items, setItems] = useState(initialItems);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const update = async (id: string, payload: { status: CommentStatus } | { replyBody: string }) => {
    const response = await fetch(`/api/admin/blog/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo actualizar');
    if ('status' in payload) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: payload.status } : item));
    } else {
      setReplyText((current) => ({ ...current, [id]: '' }));
      alert('Respuesta institucional publicada.');
    }
  };

  return (
    <section className="info-section">
      <h2>Moderación de opiniones</h2>
      {items.length === 0 ? <div className="alert alert-info">No hay opiniones recibidas.</div> : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map((comment) => (
            <article key={comment.id} className="card">
              <p><strong>{comment.displayName}</strong> · {comment.email} · {comment.status}</p>
              <p className="text-muted">{comment.postTitle} · {new Date(comment.createdAt).toLocaleString('es-MX')}</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={() => update(comment.id, { status: 'PUBLISHED' }).catch((reason) => alert(reason.message))}>Aprobar</button>
                <button className="btn btn-ghost" onClick={() => update(comment.id, { status: 'REJECTED' }).catch((reason) => alert(reason.message))}>Rechazar</button>
                <button className="btn btn-ghost" onClick={() => update(comment.id, { status: 'ARCHIVED' }).catch((reason) => alert(reason.message))}>Archivar</button>
              </div>
              {!comment.parentId && comment.status === 'PUBLISHED' && (
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor={`admin-reply-${comment.id}`}>Respuesta institucional</label>
                  <textarea id={`admin-reply-${comment.id}`} className="form-input" maxLength={1500} rows={3} value={replyText[comment.id] || ''} onChange={(event) => setReplyText((current) => ({ ...current, [comment.id]: event.target.value }))} />
                  <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} disabled={!replyText[comment.id]?.trim()} onClick={() => update(comment.id, { replyBody: replyText[comment.id] }).catch((reason) => alert(reason.message))}>Publicar como Comunidad Albas</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
