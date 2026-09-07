import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Propiedades',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PropiedadesPage() {
  const properties = await prisma.property.findMany({
    include: {
      units: true,
      leases: { where: { status: 'ACTIVE' } },
      _count: { select: { tickets: true, expenses: true } },
    },
    orderBy: { code: 'asc' },
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Propiedades</h1>
          <p className="page-subtitle">Gestión de activos inmobiliarios</p>
        </div>
        <Link href="/admin/propiedades/nueva" className="btn btn-primary">
          Nueva propiedad
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No hay propiedades registradas.</p>
          <Link href="/admin/propiedades/nueva" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Crear primera propiedad
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {properties.map((property: any) => (
            <Link
              key={property.id}
              href={`/admin/propiedades/${property.id}`}
              className="card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{property.code}</h3>
                  <p style={{ fontWeight: 500 }}>{property.name}</p>
                </div>
                <span className={`badge badge-${property.status === 'ACTIVE' ? 'success' : 'muted'}`}>
                  {property.status}
                </span>
              </div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {property.type} · {property.use}
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <span>{property.units.length} unidades</span>
                <span>{property.leases.length} contratos</span>
                <span>{property._count.tickets} incidencias</span>
              </div>
              {property.areaM2 && (
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{property.areaM2.toString()} m²</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
