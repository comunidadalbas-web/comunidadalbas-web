import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { campaignSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') || undefined;
  const status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | undefined =
    statusParam === 'DRAFT' || statusParam === 'ACTIVE' || statusParam === 'COMPLETED' || statusParam === 'CANCELLED'
      ? statusParam
      : undefined;
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.campaign.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.campaign.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.campaign.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      goalAmount: data.goalAmount ?? null,
      collectedAmount: data.collectedAmount ?? 0,
      status: data.status,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      createdById: guard.session.userId,
    },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.CAMPAIGN_CREATE,
    entityType: 'Campaign',
    entityId: item.id,
    after: { title: item.title, status: item.status },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
