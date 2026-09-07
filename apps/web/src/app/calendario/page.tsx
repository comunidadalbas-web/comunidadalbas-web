import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Calendario',
};

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const eventos = await prisma.calendarEvent.findMany({
    where: { status: { not: 'CANCELLED' } },
    orderBy: { startsAt: 'asc' },
  });

  const upcoming = eventos.filter((e: any) => e.startsAt >= new Date());

  return (
    <>
      <h1 className="page-title">Calendario</h1>
      <p className="page-subtitle">Actividades y reuniones de la comunidad</p>

      {upcoming.length === 0 ? (
        <div className="alert alert-info">
          No hay eventos próximos programados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Evento</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(e.startsAt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(e.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {e.endsAt && (
                      <> – {new Date(e.endsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </td>
                  <td>
                    <strong>{e.title}</strong>
                    {e.description && (
                      <>
                        <br />
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{e.description}</span>
                      </>
                    )}
                  </td>
                  <td>{e.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
