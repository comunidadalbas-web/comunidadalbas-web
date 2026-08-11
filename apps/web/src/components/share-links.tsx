'use client';

import { useState } from 'react';

export default function ShareLinks({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = new URL(path, 'https://comunidadalbas.com.mx').toString();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div aria-label="Compartir en redes" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>Compartir:</strong>
      <a className="btn btn-ghost" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className="btn btn-ghost" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <a className="btn btn-ghost" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer">X</a>
      <button type="button" className="btn btn-ghost" onClick={() => copy().catch(() => undefined)}>{copied ? 'Enlace copiado' : 'Copiar enlace'}</button>
    </div>
  );
}
