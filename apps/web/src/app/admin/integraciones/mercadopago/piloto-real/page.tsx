'use client';

import { useCallback, useEffect, useState } from 'react';

interface PilotStatus {
  env: string;
  pilotEnabled: boolean;
  tokenConfigured: boolean;
  prodTokenConfigured: boolean;
  allowedEmails: string[];
  pilotAmount: string;
  orderCount: number;
  lastPilotOrder: {
    orderId: string; status: string; statusDetail: string;
    reference: string | null; amount: string; createdAt: string;
  } | null;
}

export default function PilotoRealPage() {
  const [status, setStatus] = useState<PilotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations/mercadopago/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const blocked = !status?.pilotEnabled || status?.env !== 'production';

  if (loading) return <div className="container"><p className="page-title">Cargando...</p></div>;

  return (
    <div className="container">
      <h1 className="page-title">Piloto Real — Mercado Pago</h1>

      {blocked ? (
        <div className="alert alert-warning">
          <strong>🔒 Piloto bloqueado</strong>
          <p style={{ marginTop: '0.5rem' }}>Esta pantalla solo está disponible cuando:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><code>MERCADOPAGO_ENV=production</code> — Actual: <strong>{status?.env}</strong></li>
            <li><code>PAYMENTS_PILOT_ENABLED=true</code> — Actual: <strong>{status?.pilotEnabled ? 'true' : 'false'}</strong></li>
            <li>Tu correo esté en <code>PAYMENTS_ALLOWED_EMAILS</code></li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>
            Para activar, configura estas variables en Vercel y redespliega.
          </p>
        </div>
      ) : (
        <>
          <div className="alert alert-warning">
            <strong>⚡ Piloto productivo activo</strong>
            <p style={{ marginTop: '0.5rem' }}>
              Este módulo crea órdenes de pago reales. Usa importe fijo de ${status?.pilotAmount} MXN.
              Los movimientos se marcan como piloto y se excluyen de saldos comunitarios.
            </p>
          </div>

          <section className="info-section">
            <h2>Estado</h2>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td>Ambiente</td><td><strong>PRODUCCIÓN</strong></td></tr>
                <tr><td>Token PROD configurado</td><td>{status?.prodTokenConfigured ? '✅' : '❌'}</td></tr>
                <tr><td>Importe piloto</td><td>${status?.pilotAmount} MXN</td></tr>
                <tr><td>Correos autorizados</td><td>{status?.allowedEmails?.join(', ') || 'Ninguno'}</td></tr>
                <tr><td>Órdenes piloto anteriores</td><td>{status?.lastPilotOrder ? `Última: ${status.lastPilotOrder.orderId} (${status.lastPilotOrder.status})` : 'Ninguna'}</td></tr>
              </tbody>
            </table>
          </section>

          <section className="info-section" style={{ marginTop: '1.5rem' }}>
            <h2>Crear orden piloto</h2>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
              <span>Confirmo que esta es una orden de pago real por ${status?.pilotAmount} MXN. No se podrá cancelar automáticamente.</span>
            </label>
            <button className="btn btn-primary" disabled={!confirmed}>
              Crear orden piloto
            </button>
          </section>
        </>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>
      )}
    </div>
  );
}
