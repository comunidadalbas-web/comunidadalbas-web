'use client';

import { useCallback, useEffect, useState } from 'react';

interface StatusData {
  env: string;
  tokenConfigured: boolean;
  webhookSecretConfigured: boolean;
  webhookUrl: string;
  lastOrder: { orderId: string; status: string; statusDetail: string; amount: string; createdAt: string } | null;
  lastWebhook: {
    id: string; topic: string; resource: string; action: string;
    signatureValid: boolean; duplicate: boolean; processed: boolean;
    processResult: string | null; createdAt: string;
  } | null;
  orderCount: number;
  isProduction: boolean;
  pilotEnabled: boolean;
  pilotAmount: string;
  allowedEmails: string[];
}

interface OrderResult {
  success?: boolean;
  orderId?: string;
  status?: string;
  statusDetail?: string;
  paymentId?: string;
  reference?: string;
  ticketUrl?: string;
  expiresAt?: string;
  error?: string;
  hasTicketUrl?: boolean;
  hasReference?: boolean;
  amount?: string;
  isPilot?: boolean;
  createdAt?: string;
  local?: Record<string, unknown>;
  mp?: Record<string, unknown>;
}

export default function PruebaSpeiPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [consultResult, setConsultResult] = useState<OrderResult | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations/mercadopago/status');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const createOrder = async () => {
    setCreating(true);
    setOrderResult(null);
    setError('');
    try {
      const res = await fetch('/api/admin/integrations/mercadopago/test-spei-order', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al crear orden'); return; }
      setOrderResult(data);
      if (data.orderId) setLastOrderId(data.orderId);
      fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setCreating(false);
    }
  };

  const consultOrder = async () => {
    if (!lastOrderId) return;
    setConsulting(true);
    setConsultResult(null);
    setError('');
    try {
      const res = await fetch(`/api/admin/integrations/mercadopago/orders/${lastOrderId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al consultar'); return; }
      setConsultResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setConsulting(false);
    }
  };

  if (loading) return <div className="container"><p className="page-title">Cargando...</p></div>;

  return (
    <div className="container">
      <h1 className="page-title">Prueba SPEI — Mercado Pago</h1>

      <div className="alert alert-warning">
        <strong>⚠️ Esta es una orden de prueba y no procesa dinero real.</strong>
        {status?.isProduction && <span> El ambiente es PRODUCCIÓN — las órdenes usarán credenciales reales.</span>}
      </div>

      <section className="info-section">
        <h2>Estado del sistema</h2>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td>Ambiente</td><td><strong>{status?.env === 'production' ? 'PRODUCCIÓN' : 'Pruebas'}</strong></td></tr>
            <tr><td>Access Token configurado</td><td>{status?.tokenConfigured ? '✅ Sí' : '❌ No'}</td></tr>
            <tr><td>Webhook Secret configurado</td><td>{status?.webhookSecretConfigured ? '✅ Sí' : '❌ No'}</td></tr>
            <tr><td>Endpoint Webhook</td><td><code>{status?.webhookUrl}</code></td></tr>
            <tr><td>Órdenes creadas</td><td>{status?.orderCount}</td></tr>
            <tr><td>Piloto productivo</td><td>{status?.pilotEnabled ? '✅ Habilitado' : '🔒 Bloqueado'}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="info-section" style={{ marginTop: '1.5rem' }}>
        <h2>Crear orden SPEI de prueba</h2>
        <p>Importe fijo: <strong>$200.00 MXN</strong></p>
        <p>Correo: <code>test_user_mx@testuser.com</code></p>
        <p>Referencia externa: <code>ALB-TEST-SPEI-001</code></p>
        <button className="btn btn-primary" onClick={createOrder} disabled={creating} style={{ marginTop: '0.75rem' }}>
          {creating ? 'Creando...' : 'Crear orden SPEI de prueba'}
        </button>
      </section>

      {orderResult && (
        <section className="info-section" style={{ marginTop: '1.5rem' }}>
          <h2>Resultado de la orden</h2>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td>Order ID</td><td><code>{orderResult.orderId}</code></td></tr>
              <tr><td>Estado</td><td><strong>{orderResult.status}</strong> / {orderResult.statusDetail}</td></tr>
              <tr><td>Payment ID</td><td>{orderResult.paymentId || '—'}</td></tr>
              <tr><td>Referencia SPEI</td><td><code>{orderResult.reference || '—'}</code></td></tr>
              <tr><td>Importe</td><td>$200.00 MXN</td></tr>
              <tr><td>Ticket URL</td><td>{orderResult.hasTicketUrl ? '✅ Generada' : '❌ No disponible'}</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            {orderResult.ticketUrl && (
              <a href={orderResult.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Abrir instrucciones SPEI
              </a>
            )}
            <button className="btn btn-secondary" onClick={consultOrder} disabled={consulting}>
              {consulting ? 'Consultando...' : 'Consultar estado'}
            </button>
          </div>
        </section>
      )}

      {consultResult && (
        <section className="info-section" style={{ marginTop: '1.5rem' }}>
          <h2>Consulta de orden</h2>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td colSpan={2}><strong>Registro local</strong></td></tr>
              {consultResult.local && Object.entries(consultResult.local).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{typeof v === 'boolean' ? (v ? '✅' : '❌') : String(v)}</td></tr>
              ))}
              <tr><td colSpan={2}><strong>Mercado Pago API</strong></td></tr>
              {consultResult.mp && Object.entries(consultResult.mp).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{typeof v === 'boolean' ? (v ? '✅' : '❌') : String(v)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="info-section" style={{ marginTop: '1.5rem' }}>
        <h2>Estado del Webhook</h2>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td>Endpoint configurado</td><td><code>{status?.webhookUrl}</code></td></tr>
            <tr><td>Secret configurado</td><td>{status?.webhookSecretConfigured ? '✅ Sí' : '❌ No'}</td></tr>
            {status?.lastWebhook ? (
              <>
                <tr><td>Último evento</td><td><code>{status.lastWebhook.id}</code></td></tr>
                <tr><td>Tópico</td><td>{status.lastWebhook.topic}</td></tr>
                <tr><td>Recurso</td><td>{status.lastWebhook.resource}</td></tr>
                <tr><td>Acción</td><td>{status.lastWebhook.action || '—'}</td></tr>
                <tr><td>Firma válida</td><td>{status.lastWebhook.signatureValid ? '✅' : '❌'}</td></tr>
                <tr><td>Duplicado</td><td>{status.lastWebhook.duplicate ? '⚠️ Sí' : 'No'}</td></tr>
                <tr><td>Procesado</td><td>{status.lastWebhook.processed ? '✅' : '⏳'}</td></tr>
                <tr><td>Resultado</td><td>{status.lastWebhook.processResult || '—'}</td></tr>
              </>
            ) : (
              <tr><td colSpan={2}>No se han recibido eventos webhook aún</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
