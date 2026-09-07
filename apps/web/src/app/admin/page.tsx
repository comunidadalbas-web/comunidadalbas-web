import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [
    propertyCount,
    activeLeases,
    pendingCharges,
    pendingPayments,
    openTickets,
    upcomingEvents,
    recentExpenses,
    properties,
  ] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.lease.count({ where: { status: 'ACTIVE' } }),
    prisma.leaseCharge.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'REPORTED' } }),
    prisma.maintenanceTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.calendarEvent.count({
      where: {
        startsAt: { gte: new Date() },
        status: 'SCHEDULED',
      },
    }),
    prisma.propertyExpense.count({ where: { status: 'REQUESTED' } }),
    prisma.property.findMany({
      where: { status: 'ACTIVE' },
      include: { units: true, leases: { where: { status: 'ACTIVE' } } },
      take: 10,
    }),
  ]);

  const financialStats = [
    { label: 'Propiedades', value: propertyCount, href: '/admin/propiedades' },
    { label: 'Contratos activos', value: activeLeases, href: '/admin/contratos' },
    { label: 'Cargos pendientes', value: pendingCharges, href: '/admin/cobranza' },
    { label: 'Pagos por confirmar', value: pendingPayments, href: '/admin/cobranza' },
    { label: 'Incidencias abiertas', value: openTickets, href: '/admin/mantenimiento' },
    { label: 'Próximos eventos', value: upcomingEvents, href: '/admin/calendario' },
    { label: 'Gastos por autorizar', value: recentExpenses, href: '/admin/gastos' },
  ];

  return (
    <>
      <h1 className="page-title">PATRIMONIO</h1>
      <p className="page-subtitle">Dashboard de administración patrimonial</p>

      <div className="stat-grid">
        {financialStats.map((s) => (
          <Link key={s.label} href={s.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <section className="info-section">
        <h2>Propiedades</h2>
        {properties.length === 0 ? (
          <p>No hay propiedades registradas.</p>
        ) : (
          <div className="card-grid">
            {properties.map((property: any) => (
              <Link
                key={property.id}
                href={`/admin/propiedades/${property.id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3>{property.code} · {property.name}</h3>
                <p>{property.type} · {property.use}</p>
                <p>{property.units.length} unidades · {property.leases.length} contratos activos</p>
                {property.areaM2 && <p>{property.areaM2.toString()} m²</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
