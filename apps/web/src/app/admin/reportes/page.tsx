import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Reportes',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const [propertyCount, activeLeases, totalCharges, totalPayments, totalExpenses] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.lease.count({ where: { status: 'ACTIVE' } }),
    prisma.leaseCharge.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: { in: ['CONFIRMED', 'APPLIED'] } }, _sum: { amount: true } }),
    prisma.propertyExpense.aggregate({ where: { status: { in: ['AUTHORIZED', 'PAID', 'VERIFIED'] } }, _sum: { amount: true } }),
  ]);

  const totalChargesAmount = Number(totalCharges._sum.amount ?? 0);
  const totalPaymentsAmount = Number(totalPayments._sum.amount ?? 0);
  const totalExpensesAmount = Number(totalExpenses._sum.amount ?? 0);
  const balance = totalPaymentsAmount - totalExpensesAmount;

  return (
    <>
      <h1 className="page-title">Reportes</h1>
      <p className="page-subtitle">Resumen financiero y patrimonial</p>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{propertyCount}</div>
          <div className="stat-label">Propiedades</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeLeases}</div>
          <div className="stat-label">Contratos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalChargesAmount.toString()}</div>
          <div className="stat-label">Cargos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalPaymentsAmount.toString()}</div>
          <div className="stat-label">Pagos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalExpensesAmount.toString()}</div>
          <div className="stat-label">Gastos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            ${balance.toString()}
          </div>
          <div className="stat-label">Balance</div>
        </div>
      </div>

      <section className="info-section">
        <h2>Flujo patrimonial</h2>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Ingresos (pagos)</span>
            <span>${totalPaymentsAmount.toString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Gastos</span>
            <span style={{ color: 'var(--color-danger)' }}>−${totalExpensesAmount.toString()}</span>
          </div>
          <hr style={{ margin: '0.75rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Flujo disponible</span>
            <span style={{ color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              ${balance.toString()}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
