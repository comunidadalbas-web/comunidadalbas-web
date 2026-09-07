'use client';

import { useEffect, useState, useCallback } from 'react';

interface Summary {
  buildings: number;
  units: number;
  activeUnits: number;
  feeConcepts: number;
  totalCharges: number;
  unpaidAmount: number;
  confirmedPayments: number;
  confirmedIncome: number;
  expenses: number;
  expensesTotal: number;
  balance: number;
  recentOrders: { status: string; count: number; amount: number }[];
  totalChargesFormatted: string;
  unpaidFormatted: string;
  confirmedIncomeFormatted: string;
  expensesFormatted: string;
  balanceFormatted: string;
}

interface SeriesPoint {
  month: string;
  income: number;
  expenses: number;
}

interface DelinquencyRow {
  unitCode: string;
  buildingCode: string;
  apartmentNumber: string;
  period: string;
  amount: number;
  applied: number;
  remaining: number;
}

function mxn(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);
}

const EXPORT_TYPES = [
  { type: 'units', label: 'Departamentos' },
  { type: 'buildings', label: 'Edificios' },
  { type: 'concepts', label: 'Conceptos de cuota' },
  { type: 'delinquency', label: 'Morosidad' },
  { type: 'payments', label: 'Pagos' },
  { type: 'orders', label: 'Órdenes Mercado Pago' },
  { type: 'expenses', label: 'Egresos' },
  { type: 'series', label: 'Ingresos vs egresos' },
];

export default function InformesClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [delinquency, setDelinquency] = useState<DelinquencyRow[]>([]);
  const [delinquencyTotal, setDelinquencyTotal] = useState(0);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, se, d] = await Promise.all([
        fetch('/api/admin/statistics?type=summary').then((r) => r.json()),
        fetch(`/api/admin/statistics?type=series&months=${months}`).then((r) => r.json()),
        fetch('/api/admin/statistics?type=delinquency').then((r) => r.json()),
      ]);
      if (s.error) throw new Error(s.error);
      setSummary(s);
      setSeries(se.items ?? []);
      setDelinquency(d.items ?? []);
      setDelinquencyTotal(d.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const downloadCsv = (type: string) => {
    const url = `/api/admin/reports/export?type=${type}&months=${months}`;
    window.location.href = url;
  };

  if (loading && !summary) {
    return <div className="alert alert-info">Cargando estadísticas…</div>;
  }

  const maxIncome = Math.max(...series.map((s) => s.income), 1);

  return (
    <>
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {summary && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{summary.buildings}</div>
              <div className="stat-label">Edificios</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.units}</div>
              <div className="stat-label">Departamentos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.feeConcepts}</div>
              <div className="stat-label">Conceptos de cuota</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.totalChargesFormatted}</div>
              <div className="stat-label">Cargos totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.unpaidFormatted}</div>
              <div className="stat-label">Pendiente por cobrar</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.confirmedIncomeFormatted}</div>
              <div className="stat-label">Ingresos confirmados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.expensesFormatted}</div>
              <div className="stat-label">Egresos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: summary.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {summary.balanceFormatted}
              </div>
              <div className="stat-label">Balance</div>
            </div>
          </div>

          <section className="info-section">
            <h2>Órdenes de pago recientes</h2>
            {summary.recentOrders.length === 0 ? (
              <div className="alert alert-info">Aún no hay órdenes de pago registradas.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table-admin">
                  <thead>
                    <tr><th>Estado</th><th>Cantidad</th><th>Monto</th></tr>
                  </thead>
                  <tbody>
                    {summary.recentOrders.map((o) => (
                      <tr key={o.status}>
                        <td><span className="badge badge-review">{o.status}</span></td>
                        <td>{o.count}</td>
                        <td>{mxn(o.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <section className="info-section">
        <h2>Ingresos vs egresos por mes</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0 }}>Meses:</label>
          <select className="form-select" style={{ width: 'auto' }} value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {[3, 6, 12].map((m) => (
              <option key={m} value={m}>{m} meses</option>
            ))}
          </select>
        </div>
        {series.length === 0 ? (
          <div className="alert alert-info">Sin datos en el período.</div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '180px', padding: '0 4px' }}>
            {series.map((s) => (
              <div key={s.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                  {mxn(s.income - s.expenses)}
                </div>
                <div
                  title={`Ingresos ${mxn(s.income)} · Egresos ${mxn(s.expenses)}`}
                  style={{ width: '100%', background: 'var(--color-success, #2d8a4e)', borderRadius: '4px 4px 0 0', height: `${Math.max((s.income / maxIncome) * 100, 2)}%` }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                  {s.month.slice(5)}/{s.month.slice(2, 4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="info-section">
        <h2>Morosidad</h2>
        {delinquency.length === 0 ? (
          <div className="alert alert-info">No hay cargos pendientes de pago.</div>
        ) : (
          <>
            <p className="page-subtitle">Total pendiente: {mxn(delinquencyTotal)}</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="table-admin">
                <thead>
                  <tr>
                    <th>Edificio</th>
                    <th>Depto</th>
                    <th>Unidad</th>
                    <th>Periodo</th>
                    <th>Monto</th>
                    <th>Aplicado</th>
                    <th>Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {delinquency.map((r, i) => (
                    <tr key={i}>
                      <td>{r.buildingCode}</td>
                      <td>{r.apartmentNumber}</td>
                      <td>{r.unitCode}</td>
                      <td>{r.period}</td>
                      <td>{mxn(r.amount)}</td>
                      <td>{mxn(r.applied)}</td>
                      <td><strong>{mxn(r.remaining)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="info-section">
        <h2>Exportar reportes</h2>
        <p className="page-subtitle">Descarga los catálogos y estados financieros en CSV.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {EXPORT_TYPES.map((t) => (
            <button key={t.type} className="btn btn-ghost" onClick={() => downloadCsv(t.type)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
