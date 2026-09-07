'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  csrfToken: string;
}

export default function ChangePasswordClient({ csrfToken }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        const field = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(field || data.error || 'No se pudo cambiar la contraseña');
      }
      setStatus('success');
      router.replace('/admin');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Cambio de contraseña obligatorio</h1>
      <p className="page-subtitle">
        Por seguridad debes cambiar tu contraseña temporal antes de continuar.
      </p>

      {status === 'success' && (
        <div className="alert alert-info">
          Contraseña actualizada. Redirigiendo al panel…
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="current">Contraseña actual</label>
          <input
            id="current"
            type="password"
            className="form-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new">Nueva contraseña</label>
          <input
            id="new"
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <small style={{ color: 'var(--color-text-light)' }}>Mínimo 8 caracteres.</small>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirm">Confirmar nueva contraseña</label>
          <input
            id="confirm"
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
