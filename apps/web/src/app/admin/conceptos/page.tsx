import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import ConceptsClient from './concepts-client';

export const metadata: Metadata = {
  title: 'Conceptos de cuota',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ConceptosPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  const canManage =
    session.roles.includes(ROLES.OWNER) ||
    session.roles.includes(ROLES.GESTOR) ||
    session.roles.includes(ROLES.CONTADOR);
  if (!canManage) redirect('/admin');

  const concepts = await prisma.feeConcept.findMany({ orderBy: { name: 'asc' } });

  const serialized = concepts.map((c: any) => ({
    id: c.id,
    name: c.name,
    amount: Number(c.amount),
    authoritySource: c.authoritySource,
    status: c.status,
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Conceptos de cuota</h1>
      <p className="page-subtitle">Cuotas autorizadas por la comunidad y su fuente de autoridad</p>
      <ConceptsClient items={serialized} csrfToken={csrf} />
    </>
  );
}
