import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { announcementSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') || undefined;
  const status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined =
    statusParam === 'DRAFT' || statusParam === 'PUBLISHED' || statusParam === 'ARCHIVED' ? statusParam : undefined;
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.announcement.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(), publishedAt: a.publishedAt?.toISOString() ?? null })),
    total,
  });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.announcement.create({
    data: {
      title: data.title.trim(),
      body: data.body.trim(),
      category: data.category.trim(),
      status: data.status,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      createdById: guard.session.userId,
    },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.ANNOUNCEMENT_CREATE,
    entityType: 'Announcement',
    entityId: item.id,
    after: { title: item.title, status: item.status },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
