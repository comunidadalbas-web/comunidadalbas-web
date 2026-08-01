import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { getSessionFromRequest } from '@/lib/auth/session';
import { CSRF_COOKIE } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import UsersClient from './users-client';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Usuarios',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (!session.roles.includes(ROLES.ADMIN)) redirect('/admin');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      displayName: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
      roles: { select: { role: true } },
    },
  });

  const serialized = users.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    active: u.active,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    roles: u.roles.map((r) => r.role),
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Usuarios y roles</h1>
      <p className="page-subtitle">Gestiona el acceso al panel de administración</p>
      <UsersClient
        items={serialized}
        currentUserId={session.userId}
        csrfToken={csrf}
      />
    </>
  );
}
