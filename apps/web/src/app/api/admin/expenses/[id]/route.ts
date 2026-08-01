import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { expenseUpdateSchema, EXPENSE_STATUSES } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
const transitions: Record<ExpenseStatus, ExpenseStatus[]> = {
  REQUESTED: ['AUTHORIZED', 'REJECTED'],
  AUTHORIZED: ['PAID', 'REJECTED'],
  PAID: ['VERIFIED'],
  VERIFIED: ['RECONCILED'],
  RECONCILED: [],
  REJECTED: [],
};

interface Context {
  params: Promise<{ id: string }>;
}
const serialized = (
  item: { amount: unknown; spentAt: Date | null; createdAt: Date; updatedAt: Date } & Record<
    string,
    unknown
  >,
) => ({
  ...item,
  amount: Number(item.amount),
  spentAt: item.spentAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export async function PATCH(request: NextRequest, context: Context) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const { id } = await context.params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Egreso no encontrado' }, { status: 404 });
  const parsed = expenseUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const data = parsed.data;
  if (
    data.status &&
    data.status !== existing.status &&
    !transitions[existing.status].includes(data.status)
  ) {
    return NextResponse.json(
      { error: `Transición no permitida: ${existing.status} → ${data.status}` },
      { status: 409 },
    );
  }
  const item = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.spentAt !== undefined && {
        spentAt: data.spentAt ? new Date(`${data.spentAt}T12:00:00Z`) : null,
      }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.provider !== undefined && { provider: data.provider || null }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.fund !== undefined && { fund: data.fund }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.evidenceUrl !== undefined && { evidenceUrl: data.evidenceUrl || null }),
      ...(data.status === 'AUTHORIZED' && { authorizedById: guard.session.userId }),
      ...(data.status === 'RECONCILED' && { reconciledById: guard.session.userId }),
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.EXPENSE_UPDATE,
    entityType: 'Expense',
    entityId: id,
    before: serialized(existing),
    after: serialized(item),
  });
  return NextResponse.json({ success: true, item: serialized(item) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const { id } = await context.params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Egreso no encontrado' }, { status: 404 });
  if (!['REQUESTED', 'REJECTED'].includes(existing.status)) {
    return NextResponse.json(
      { error: 'Un egreso autorizado o conciliado no puede eliminarse' },
      { status: 409 },
    );
  }
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.EXPENSE_DELETE,
    entityType: 'Expense',
    entityId: id,
    before: serialized(existing),
  });
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
