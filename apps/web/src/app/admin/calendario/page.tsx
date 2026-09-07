import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import CalendarClient from './calendar-client';

export const metadata: Metadata = {
  title: 'Calendario',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const [items, total] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { startsAt: 'asc' }, take: 200 }),
    prisma.calendarEvent.count(),
  ]);

  const serialized = items.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
    status: e.status,
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Calendario de eventos</h1>
      <p className="page-subtitle">{total} eventos registrados</p>
      <CalendarClient items={serialized} total={total} csrfToken={csrf} />
    </>
  );
}
