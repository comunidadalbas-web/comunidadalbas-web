import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Arrendatarios',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ArrendatariosPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      property: true,
      leases: { where: { status: 'ACTIVE' }, take: 1 },
    },
    orderBy: { lastName: 'asc' },
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Arrendatarios</h1>
          <p className="page-subtitle">Gestión de arrendatarios</p>
        </div>
        <Link href="/admin/arrendatarios/nuevo" className="btn btn-primary">
          Nuevo arrendatario
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No hay arrendatarios registrados.</p>
        </div>
      ) : (
        <div className="card-grid">
          {tenants.map((tenant: any) => (
            <Link
              key={tenant.id}
              href={`/admin/arrendatarios/${tenant.id}`}
              className="card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h3>{tenant.firstName} {tenant.lastName}</h3>
              <p>{tenant.property.name}</p>
              {tenant.leases[0] && (
                <p style={{ fontSize: '0.9rem' }}>
                  Contrato: {tenant.leases[0].code} · ${tenant.leases[0].monthlyRent.toString()}/mes
                </p>
              )}
              {tenant.phone && <p style={{ fontSize: '0.85rem' }}>{tenant.phone}</p>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
