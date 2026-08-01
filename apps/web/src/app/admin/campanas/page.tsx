import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import CampaignsClient from './campaigns-client';

export const metadata: Metadata = {
  title: 'Campañas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const [items, total] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.campaign.count(),
  ]);

  const serialized = items.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt,
    goalAmount: c.goalAmount?.toString() ?? null,
    collectedAmount: c.collectedAmount.toString(),
    status: c.status,
    startsAt: c.startsAt?.toISOString() ?? null,
    endsAt: c.endsAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Campañas</h1>
      <p className="page-subtitle">{total} campañas registradas</p>
      <CampaignsClient items={serialized} total={total} csrfToken={csrf} />
    </>
  );
}
