import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { chargeSchema } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'] });
  if (guard instanceof NextResponse) return guard;
  const items = await prisma.charge.findMany({
    orderBy: [{ period: 'desc' }],
    include: {
      unit: { select: { code: true } },
      feeConcept: { select: { name: true } },
      payments: { select: { amount: true } },
    },
  });
  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      amount: Number(item.amount),
      applied: item.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    })),
  });
}
export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const parsed = chargeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const data = parsed.data;
  const [unit, concept] = await Promise.all([
    prisma.unit.findUnique({ where: { id: data.unitId } }),
    prisma.feeConcept.findUnique({ where: { id: data.feeConceptId } }),
  ]);
  if (!unit || !concept)
    return NextResponse.json({ error: 'Departamento o concepto no encontrado' }, { status: 400 });
  const duplicate = await prisma.charge.findUnique({
    where: {
      unitId_feeConceptId_period: {
        unitId: data.unitId,
        feeConceptId: data.feeConceptId,
        period: data.period,
      },
    },
  });
  if (duplicate)
    return NextResponse.json({ error: 'Ese cargo ya existe para el periodo' }, { status: 409 });
  const item = await prisma.charge.create({
    data: {
      unitId: data.unitId,
      feeConceptId: data.feeConceptId,
      period: data.period,
      amount: data.amount,
      dueDate: data.dueDate ? new Date(`${data.dueDate}T12:00:00Z`) : null,
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.CHARGE_CREATE,
    entityType: 'Charge',
    entityId: item.id,
    after: {
      unitId: item.unitId,
      feeConceptId: item.feeConceptId,
      period: item.period,
      amount: Number(item.amount),
    },
  });
  return NextResponse.json(
    {
      success: true,
      item: {
        ...item,
        amount: Number(item.amount),
        applied: 0,
        unit: { code: unit.code },
        feeConcept: { name: concept.name },
      },
    },
    { status: 201 },
  );
}
