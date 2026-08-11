'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        const field = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(String(field || data.error || 'No se pudo restablecer la contraseña'));
      }
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo restablecer la contraseña');
    } finally {
      setSending(false);
    }
  };

  if (!token) {
    return <div className="alert alert-warning">El enlace de restablecimiento no es válido.</div>;
  }
  if (success) {
    return <div className="alert alert-info">Contraseña actualizada. <Link href="/login">Inicia sesión</Link>.</div>;
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="new-password">Nueva contraseña</label>
        <input id="new-password" type="password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={200} required />
        <small className="form-help">Mínimo 12 caracteres.</small>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="confirm-password">Confirmar nueva contraseña</label>
        <input id="confirm-password" type="password" className="form-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={200} required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Guardando…' : 'Restablecer contraseña'}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="card" style={{ maxWidth: 440, margin: '2rem auto' }}>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Restablecer contraseña</h1>
      <Suspense fallback={<p>Cargando…</p>}><ResetPasswordForm /></Suspense>
    </div>
  );
}
