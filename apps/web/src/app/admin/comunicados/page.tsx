import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import AnnouncementsClient from './announcements-client';

export const metadata: Metadata = {
  title: 'Comunicados',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const [items, total] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.announcement.count(),
  ]);

  const serialized = items.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    category: a.category,
    status: a.status,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Comunicados</h1>
      <p className="page-subtitle">{total} comunicados registrados</p>
      <AnnouncementsClient items={serialized} total={total} csrfToken={csrf} />
    </>
  );
}
