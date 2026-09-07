import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@comunidad-albas/db';
import { getSessionFromRequest, CSRF_COOKIE } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import UnitsClient from './units-client';

export const dynamic = 'force-dynamic';

export default async function UnitsPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (!session.roles.includes(ROLES.OWNER) && !session.roles.includes(ROLES.GESTOR))
    redirect('/admin');
  const [buildings, units] = await Promise.all([
    prisma.building.findMany({ where: { status: 'ACTIVE' }, orderBy: { code: 'asc' } }),
    prisma.unit.findMany({
      orderBy: [{ building: { code: 'asc' } }, { apartmentNumber: 'asc' }],
      include: { building: { select: { code: true, name: true } } },
    }),
  ]);
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  return (
    <>
      <h1 className="page-title">Edificios y departamentos</h1>
      <p className="page-subtitle">Catálogo operativo para cargos, pagos y estados de cuenta</p>
      <UnitsClient
        csrfToken={csrfCookie.split('.')[0] ?? ''}
        buildings={buildings.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
        items={units.map((u) => ({
          id: u.id,
          code: u.code,
          apartmentNumber: u.apartmentNumber,
          buildingId: u.buildingId,
          buildingCode: u.building.code,
          buildingName: u.building.name,
          status: u.status,
        }))}
      />
    </>
  );
}
