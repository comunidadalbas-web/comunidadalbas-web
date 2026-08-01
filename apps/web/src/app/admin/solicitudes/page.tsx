import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import SolicitudesClient from './solicitudes-client';

export const metadata: Metadata = {
  title: 'Solicitudes',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SolicitudesPage() {
  const [items, total] = await Promise.all([
    prisma.contactRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.contactRequest.count(),
  ]);

  const serialized = items.map((item) => ({
    id: item.id,
    folio: item.folio,
    name: item.name,
    email: item.email,
    phone: item.phone,
    building: item.building,
    apartment: item.apartment,
    category: item.category,
    message: item.message,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Solicitudes de contacto</h1>
      <p className="page-subtitle">{total} solicitudes registradas</p>
      <SolicitudesClient items={serialized} total={total} csrfToken={csrf} />
    </>
  );
}
