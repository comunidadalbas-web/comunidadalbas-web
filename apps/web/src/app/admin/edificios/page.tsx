import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import BuildingsClient from './buildings-client';

export const metadata: Metadata = {
  title: 'Edificios',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function EdificiosPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (!session.roles.includes(ROLES.OWNER) && !session.roles.includes(ROLES.GESTOR)) {
    redirect('/admin');
  }

  const buildings = await prisma.building.findMany({
    orderBy: { code: 'asc' },
    include: { _count: { select: { units: true } } },
  });

  const serialized = buildings.map((b: any) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    status: b.status,
    units: b._count.units,
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Edificios</h1>
      <p className="page-subtitle">Catálogo de edificios de la comunidad</p>
      <BuildingsClient items={serialized} csrfToken={csrf} />
    </>
  );
}
