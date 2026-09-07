import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Arrendatario',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ArrendatarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      property: true,
      leases: {
        include: { unit: true, property: true },
        orderBy: { startDate: 'desc' },
      },
    },
  });

  if (!tenant) notFound();

  const activeLease = tenant.leases.find((l) => l.status === 'ACTIVE');

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/arrendatarios" style={{ fontSize: '0.9rem' }}>&larr; Volver a arrendatarios</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{tenant.firstName} {tenant.lastName}</h1>
          <p className="page-subtitle">{tenant.property.name} · {tenant.property.code}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href={`/admin/arrendatarios/${tenant.id}/editar`} className="btn btn-secondary">
            Editar
          </Link>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{tenant.email ?? '—'}</div>
          <div className="stat-label">Email</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tenant.phone ?? '—'}</div>
          <div className="stat-label">Teléfono</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tenant.leases.length}</div>
          <div className="stat-label">Contratos</div>
        </div>
      </div>

      {activeLease && (
        <section className="info-section" style={{ marginBottom: '2rem' }}>
          <h2>Contrato activo</h2>
          <div className="card-grid">
            <div className="card">
              <h3>{activeLease.code}</h3>
              <p>Renta: ${activeLease.monthlyRent.toString()} MXN/mes</p>
              <p>Vence: {activeLease.endDate.toLocaleDateString('es-MX')}</p>
              <p>Día de pago: {activeLease.paymentDay}</p>
              {activeLease.depositAmount && <p>Depósito: ${activeLease.depositAmount.toString()}</p>}
            </div>
          </div>
        </section>
      )}

      <section className="info-section" style={{ marginBottom: '2rem' }}>
        <h2>Historial de contratos</h2>
        {tenant.leases.length === 0 ? (
          <p>No hay contratos registrados.</p>
        ) : (
          <div className="card-grid">
            {tenant.leases.map((lease) => (
              <Link key={lease.id} href={`/admin/contratos/${lease.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3>{lease.code}</h3>
                <p>{lease.property.code} · {lease.property.name}</p>
                <p>Renta: ${lease.monthlyRent.toString()}/mes</p>
                <p>Periodo: {lease.startDate.toLocaleDateString('es-MX')} - {lease.endDate.toLocaleDateString('es-MX')}</p>
                <span className={`badge badge-${lease.status === 'ACTIVE' ? 'success' : lease.status === 'EXPIRED' ? 'danger' : 'muted'}`}>
                  {lease.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {tenant.emergencyName && (
        <section className="info-section">
          <h2>Contacto de emergencia</h2>
          <p><strong>{tenant.emergencyName}</strong></p>
          {tenant.emergencyPhone && <p>{tenant.emergencyPhone}</p>}
        </section>
      )}
    </>
  );
}