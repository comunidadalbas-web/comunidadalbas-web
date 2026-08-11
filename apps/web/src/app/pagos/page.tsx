'use client';

import { useCallback, useEffect, useState } from 'react';

interface Concept {
  code: string;
  name: string;
  description: string;
  fixedAmount: string | null;
  allowsCustomAmount: boolean;
}

interface Config {
  enabled: boolean;
  environment: string;
  cuotaAmount: string;
  maxExtraordinaryAmount: string;
  concepts: Concept[];
}

interface OrderResult {
  orderId: string;
  status: string;
  statusDetail: string;
  paymentId: string | null;
  reference: string | null;
  ticketUrl: string | null;
  expiresAt: string | null;
  amount: string;
  conceptName: string;
  building: string;
  apartment: string;
  externalReference: string;
}

type Metodo = 'tarjeta' | 'spei';
const MONTHLY_SUBSCRIPTION_URL = 'https://mpago.la/1zLpGTV';

export default function PagosPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [concept, setConcept] = useState<string>('CUOTA');
  const [metodo, setMetodo] = useState<Metodo>('tarjeta');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [retorno, setRetorno] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/pagos/concepts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('resultado');
    if (r) setRetorno(r);
  }, []);

  const selectedConcept = config?.concepts.find((c) => c.code === concept);
  const effectiveAmount = selectedConcept?.allowsCustomAmount ? amount : (config?.cuotaAmount || '100.00');
  const formattedAmount = parseFloat(effectiveAmount || '0').toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/pagos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          amount: selectedConcept?.allowsCustomAmount ? amount : undefined,
          metodo,
          payerName: name,
          payerEmail: email,
          building,
          apartment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo generar la orden');
      if (metodo === 'tarjeta' && data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la orden');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = () => {
    if (result?.reference) navigator.clipboard?.writeText(result.reference).catch(() => {});
  };

  const retornoAlert = retorno === 'exito'
    ? { type: 'alert-success', msg: 'Tu pago se procesó correctamente. Se confirmará automáticamente y quedará registrado en la comunidad.' }
    : retorno === 'error'
      ? { type: 'alert-warning', msg: 'El pago no se completó. Puedes intentar nuevamente o elegir otro método de pago.' }
      : retorno === 'pendiente'
        ? { type: 'alert-info', msg: 'Tu pago está pendiente de confirmación. Te notificaremos cuando se acredite.' }
        : null;

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Pagos en línea</h1>
        <p className="page-subtitle">Cargando opciones de pago...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Pagos en línea</h1>
      <p className="page-subtitle">
        Realiza tu cuota condominal o una aportación extraordinaria de forma segura con tarjeta
        o mediante transferencia bancaria (SPEI) a través de Mercado Pago.
      </p>

      <section className="card" aria-labelledby="subscription-title" style={{ maxWidth: 560, margin: '0 auto 1.5rem' }}>
        <h2 id="subscription-title" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Pago automático mensual</h2>
        <p><strong>Suscripción voluntaria a la cuota de mantenimiento</strong></p>
        <p>
          ¿Prefieres olvidarte de realizar el pago cada mes? Puedes activar voluntariamente el
          pago automático mensual mediante Mercado Pago. La suscripción es opcional y los medios
          de pago actuales continúan disponibles.
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          Antes de continuar consulta nuestro <a href="/privacidad">Aviso de Privacidad</a>.
          La autorización y los cobros recurrentes son procesados por Mercado Pago.
        </p>
        <a className="btn btn-secondary" href={MONTHLY_SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer">
          Suscribirme con Mercado Pago
        </a>
        <p className="form-help" style={{ marginTop: '0.5rem' }}>Cuota de mantenimiento: $100 MXN al mes, con cobro el día 10.</p>
      </section>

      {retornoAlert && (
        <div className={`alert ${retornoAlert.type}`} style={{ maxWidth: 560, margin: '0 auto 1.5rem' }}>
          {retornoAlert.msg}
        </div>
      )}

      {!config?.enabled ? (
        <div className="alert alert-info">
          <strong>Los pagos en línea estarán disponibles próximamente.</strong>{' '}
          Si necesitas realizar un pago, contacta a la administración.
        </div>
      ) : result ? (
        <section className="info-section">
          <div className="alert alert-success">
            <strong>Orden generada correctamente.</strong>
            <p style={{ marginTop: '0.5rem' }}>
              Tu orden de pago por <strong>{formattedAmount} MXN</strong> ({result.conceptName}) está lista.
              Completa la transferencia SPEI antes de la fecha de expiración para que se registre tu pago.
            </p>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Datos para la transferencia</h2>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ width: '40%' }}>Clave de referencia</td>
                  <td><code style={{ fontSize: '1.1rem', fontWeight: 700 }}>{result.reference || '—'}</code></td></tr>
                <tr><td>Monto</td><td><strong>{formattedAmount} MXN</strong></td></tr>
                <tr><td>Concepto</td><td>{result.conceptName}</td></tr>
                <tr><td>Vivienda</td><td>Edificio {result.building} — Depto. {result.apartment}</td></tr>
                <tr><td>Estatus</td><td>Esperando transferencia</td></tr>
                {result.expiresAt && (
                  <tr><td>Válida hasta</td><td>{new Date(result.expiresAt).toLocaleString('es-MX')}</td></tr>
                )}
                <tr><td>Referencia interna</td><td>{result.externalReference}</td></tr>
              </tbody>
            </table>
            {result.reference && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={copyReference}>
                Copiar referencia
              </button>
            )}
          </div>

          {result.ticketUrl && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Instrucciones de pago</h2>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Abre el ticket oficial de Mercado Pago para ver los datos completos de la transferencia
                (cuenta CLABE, referencia y pasos para pagar).
              </p>
              <a href={result.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Ver ticket de pago
              </a>
            </div>
          )}

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
            Una vez que realices la transferencia, tu pago se confirmará automáticamente y quedará
            registrado en la comunidad.
          </p>
          <p style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => { setResult(null); setAmount(''); setConfirmed(false); setRetorno(null); }}>
              Realizar otro pago
            </button>
          </p>
        </section>
      ) : (
        <section className="info-section">
          <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Concepto de pago</label>
                <div className="flex flex-wrap gap-1" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {config?.concepts.map((c) => (
                    <label
                      key={c.code}
                      className="form-checkbox"
                      style={{
                        padding: '0.75rem 1rem',
                        border: `1px solid ${concept === c.code ? 'var(--color-primary-medium)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)',
                        background: concept === c.code ? 'rgba(46, 117, 182, 0.06)' : 'var(--color-bg-card)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="concept"
                        value={c.code}
                        checked={concept === c.code}
                        onChange={() => setConcept(c.code)}
                      />
                      <span>
                        <strong>{c.name}</strong>
                        {c.fixedAmount && (
                          <span style={{ color: 'var(--color-primary-medium)', marginLeft: '0.5rem' }}>
                            ${parseFloat(c.fixedAmount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                          </span>
                        )}
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                          {c.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Método de pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <label
                    className="form-checkbox"
                    style={{
                      padding: '0.75rem 1rem',
                      border: `1px solid ${metodo === 'tarjeta' ? 'var(--color-primary-medium)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: metodo === 'tarjeta' ? 'rgba(46, 117, 182, 0.06)' : 'var(--color-bg-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      value="tarjeta"
                      checked={metodo === 'tarjeta'}
                      onChange={() => setMetodo('tarjeta')}
                    />
                    <span>
                      <strong>Tarjeta</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        Crédito o débito. Pago inmediato.
                      </span>
                    </span>
                  </label>
                  <label
                    className="form-checkbox"
                    style={{
                      padding: '0.75rem 1rem',
                      border: `1px solid ${metodo === 'spei' ? 'var(--color-primary-medium)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius)',
                      background: metodo === 'spei' ? 'rgba(46, 117, 182, 0.06)' : 'var(--color-bg-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="metodo"
                      value="spei"
                      checked={metodo === 'spei'}
                      onChange={() => setMetodo('spei')}
                    />
                    <span>
                      <strong>Transferencia (SPEI)</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        Desde tu banca en línea.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {selectedConcept?.allowsCustomAmount && (
                <div className="form-group">
                  <label className="form-label" htmlFor="amount">Monto (MXN)</label>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    className="form-input"
                    placeholder="Ej. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <p className="form-error" style={{ color: 'var(--color-text-light)' }}>
                    Monto máximo: ${parseFloat(config?.maxExtraordinaryAmount || '0').toLocaleString('es-MX')} MXN.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="name">Nombre completo</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación de tu vivienda</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" htmlFor="building" style={{ fontSize: '0.8rem' }}>
                      Edificio #
                    </label>
                    <input
                      id="building"
                      type="text"
                      className="form-input"
                      placeholder="Ej. 1"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="apartment" style={{ fontSize: '0.8rem' }}>
                      Departamento #
                    </label>
                    <input
                      id="apartment"
                      type="text"
                      className="form-input"
                      placeholder="Ej. 101"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} required />
                  <span>
                    Confirmo que el pago por <strong>{formattedAmount} MXN</strong> es real y corresponde a mi
                    vivienda en la comunidad.
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>{error}</div>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting || !confirmed} style={{ width: '100%' }}>
                {submitting ? 'Generando orden...' : metodo === 'tarjeta' ? `Pagar ${formattedAmount} MXN con tarjeta` : `Pagar ${formattedAmount} MXN`}
              </button>

              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '1rem', textAlign: 'center' }}>
                El pago se procesa de forma segura mediante Mercado Pago. Los datos de tu tarjeta se
                capturan en su plataforma y nunca llegan a este sitio.
              </p>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
