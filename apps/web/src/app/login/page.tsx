'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'success'>('idle');
  const [error, setError] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      const target = mustChangePassword ? '/admin/change-password' : next;
      const safeNext = target.startsWith('/') && !target.startsWith('//') ? target : '/admin';
      router.replace(safeNext);
    }
  }, [status, next, router, mustChangePassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo iniciar sesión');
      }
      const data = await res.json();
      setMustChangePassword(Boolean(data.user?.mustChangePassword));
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h1 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Acceso administrativo</h1>

      {status === 'error' && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
        Acceso restringido al personal autorizado de Comunidad Albas.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
