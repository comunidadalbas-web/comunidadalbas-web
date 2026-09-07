import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Mantenimiento',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function MantenimientoPage() {
  const tickets = await prisma.maintenanceTicket.findMany({
    include: { property: true },
    orderBy: { reportedAt: 'desc' },
  });

  const openTickets = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const resolvedTickets = tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED');

  return (
    <>
      <h1 className="page-title">Mantenimiento</h1>
      <p className="page-subtitle">Incidencias y tickets de mantenimiento</p>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{openTickets.length}</div>
          <div className="stat-label">Abiertas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resolvedTickets.length}</div>
          <div className="stat-label">Resueltas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{tickets.filter((t: any) => t.priority === 'HIGH' || t.priority === 'URGENT').length}</div>
          <div className="stat-label">Alta prioridad</div>
        </div>
      </div>

      <section className="info-section">
        <h2>Incidencias abiertas</h2>
        {openTickets.length === 0 ? (
          <p>No hay incidencias abiertas.</p>
        ) : (
          <div className="card-grid">
            {openTickets.map((ticket: any) => (
              <div key={ticket.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3>{ticket.title}</h3>
                  <span className={`badge badge-${ticket.priority === 'URGENT' ? 'danger' : ticket.priority === 'HIGH' ? 'warning' : 'info'}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p>{ticket.property.code} · {ticket.property.name}</p>
                <p style={{ fontSize: '0.9rem' }}>Estado: {ticket.status}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                  Reportado: {ticket.reportedAt.toLocaleDateString('es-MX')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
