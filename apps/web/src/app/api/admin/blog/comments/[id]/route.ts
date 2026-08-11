import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { sanitizePlainText } from '@/lib/blog-comments';
import { writeAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext { params: Promise<{ id: string }> }
const schema = z.union([
  z.object({ status: z.enum(['PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED']) }),
  z.object({ replyBody: z.string().trim().min(1).max(1500) }),
]);

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { id } = await context.params;
  const existing = await prisma.blogComment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Opinión no encontrada' }, { status: 404 });

  if ('status' in parsed.data) {
    const item = await prisma.blogComment.update({ where: { id }, data: { status: parsed.data.status } });
    await writeAuditLog({
      userId: guard.session.userId,
      action: AUDIT_ACTIONS.BLOG_COMMENT_MODERATE,
      entityType: 'BlogComment',
      entityId: id,
      before: { status: existing.status },
      after: { status: item.status },
    });
    return NextResponse.json({ success: true, item: { id: item.id, status: item.status } });
  }

  if (existing.parentId !== null || existing.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Sólo se puede responder a una opinión principal publicada' }, { status: 400 });
  }
  const body = sanitizePlainText(parsed.data.replyBody);
  if (!body) return NextResponse.json({ error: 'La respuesta está vacía' }, { status: 400 });
  const reply = await prisma.blogComment.create({
    data: {
      postId: existing.postId,
      parentId: existing.id,
      displayName: 'Comunidad Albas',
      email: guard.session.email,
      body,
      status: 'PUBLISHED',
      isInstitutional: true,
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.BLOG_COMMENT_REPLY,
    entityType: 'BlogComment',
    entityId: reply.id,
    after: { parentId: existing.id, status: reply.status, isInstitutional: true },
  });
  return NextResponse.json({ success: true, item: { id: reply.id, status: reply.status } }, { status: 201 });
}
