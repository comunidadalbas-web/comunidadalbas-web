'use client';
import { useState } from 'react';
import { PAYMENT_STATUSES } from '@/lib/finance/validation';
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
interface Unit {
  id: string;
  code: string;
}
interface Concept {
  id: string;
  name: string;
  amount: number;
}
interface Charge {
  id: string;
  unitId: string;
  unitCode: string;
  feeConceptId: string;
  conceptName: string;
  period: string;
  amount: number;
  applied: number;
}
interface Payment {
  id: string;
  unitId: string;
  unitCode: string;
  paidAt: string;
  amount: number;
  reference: string;
  trackingKey: string;
  status: PaymentStatus;
}
interface Order {
  orderId: string;
  status: string;
  amount: number;
  building: string | null;
  apartment: string | null;
  createdAt: string;
}
interface Props {
  units: Unit[];
  concepts: Concept[];
  charges: Charge[];
  payments: Payment[];
  orders: Order[];
  csrfToken: string;
}
const labels: Record<PaymentStatus, string> = {
  REPORTED: 'Reportado',
  CONFIRMED: 'Confirmado',
  APPLIED: 'Aplicado',
  CLARIFICATION: 'Aclaración',
  REJECTED: 'Rechazado',
  DUPLICATE: 'Duplicado',
};
const money = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export default function PaymentsClient(props: Props) {
  const [charges, setCharges] = useState(props.charges);
  const [payments, setPayments] = useState(props.payments);
  const [mode, setMode] = useState<'none' | 'charge' | 'payment'>('none');
  const [error, setError] = useState('');
  const [selectedCharges, setSelectedCharges] = useState<Record<string, string>>({});
  const [charge, setCharge] = useState({
    unitId: props.units[0]?.id ?? '',
    feeConceptId: props.concepts[0]?.id ?? '',
    period: new Date().toISOString().slice(0, 7),
    amount: String(props.concepts[0]?.amount ?? ''),
    dueDate: '',
  });
  const [payment, setPayment] = useState({
    unitId: props.units[0]?.id ?? '',
    paidAt: new Date().toISOString().slice(0, 10),
    amount: '',
    reference: '',
    trackingKey: '',
  });
  const request = async (url: string, method: string, body?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': props.csrfToken },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error((Object.values(data.fieldErrors ?? {}).flat()[0] as string) || data.error);
    return data;
  };
  const createCharge = async () => {
    try {
      setError('');
      const data = await request('/api/admin/charges', 'POST', {
        ...charge,
        amount: Number(charge.amount),
      });
      setCharges((rows) => [
        ...rows,
        { ...data.item, unitCode: data.item.unit.code, conceptName: data.item.feeConcept.name },
      ]);
      setMode('none');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };
  const createPayment = async () => {
    try {
      setError('');
      const data = await request('/api/admin/payments', 'POST', {
        ...payment,
        amount: Number(payment.amount),
      });
      setPayments((rows) => [
        {
          ...data.item,
          unitCode: data.item.unit.code,
          paidAt: data.item.paidAt?.slice(0, 10) ?? '',
        },
        ...rows,
      ]);
      setMode('none');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };
  const changeStatus = async (item: Payment, status: PaymentStatus) => {
    try {
      setError('');
      const data = await request(`/api/admin/payments/${item.id}`, 'PATCH', {
        status,
        ...(status === 'APPLIED' ? { chargeId: selectedCharges[item.id] } : {}),
      });
      setPayments((rows) =>
        rows.map((row) => (row.id === item.id ? { ...row, status: data.item.status } : row)),
      );
      if (status === 'APPLIED') {
        setCharges((rows) =>
          rows.map((row) =>
            row.id === selectedCharges[item.id]
              ? { ...row, applied: row.applied + item.amount }
              : row,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };
  const prerequisites = props.units.length > 0 && props.concepts.length > 0;
  return (
    <>
      {error && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
        </div>
      )}
      {!prerequisites && (
        <div className="alert alert-info">
          Para capturar cargos y pagos registra primero edificios, departamentos y conceptos. No se
          crean movimientos sin esos catálogos.
        </div>
      )}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          disabled={!prerequisites}
          onClick={() => setMode('charge')}
        >
          + Nuevo cargo
        </button>
        <button
          className="btn btn-primary"
          disabled={props.units.length === 0}
          onClick={() => setMode('payment')}
        >
          + Capturar pago
        </button>
      </div>
      {mode === 'charge' && (
        <div className="card" style={{ margin: '1rem 0' }}>
          <h2>Nuevo cargo</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Departamento</span>
              <select
                className="form-select"
                value={charge.unitId}
                onChange={(e) => setCharge({ ...charge, unitId: e.target.value })}
              >
                {props.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Concepto</span>
              <select
                className="form-select"
                value={charge.feeConceptId}
                onChange={(e) => {
                  const c = props.concepts.find((x) => x.id === e.target.value);
                  setCharge({
                    ...charge,
                    feeConceptId: e.target.value,
                    amount: String(c?.amount ?? ''),
                  });
                }}
              >
                {props.concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Periodo</span>
              <input
                className="form-input"
                value={charge.period}
                onChange={(e) => setCharge({ ...charge, period: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Monto</span>
              <input
                className="form-input"
                type="number"
                value={charge.amount}
                onChange={(e) => setCharge({ ...charge, amount: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Vencimiento</span>
              <input
                className="form-input"
                type="date"
                value={charge.dueDate}
                onChange={(e) => setCharge({ ...charge, dueDate: e.target.value })}
              />
            </label>
          </div>
          <button className="btn btn-primary" onClick={createCharge}>
            Guardar cargo
          </button>{' '}
          <button className="btn btn-ghost" onClick={() => setMode('none')}>
            Cancelar
          </button>
        </div>
      )}
      {mode === 'payment' && (
        <div className="card" style={{ margin: '1rem 0' }}>
          <h2>Capturar pago reportado</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Departamento</span>
              <select
                className="form-select"
                value={payment.unitId}
                onChange={(e) => setPayment({ ...payment, unitId: e.target.value })}
              >
                {props.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Fecha</span>
              <input
                className="form-input"
                type="date"
                value={payment.paidAt}
                onChange={(e) => setPayment({ ...payment, paidAt: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Monto</span>
              <input
                className="form-input"
                type="number"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Referencia</span>
              <input
                className="form-input"
                value={payment.reference}
                onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Clave de rastreo</span>
              <input
                className="form-input"
                value={payment.trackingKey}
                onChange={(e) => setPayment({ ...payment, trackingKey: e.target.value })}
              />
            </label>
          </div>
          <button className="btn btn-primary" onClick={createPayment}>
            Guardar pago
          </button>{' '}
          <button className="btn btn-ghost" onClick={() => setMode('none')}>
            Cancelar
          </button>
        </div>
      )}
      <section className="info-section">
        <h2>Cargos</h2>
        {charges.length === 0 ? (
          <p>No hay cargos.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Concepto</th>
                  <th>Periodo</th>
                  <th>Cargo</th>
                  <th>Aplicado</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td>{c.unitCode}</td>
                    <td>{c.conceptName}</td>
                    <td>{c.period}</td>
                    <td>{money(c.amount)}</td>
                    <td>{money(c.applied)}</td>
                    <td>{money(Math.max(0, c.amount - c.applied))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="info-section">
        <h2>Pagos internos</h2>
        {payments.length === 0 ? (
          <p>No hay pagos capturados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                  <th>Estado</th>
                  <th>Conciliación</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.unitCode}</td>
                    <td>{p.paidAt || '—'}</td>
                    <td>{money(p.amount)}</td>
                    <td>{p.reference || p.trackingKey || '—'}</td>
                    <td>{labels[p.status]}</td>
                    <td>
                      {p.status === 'REPORTED' && (
                        <>
                          <button
                            className="btn btn-ghost"
                            onClick={() => changeStatus(p, 'CONFIRMED')}
                          >
                            Confirmar
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => changeStatus(p, 'CLARIFICATION')}
                          >
                            Aclaración
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => changeStatus(p, 'REJECTED')}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {p.status === 'CLARIFICATION' && (
                        <>
                          <button
                            className="btn btn-ghost"
                            onClick={() => changeStatus(p, 'CONFIRMED')}
                          >
                            Confirmar
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => changeStatus(p, 'REJECTED')}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {p.status === 'CONFIRMED' && (
                        <>
                          <select
                            className="form-select"
                            value={selectedCharges[p.id] ?? ''}
                            onChange={(e) =>
                              setSelectedCharges({ ...selectedCharges, [p.id]: e.target.value })
                            }
                          >
                            <option value="">Selecciona cargo</option>
                            {charges
                              .filter((c) => c.unitId === p.unitId && c.applied < c.amount)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.period} · {c.conceptName} · saldo {money(c.amount - c.applied)}
                                </option>
                              ))}
                          </select>
                          <button
                            className="btn btn-primary"
                            disabled={!selectedCharges[p.id]}
                            onClick={() => changeStatus(p, 'APPLIED')}
                          >
                            Aplicar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="info-section">
        <h2>Órdenes Mercado Pago</h2>
        {props.orders.length === 0 ? (
          <p>No hay órdenes.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Ubicación declarada</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {props.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td>
                      <code>{o.orderId}</code>
                    </td>
                    <td>{[o.building, o.apartment].filter(Boolean).join(' / ') || '—'}</td>
                    <td>{money(o.amount)}</td>
                    <td>{o.status}</td>
                    <td>{new Date(o.createdAt).toLocaleString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
