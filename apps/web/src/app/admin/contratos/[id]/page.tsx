import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contrato',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      property: true,
      tenant: true,
      unit: true,
      occupants: true,
      charges: { orderBy: { dueDate: 'desc' }, take: 20 },
    },
  });

  if (!lease) notFound();

  const totalCharged = lease.charges.reduce((sum, c) => sum + Number(c.amount), 0);
  // Fetch payments for the unit
  const unitPayments = lease.unitId
    ? await prisma.payment.findMany({
        where: { unitId: lease.unitId, status: { in: ['CONFIRMED', 'APPLIED'] } },
        orderBy: { paidAt: 'desc' },
        take: 20,
      })
    : [];
  const totalPaid = unitPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalCharged - totalPaid;

  const daysUntilExpiry = Math.ceil((lease.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry < 0;

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/contratos" style={{ fontSize: '0.9rem' }}>&larr; Volver a contratos</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{lease.code}</h1>
          <p className="page-subtitle">{lease.property.code} · {lease.tenant.firstName} {lease.tenant.lastName}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href={`/admin/contratos/${lease.id}/editar`} className="btn btn-secondary">
            Editar
          </Link>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">${lease.monthlyRent.toString()}</div>
          <div className="stat-label">Renta mensual</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{daysUntilExpiry > 0 ? daysUntilExpiry : 0} días</div>
          <div className="stat-label">{isExpired ? 'Vencido' : isExpiringSoon ? 'Por vencer' : 'Vigencia'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${balance.toString()}</div>
          <div className="stat-label">Saldo pendiente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{lease.charges.length}</div>
          <div className="stat-label">Cargos generados</div>
        </div>
      </div>

      <section className="info-section" style={{ marginBottom: '2rem' }}>
        <h2>Detalles del contrato</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <h3>Propiedad</h3>
            <p>{lease.property.code} · {lease.property.name}</p>
          </div>
          <div className="card">
            <h3>Arrendatario</h3>
            <p>{lease.tenant.firstName} {lease.tenant.lastName}</p>
            <p>{lease.tenant.email}</p>
            <p>{lease.tenant.phone}</p>
          </div>
          <div className="card">
            <h3>Unidad</h3>
            <p>{lease.unit?.code ?? '—'}</p>
            <p>Depto: {lease.unit?.apartmentNumber ?? '—'}</p>
          </div>
          <div className="card">
            <h3>Periodo</h3>
            <p>Inicio: {lease.startDate.toLocaleDateString('es-MX')}</p>
            <p>Fin: {lease.endDate.toLocaleDateString('es-MX')}</p>
          </div>
          <div className="card">
            <h3>Pago</h3>
            <p>Día: {lease.paymentDay}</p>
            <p>Depósito: ${lease.depositAmount.toString()}</p>
          </div>
          <div className="card">
            <h3>Estado</h3>
            <span className={`badge badge-${lease.status === 'ACTIVE' ? 'success' : lease.status === 'EXPIRED' ? 'danger' : 'muted'}`}>
              {lease.status}
            </span>
          </div>
        </div>

        {(lease.guaranteeType || lease.vehicles || lease.petsAllowed || lease.notes) && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {lease.guaranteeType && (
              <div className="card">
                <h3>Garantía</h3>
                <p>Tipo: {lease.guaranteeType}</p>
                {lease.guaranteeAmount && <p>Monto: ${lease.guaranteeAmount.toString()}</p>}
              </div>
            )}
            {lease.vehicles && (
              <div className="card">
                <h3>Vehículos</h3>
                <p>{lease.vehicles}</p>
              </div>
            )}
            {lease.petsAllowed && (
              <div className="card">
                <h3>Mascotas</h3>
                <p>Permitidas</p>
              </div>
            )}
            {lease.notes && (
              <div className="card">
                <h3>Notas</h3>
                <p>{lease.notes}</p>
              </div>
            )}
          </div>
        )}

        {lease.occupants.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3>Ocupantes</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {lease.occupants.map((occ) => (
                <li key={occ.id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                  <strong>{occ.name}</strong>
                  {occ.relation && <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{occ.relation}</span>}
                  {occ.idType && occ.idNumber && <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{occ.idType}: {occ.idNumber}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="info-section" style={{ marginBottom: '2rem' }}>
        <h2>Cargos generados</h2>
        {lease.charges.length === 0 ? (
          <p>No hay cargos generados para este contrato.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Concepto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Periodo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vencimiento</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lease.charges.map((charge) => (
                  <tr key={charge.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{charge.concept}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Number(charge.amount).toLocaleString('es-MX')}</td>
                    <td style={{ padding: '0.75rem' }}>{charge.period}</td>
                    <td style={{ padding: '0.75rem' }}>{charge.dueDate?.toLocaleDateString('es-MX') ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${charge.status === 'PENDING' ? 'warning' : charge.status === 'PAID' ? 'success' : 'muted'}`}>
                        {charge.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="info-section" style={{ marginBottom: '2rem' }}>
        <h2>Pagos registrados (por unidad)</h2>
        {unitPayments.length === 0 ? (
          <p>No hay pagos registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Referencia</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {unitPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>{payment.paidAt?.toLocaleDateString('es-MX') ?? '—'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>${Number(payment.amount).toLocaleString('es-MX')}</td>
                    <td style={{ padding: '0.75rem' }}>{payment.reference ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${payment.status === 'APPLIED' ? 'success' : payment.status === 'CONFIRMED' ? 'info' : 'muted'}`}>
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