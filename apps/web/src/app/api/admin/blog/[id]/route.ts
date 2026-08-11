import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { blogPostSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
  let candidate = base || 'publicacion';
  let i = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = blogPostSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
  }

  const data = parsed.data;
  const statusChanged = data.status !== undefined && data.status !== existing.status;

  let finalSlug: string | undefined;
  if (data.slug !== undefined) {
    finalSlug = await uniqueSlug(data.slug.trim() || slugify(data.title ?? existing.title), id);
  } else if (data.title !== undefined && data.title.trim() !== existing.title) {
    finalSlug = await uniqueSlug(slugify(data.title), id);
  }

  const publishedAt =
    statusChanged && data.status === 'PUBLISHED' && !existing.publishedAt
      ? new Date()
      : statusChanged && data.status === 'DRAFT'
        ? null
        : undefined;

  const item = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(finalSlug !== undefined && { slug: finalSlug }),
      ...(data.summary !== undefined && { summary: data.summary?.trim() || null }),
      ...(data.content !== undefined && { content: data.content.trim() }),
      ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl || null }),
      ...(data.coverImageAlt !== undefined && { coverImageAlt: data.coverImageAlt?.trim() || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.commentsEnabled !== undefined && { commentsEnabled: data.commentsEnabled }),
      ...(publishedAt !== undefined && { publishedAt }),
    },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.BLOG_UPDATE,
    entityType: 'BlogPost',
    entityId: item.id,
    after: { title: item.title, slug: item.slug, status: item.status },
  });

  if (data.commentsEnabled !== undefined && data.commentsEnabled !== existing.commentsEnabled) {
    await writeAuditLog({
      userId: guard.session.userId,
      action: AUDIT_ACTIONS.BLOG_COMMENTS_TOGGLE,
      entityType: 'BlogPost',
      entityId: item.id,
      before: { commentsEnabled: existing.commentsEnabled },
      after: { commentsEnabled: item.commentsEnabled },
    });
  }

  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
  }

  await prisma.blogPost.delete({ where: { id } });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.BLOG_DELETE,
    entityType: 'BlogPost',
    entityId: id,
    after: { title: existing.title },
  });

  return NextResponse.json({ success: true });
}
