import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Edificios y departamentos',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UnitsPage() {
  const buildings = await prisma.building.findMany({
    orderBy: { code: 'asc' },
    include: { units: { orderBy: { apartmentNumber: 'asc' } } },
  });

  const totalUnits = buildings.reduce((acc, b) => acc + b.units.length, 0);

  if (buildings.length === 0) {
    return (
      <>
        <h1 className="page-title">Edificios y departamentos</h1>
        <div className="alert alert-info">
          Aún no se ha registrado el catálogo de edificios. Se cargará desde la
          documentación institucional en la Fase D.
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Edificios y departamentos</h1>
      <p className="page-subtitle">
        {buildings.length} edificios · {totalUnits} departamentos
      </p>

      {buildings.map((b) => (
        <section key={b.id} className="info-section">
          <h2>{b.name} <span className="text-muted">({b.code})</span></h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {b.units.map((u) => (
                  <tr key={u.id}>
                    <td>{u.apartmentNumber}</td>
                    <td>
                      <span className={u.status === 'ACTIVE' ? 'badge badge-resolved' : 'badge badge-archived'}>
                        {u.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
