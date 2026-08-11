import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { blogPostSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || 'publicacion';
  let i = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing || (excludeId && existing.id === excludeId)) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}

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
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: { select: { displayName: true } } },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      content: p.content,
      coverImageUrl: p.coverImageUrl,
      coverImageAlt: p.coverImageAlt,
      status: p.status,
      commentsEnabled: p.commentsEnabled,
      authorName: p.author.displayName,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    total,
  });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = blogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.title);
  const finalSlug = await uniqueSlug(slug);

  const item = await prisma.blogPost.create({
    data: {
      title: data.title.trim(),
      slug: finalSlug,
      summary: data.summary?.trim() || null,
      content: data.content.trim(),
      coverImageUrl: data.coverImageUrl || null,
      coverImageAlt: data.coverImageAlt?.trim() || null,
      status: data.status,
      commentsEnabled: data.commentsEnabled ?? false,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      authorId: guard.session.userId,
    },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.BLOG_CREATE,
    entityType: 'BlogPost',
    entityId: item.id,
    after: { title: item.title, slug: item.slug, status: item.status },
  });

  return NextResponse.json(
    { success: true, item: { ...item, authorName: guard.session.displayName } },
    { status: 201 },
  );
}
