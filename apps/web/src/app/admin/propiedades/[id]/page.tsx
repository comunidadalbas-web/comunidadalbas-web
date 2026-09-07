import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Propiedad',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      units: { orderBy: { apartmentNumber: 'asc' } },
      leases: {
        where: { status: 'ACTIVE' },
        include: { tenant: true },
      },
      expenses: { orderBy: { createdAt: 'desc' }, take: 5 },
      tickets: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }, orderBy: { reportedAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!property) notFound();

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/propiedades" style={{ fontSize: '0.9rem' }}>&larr; Volver a propiedades</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{property.code} · {property.name}</h1>
          <p className="page-subtitle">{property.type} · {property.use} · {property.status}</p>
        </div>
        <Link href={`/admin/propiedades/${property.id}/editar`} className="btn btn-secondary">
          Editar
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{property.units.length}</div>
          <div className="stat-label">Unidades</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{property.leases.length}</div>
          <div className="stat-label">Contratos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{property.tickets.length}</div>
          <div className="stat-label">Incidencias abiertas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{property.expenses.length}</div>
          <div className="stat-label">Gastos registrados</div>
        </div>
      </div>

      {property.areaM2 && (
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Área:</strong> {property.areaM2.toString()} m²
          {property.parkingSpace && <> · <strong>Estacionamiento:</strong> {property.parkingSpace}</>}
        </p>
      )}
      {property.state && (
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Ubicación:</strong> {property.development}, {property.privateArea}, {property.municipality}, {property.state}
        </p>
      )}
      {property.notes && (
        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-light)' }}>{property.notes}</p>
      )}

      <section className="info-section">
        <h2>Unidades</h2>
        {property.units.length === 0 ? (
          <p>No hay unidades registradas.</p>
        ) : (
          <div className="card-grid">
            {property.units.map((unit: any) => (
              <div key={unit.id} className="card">
                <h3>Depto. {unit.apartmentNumber}</h3>
                <p>Código: {unit.code}</p>
                <p>Estado: {unit.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="info-section">
        <h2>Contratos activos</h2>
        {property.leases.length === 0 ? (
          <p>No hay contratos activos.</p>
        ) : (
          <div className="card-grid">
            {property.leases.map((lease: any) => (
              <div key={lease.id} className="card">
                <h3>{lease.code}</h3>
                <p>{lease.tenant.firstName} {lease.tenant.lastName}</p>
                <p>Renta: ${lease.monthlyRent.toString()} MXN/mes</p>
                <p>Vence: {lease.endDate.toLocaleDateString('es-MX')}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="info-section">
        <h2>Incidencias abiertas</h2>
        {property.tickets.length === 0 ? (
          <p>No hay incidencias abiertas.</p>
        ) : (
          <div className="card-grid">
            {property.tickets.map((ticket: any) => (
              <div key={ticket.id} className="card">
                <h3>{ticket.title}</h3>
                <p>Prioridad: {ticket.priority} · Estado: {ticket.status}</p>
                <p>Reportado: {ticket.reportedAt.toLocaleDateString('es-MX')}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
