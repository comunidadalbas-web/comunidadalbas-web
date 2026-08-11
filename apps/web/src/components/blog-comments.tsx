'use client';

import { FormEvent, useState } from 'react';
import type { PublicBlogComment } from '@/lib/blog-comments';

interface Props {
  slug: string;
  initialItems: PublicBlogComment[];
  initialCursor: string | null;
}

function CommentForm({ slug, parentId, onDone }: { slug: string; parentId?: string; onDone?: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, body, parentId: parentId ?? null, privacyAccepted, website: '' }),
      });
      const data = await response.json();
      if (!response.ok) {
        const field = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(String(field || data.error || 'No se pudo enviar la opinión'));
      }
      setMessage(data.message || 'Gracias. Tu opinión fue recibida y será publicada después de su revisión.');
      setDisplayName('');
      setEmail('');
      setBody('');
      setPrivacyAccepted(false);
      onDone?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo enviar la opinión');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="comment-form">
      {message && <div className="alert alert-info" role="status">{message}</div>}
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor={`comment-name-${parentId || 'new'}`}>Nombre o alias</label>
        <input id={`comment-name-${parentId || 'new'}`} className="form-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`comment-email-${parentId || 'new'}`}>Correo electrónico</label>
        <input id={`comment-email-${parentId || 'new'}`} type="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
        <small className="form-help">Tu correo no será publicado.</small>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`comment-body-${parentId || 'new'}`}>Opinión</label>
        <textarea id={`comment-body-${parentId || 'new'}`} className="form-input" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1500} rows={parentId ? 4 : 6} required />
        <small className="form-help">{body.length}/1500 caracteres</small>
      </div>
      <label className="form-checkbox" style={{ marginBottom: '1rem' }}>
        <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} required />
        <span>He leído el <a href="/privacidad" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a> y autorizo el tratamiento de mis datos para gestionar esta participación.</span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Enviando…' : parentId ? 'Enviar respuesta' : 'Enviar opinión'}</button>
    </form>
  );
}

function CommentCard({ comment, slug, allowReply = true }: { comment: PublicBlogComment; slug: string; allowReply?: boolean }) {
  const [replying, setReplying] = useState(false);
  return (
    <article className="comment-card">
      <header>
        <strong>{comment.displayName}</strong>
        {comment.isInstitutional && <span className="badge badge-resolved" style={{ marginLeft: '0.5rem' }}>Comunidad Albas</span>}
        <time dateTime={comment.createdAt} className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
          {new Date(comment.createdAt).toLocaleDateString('es-MX')}
        </time>
      </header>
      <p style={{ whiteSpace: 'pre-wrap' }}>{comment.body}</p>
      {allowReply && <button type="button" className="btn btn-ghost" onClick={() => setReplying((value) => !value)}>{replying ? 'Cancelar' : 'Responder'}</button>}
      {allowReply && replying && <CommentForm slug={slug} parentId={comment.id} onDone={() => setReplying(false)} />}
      {comment.replies.map((reply) => <div className="comment-reply" key={reply.id}><CommentCard comment={reply} slug={slug} allowReply={false} /></div>)}
    </article>
  );
}

export default function BlogComments({ slug, initialItems, initialCursor }: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments?cursor=${encodeURIComponent(cursor)}`);
      if (!response.ok) return;
      const data = await response.json();
      setItems((current) => [...current, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="comments-section" aria-labelledby="comments-heading">
      <h2 id="comments-heading">Opiniones de la comunidad</h2>
      <CommentForm slug={slug} />
      <div style={{ marginTop: '2rem' }}>
        {items.length === 0 ? <p className="text-muted">Aún no hay opiniones publicadas.</p> : items.map((comment) => <CommentCard key={comment.id} comment={comment} slug={slug} />)}
      </div>
      {cursor && <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loading}>{loading ? 'Cargando…' : 'Ver más opiniones'}</button>}
    </section>
  );
}
