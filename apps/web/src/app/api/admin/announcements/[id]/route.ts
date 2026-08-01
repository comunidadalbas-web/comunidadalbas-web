import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { announcementSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = announcementSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Comunicado no encontrado' }, { status: 404 });
  }

  const data = parsed.data;
  const wasPublished = existing.status === 'PUBLISHED';
  const nowPublished = data.status === 'PUBLISHED';

  const item = await prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.body !== undefined && { body: data.body.trim() }),
      ...(data.category !== undefined && { category: data.category.trim() }),
      ...(data.status !== undefined && { status: data.status }),
      ...(!wasPublished && nowPublished && { publishedAt: new Date() }),
    },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.ANNOUNCEMENT_UPDATE,
    entityType: 'Announcement',
    entityId: id,
    before: { status: existing.status },
    after: { title: item.title, status: item.status },
  });

  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Comunicado no encontrado' }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.ANNOUNCEMENT_DELETE,
    entityType: 'Announcement',
    entityId: id,
    before: { title: existing.title },
  });

  return NextResponse.json({ success: true });
}
