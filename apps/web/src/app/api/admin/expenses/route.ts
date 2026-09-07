import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { expenseSchema } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const serialize = (item: Awaited<ReturnType<typeof prisma.expense.create>>) => ({
  ...item,
  amount: Number(item.amount),
  spentAt: item.spentAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'] });
  if (guard instanceof NextResponse) return guard;
  const items = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const parsed = expenseSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const data = parsed.data;
  if (data.status !== 'REQUESTED') {
    return NextResponse.json(
      { error: 'Todo egreso debe iniciar como solicitado' },
      { status: 400 },
    );
  }
  const item = await prisma.expense.create({
    data: {
      propertyId: data.propertyId,
      spentAt: data.spentAt ? new Date(`${data.spentAt}T12:00:00Z`) : null,
      category: data.category,
      provider: data.provider || null,
      description: data.description,
      amount: data.amount,
      fund: data.fund,
      status: 'REQUESTED',
      evidenceUrl: data.evidenceUrl || null,
      requestedById: guard.session.userId,
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.EXPENSE_CREATE,
    entityType: 'Expense',
    entityId: item.id,
    after: serialize(item),
  });
  return NextResponse.json({ success: true, item: serialize(item) }, { status: 201 });
}
