import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contratos',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ContratosPage() {
  const leases = await prisma.lease.findMany({
    include: {
      property: true,
      tenant: true,
      unit: true,
    },
    orderBy: { endDate: 'asc' },
  });

  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const activeLeases = leases.filter((l: any) => l.status === 'ACTIVE');
  const expiringSoon = activeLeases.filter((l: any) => l.endDate <= ninetyDays);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">Gestión de contratos de arrendamiento</p>
        </div>
        <Link href="/admin/contratos/nuevo" className="btn btn-primary">
          Nuevo contrato
        </Link>
      </div>

      {expiringSoon.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          <strong>{expiringSoon.length} contrato(s) por vencer en los próximos 90 días.</strong>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{activeLeases.length}</div>
          <div className="stat-label">Contratos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{expiringSoon.length}</div>
          <div className="stat-label">Por vencer (90 días)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{leases.filter((l: any) => l.status === 'EXPIRED').length}</div>
          <div className="stat-label">Vencidos</div>
        </div>
      </div>

      {leases.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No hay contratos registrados.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Código</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Propiedad</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Arrendatario</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Renta</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Inicio</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vencimiento</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((lease: any) => (
                <tr key={lease.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <Link href={`/admin/contratos/${lease.id}`}>{lease.code}</Link>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{lease.property.code}</td>
                  <td style={{ padding: '0.75rem' }}>{lease.tenant.firstName} {lease.tenant.lastName}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>${lease.monthlyRent.toString()}</td>
                  <td style={{ padding: '0.75rem' }}>{lease.startDate.toLocaleDateString('es-MX')}</td>
                  <td style={{ padding: '0.75rem' }}>{lease.endDate.toLocaleDateString('es-MX')}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge badge-${lease.status === 'ACTIVE' ? 'success' : lease.status === 'EXPIRED' ? 'danger' : 'muted'}`}>
                      {lease.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
