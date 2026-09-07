import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { paymentStatusSchema, PAYMENT_STATUSES } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
const transitions: Record<PaymentStatus, PaymentStatus[]> = {
  REPORTED: ['CONFIRMED', 'CLARIFICATION', 'REJECTED', 'DUPLICATE'],
  CONFIRMED: ['APPLIED', 'CLARIFICATION'],
  APPLIED: [],
  CLARIFICATION: ['CONFIRMED', 'REJECTED', 'DUPLICATE'],
  REJECTED: [],
  DUPLICATE: [],
};
interface Context {
  params: Promise<{ id: string }>;
}
export async function PATCH(request: NextRequest, context: Context) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const { id } = await context.params;
  const parsed = paymentStatusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const existing = await prisma.payment.findUnique({
    where: { id },
    include: {
      unit: { select: { code: true } },
      applications: { select: { chargeId: true, amount: true } },
    },
  });
  if (!existing) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
  if (!transitions[existing.status as PaymentStatus].includes(parsed.data.status as PaymentStatus))
    return NextResponse.json(
      { error: `Transición no permitida: ${existing.status} → ${parsed.data.status}` },
      { status: 409 },
    );
  if (parsed.data.status === 'APPLIED') {
    if (!parsed.data.chargeId)
      return NextResponse.json(
        { error: 'Selecciona el cargo al que se aplicará el pago' },
        { status: 400 },
      );
    const charge = await prisma.charge.findUnique({
      where: { id: parsed.data.chargeId },
      include: { payments: { select: { amount: true } } },
    });
    if (!charge || charge.unitId !== existing.unitId)
      return NextResponse.json(
        { error: 'El cargo no pertenece al mismo departamento' },
        { status: 400 },
      );
    const remaining =
      Number(charge.amount) -
      charge.payments.reduce((sum: number, application: any) => sum + Number(application.amount), 0);
    if (Number(existing.amount) > remaining + 0.001)
      return NextResponse.json(
        { error: 'El pago excede el saldo pendiente del cargo' },
        { status: 409 },
      );
    await prisma.$transaction([
      prisma.paymentApplication.create({
        data: { paymentId: id, chargeId: charge.id, amount: existing.amount },
      }),
      prisma.payment.update({ where: { id }, data: { status: 'APPLIED' } }),
    ]);
  } else {
    await prisma.payment.update({ where: { id }, data: { status: parsed.data.status } });
  }
  const item = await prisma.payment.findUniqueOrThrow({
    where: { id },
    include: {
      unit: { select: { code: true } },
      applications: { select: { chargeId: true, amount: true } },
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.PAYMENT_STATUS_CHANGE,
    entityType: 'Payment',
    entityId: id,
    before: { status: existing.status },
    after: { status: item.status, chargeId: parsed.data.chargeId ?? null },
  });
  return NextResponse.json({
    success: true,
    item: {
      ...item,
      amount: Number(item.amount),
      paidAt: item.paidAt?.toISOString() ?? null,
      applications: item.applications.map((application: any) => ({
        ...application,
        amount: Number(application.amount),
      })),
    },
  });
}
