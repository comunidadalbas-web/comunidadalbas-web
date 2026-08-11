'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

const GENERIC_MESSAGE = 'Si existe una cuenta asociada, recibirás instrucciones para restablecer tu contraseña.';

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      setMessage(GENERIC_MESSAGE);
      setSending(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 440, margin: '2rem auto' }}>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Recuperar contraseña</h1>
      <p className="page-subtitle">Ingresa el correo institucional asociado a tu cuenta.</p>
      {message ? (
        <div className="alert alert-info" role="status">{message}</div>
      ) : (
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="recovery-email">Correo institucional</label>
            <input
              id="recovery-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              maxLength={254}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar instrucciones'}
          </button>
        </form>
      )}
      <p style={{ marginTop: '1rem' }}><Link href="/login">Volver al acceso</Link></p>
    </div>
  );
}
