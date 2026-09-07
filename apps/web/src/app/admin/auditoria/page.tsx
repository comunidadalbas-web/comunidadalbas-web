import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Bitácora de auditoría',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  LOGIN_FAILED: 'Intento de sesión fallido',
  LOGOUT: 'Cierre de sesión',
  CONTACT_STATUS_CHANGE: 'Cambio de estado de solicitud',
  ANNOUNCEMENT_CREATE: 'Crear comunicado',
  ANNOUNCEMENT_UPDATE: 'Actualizar comunicado',
  ANNOUNCEMENT_DELETE: 'Eliminar comunicado',
  CAMPAIGN_CREATE: 'Crear campaña',
  CAMPAIGN_UPDATE: 'Actualizar campaña',
  CAMPAIGN_DELETE: 'Eliminar campaña',
  EVENT_CREATE: 'Crear evento',
  EVENT_UPDATE: 'Actualizar evento',
  EVENT_DELETE: 'Eliminar evento',
  USER_CREATE: 'Crear usuario',
  USER_UPDATE: 'Actualizar usuario',
  USER_DELETE: 'Eliminar usuario',
};

export default async function AuditoriaPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (!session.roles.includes(ROLES.OWNER)) redirect('/admin');

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { email: true, displayName: true } } },
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    userEmail: l.user?.email ?? null,
    userName: l.user?.displayName ?? null,
    before: l.before ? JSON.stringify(l.before) : null,
    after: l.after ? JSON.stringify(l.after) : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <>
      <h1 className="page-title">Bitácora de auditoría</h1>
      <p className="page-subtitle">Últimas {serialized.length} acciones registradas</p>

      {serialized.length === 0 ? (
        <div className="alert alert-info">Aún no hay registros de auditoría.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {serialized.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(l.createdAt).toLocaleString('es-MX')}
                  </td>
                  <td>{l.userName || l.userEmail || 'Sistema'}</td>
                  <td>
                    <span className="badge badge-review">{ACTION_LABEL[l.action] || l.action}</span>
                  </td>
                  <td>
                    <div>{l.entityType}</div>
                    {l.entityId && (
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{l.entityId}</div>
                    )}
                  </td>
                  <td style={{ maxWidth: '320px', fontSize: '0.8rem' }}>
                    {l.before && <div className="text-muted">antes: {l.before}</div>}
                    {l.after && <div>después: {l.after}</div>}
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
