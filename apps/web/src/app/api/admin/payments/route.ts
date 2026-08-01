import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { manualPaymentSchema } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
const serialize = (
  item: {
    amount: unknown;
    paidAt: Date | null;
    reportedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  } & Record<string, unknown>,
) => ({
  ...item,
  amount: Number(item.amount),
  paidAt: item.paidAt?.toISOString() ?? null,
  reportedAt: item.reportedAt.toISOString(),
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});
export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'] });
  if (guard instanceof NextResponse) return guard;
  const items = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      unit: { select: { code: true } },
      applications: { select: { chargeId: true, amount: true } },
    },
  });
  return NextResponse.json({ items: items.map(serialize) });
}
export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const parsed = manualPaymentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const data = parsed.data;
  const unit = await prisma.unit.findUnique({ where: { id: data.unitId } });
  if (!unit) return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 400 });
  if (
    data.trackingKey &&
    (await prisma.payment.findUnique({ where: { trackingKey: data.trackingKey } }))
  )
    return NextResponse.json({ error: 'La clave de rastreo ya fue registrada' }, { status: 409 });
  const item = await prisma.payment.create({
    data: {
      unitId: data.unitId,
      paidAt: data.paidAt ? new Date(`${data.paidAt}T12:00:00Z`) : null,
      amount: data.amount,
      reference: data.reference || null,
      trackingKey: data.trackingKey || null,
      status: 'REPORTED',
      createdById: guard.session.userId,
    },
    include: {
      unit: { select: { code: true } },
      applications: { select: { chargeId: true, amount: true } },
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.PAYMENT_CREATE,
    entityType: 'Payment',
    entityId: item.id,
    after: { unitId: item.unitId, amount: Number(item.amount), status: item.status },
  });
  return NextResponse.json({ success: true, item: serialize(item) }, { status: 201 });
}
