import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cobranza',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CobranzaPage() {
  const [pendingCharges, confirmedPayments, totalPending, totalCollected] = await Promise.all([
    prisma.leaseCharge.findMany({
      where: { status: 'PENDING' },
      include: { lease: { include: { property: true, tenant: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.payment.findMany({
      where: { status: { in: ['CONFIRMED', 'APPLIED'] } },
      include: { unit: true },
      orderBy: { paidAt: 'desc' },
      take: 20,
    }),
    prisma.leaseCharge.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ['CONFIRMED', 'APPLIED'] } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <>
      <h1 className="page-title">Cobranza</h1>
      <p className="page-subtitle">Ledger de cobros y pagos</p>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{pendingCharges.length}</div>
          <div className="stat-label">Cargos pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalPending._sum.amount?.toString() ?? '0'}</div>
          <div className="stat-label">Monto pendiente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{confirmedPayments.length}</div>
          <div className="stat-label">Pagos registrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalCollected._sum.amount?.toString() ?? '0'}</div>
          <div className="stat-label">Total cobrado</div>
        </div>
      </div>

      <section className="info-section">
        <h2>Cargos pendientes</h2>
        {pendingCharges.length === 0 ? (
          <p>No hay cargos pendientes.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Propiedad</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Arrendatario</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Concepto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Periodo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {pendingCharges.map((charge: any) => (
                  <tr key={charge.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{charge.lease.property.code}</td>
                    <td style={{ padding: '0.75rem' }}>{charge.lease.tenant.firstName} {charge.lease.tenant.lastName}</td>
                    <td style={{ padding: '0.75rem' }}>{charge.concept}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${charge.amount.toString()}</td>
                    <td style={{ padding: '0.75rem' }}>{charge.period}</td>
                    <td style={{ padding: '0.75rem' }}>{charge.dueDate?.toLocaleDateString('es-MX') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="info-section">
        <h2>Pagos recientes</h2>
        {confirmedPayments.length === 0 ? (
          <p>No hay pagos registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Unidad</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Referencia</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {confirmedPayments.map((payment: any) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{payment.paidAt?.toLocaleDateString('es-MX') ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{payment.unit.code}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${payment.amount.toString()}</td>
                    <td style={{ padding: '0.75rem' }}>{payment.reference ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${payment.status === 'APPLIED' ? 'success' : 'info'}`}>
                        {payment.status}
                      </span>
                    </td>
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
