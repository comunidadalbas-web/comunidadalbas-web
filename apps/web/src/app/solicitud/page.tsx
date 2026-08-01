'use client';

import { useState } from 'react';

type Status = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'ARCHIVED';

const STATUS_LABEL: Record<Status, string> = {
  NEW: 'Recibida',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resuelta',
  ARCHIVED: 'Archivada',
};

const STATUS_CLASS: Record<Status, string> = {
  NEW: 'badge badge-new',
  IN_REVIEW: 'badge badge-review',
  RESOLVED: 'badge badge-resolved',
  ARCHIVED: 'badge badge-archived',
};

const CATEGORY_LABEL: Record<string, string> = {
  general: 'Consulta general',
  administration: 'Administración',
  maintenance: 'Mantenimiento',
  security: 'Seguridad',
  suggestion: 'Sugerencia',
  other: 'Otro',
};

export default function SolicitudStatusPage() {
  const [folio, setFolio] = useState('');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<null | {
    folio: string;
    category: string;
    status: Status;
    createdAt: string;
  }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!folio.trim() || !email.trim()) {
      setError('Ingresa tu folio y el correo con el que realizaste la solicitud.');
      return;
    }

    setChecking(true);
    try {
      const res = await fetch('/api/solicitudes/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio: folio.trim().toUpperCase(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo consultar el estado');
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Consulta el estado de tu solicitud</h1>
      <p className="page-subtitle">
        Ingresa el folio que recibiste al enviar tu mensaje y tu correo electrónico.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '560px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="folio">Folio *</label>
          <input
            id="folio"
            className="form-input"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            placeholder="Ej: CA-2026-000123"
            maxLength={14}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Correo electrónico *</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
          />
        </div>

        {error && (
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={checking}>
          {checking ? 'Consultando...' : 'Consultar estado'}
        </button>
      </form>

      {result && (
        <div className="card" style={{ maxWidth: '560px', marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Solicitud {result.folio}</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem 1rem' }}>
            <dt className="text-muted">Categoría</dt>
            <dd>{CATEGORY_LABEL[result.category] || result.category}</dd>
            <dt className="text-muted">Fecha</dt>
            <dd>{new Date(result.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
            <dt className="text-muted">Estado</dt>
            <dd>
              <span className={STATUS_CLASS[result.status]}>{STATUS_LABEL[result.status]}</span>
            </dd>
          </dl>
        </div>
      )}
    </>
  );
}
