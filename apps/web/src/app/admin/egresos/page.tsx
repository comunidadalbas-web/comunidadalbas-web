import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@comunidad-albas/db';
import { getSessionFromRequest, CSRF_COOKIE } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import ExpensesClient from './expenses-client';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (!session.roles.includes(ROLES.ADMIN) && !session.roles.includes(ROLES.TESORERO))
    redirect('/admin');
  const items = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  return (
    <>
      <h1 className="page-title">Egresos</h1>
      <p className="page-subtitle">
        Solicitud, autorización, comprobación y conciliación con trazabilidad
      </p>
      <ExpensesClient
        csrfToken={csrfCookie.split('.')[0] ?? ''}
        items={items.map((item) => ({
          id: item.id,
          spentAt: item.spentAt?.toISOString().slice(0, 10) ?? '',
          category: item.category,
          provider: item.provider ?? '',
          description: item.description,
          amount: Number(item.amount),
          fund: item.fund,
          status: item.status,
          evidenceUrl: item.evidenceUrl ?? '',
        }))}
      />
    </>
  );
}
