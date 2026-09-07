import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@comunidad-albas/db';
import { getSessionFromRequest, CSRF_COOKIE } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import PaymentsClient from './payments-client';

export const dynamic = 'force-dynamic';
export default async function PaymentsPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (!session.roles.includes(ROLES.OWNER) && !session.roles.includes(ROLES.CONTADOR))
    redirect('/admin');
  const [units, concepts, charges, payments, orders] = await Promise.all([
    prisma.unit.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { code: 'asc' },
      select: { id: true, code: true },
    }),
    prisma.feeConcept.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, amount: true },
    }),
    prisma.charge.findMany({
      orderBy: { period: 'desc' },
      include: {
        unit: { select: { code: true } },
        feeConcept: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { select: { code: true } },
        applications: { select: { chargeId: true, amount: true } },
      },
    }),
    prisma.mercadoPagoOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        orderId: true,
        status: true,
        amount: true,
        building: true,
        apartment: true,
        createdAt: true,
      },
    }),
  ]);
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  return (
    <>
      <h1 className="page-title">Pagos y cargos</h1>
      <p className="page-subtitle">
        Captura, confirmación, aplicación a adeudos y consulta de Mercado Pago
      </p>
      <PaymentsClient
        csrfToken={csrfCookie.split('.')[0] ?? ''}
        units={units}
        concepts={concepts.map((c: any) => ({ ...c, amount: Number(c.amount) }))}
        charges={charges.map((c: any) => ({
          id: c.id,
          unitId: c.unitId,
          unitCode: c.unit.code,
          feeConceptId: c.feeConceptId,
          conceptName: c.feeConcept.name,
          period: c.period,
          amount: Number(c.amount),
          applied: c.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        }))}
        payments={payments.map((p: any) => ({
          id: p.id,
          unitId: p.unitId,
          unitCode: p.unit.code,
          paidAt: p.paidAt?.toISOString().slice(0, 10) ?? '',
          amount: Number(p.amount),
          reference: p.reference ?? '',
          trackingKey: p.trackingKey ?? '',
          status: p.status,
        }))}
        orders={orders.map((o: any) => ({
          ...o,
          amount: Number(o.amount),
          createdAt: o.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
