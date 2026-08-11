import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { blogCommentSchema, sanitizePlainText, toPublicComment } from '@/lib/blog-comments';
import { hashAntiAbuseValue } from '@/lib/auth/password-reset';

export const dynamic = 'force-dynamic';

interface RouteContext { params: Promise<{ slug: string }> }
const PAGE_SIZE = 20;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 5;

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const post = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true, status: true, commentsEnabled: true } });
  if (!post || post.status !== 'PUBLISHED' || !post.commentsEnabled) {
    return NextResponse.json({ error: 'Opiniones no disponibles' }, { status: 404 });
  }
  const cursor = new URL(request.url).searchParams.get('cursor');
  const rows = await prisma.blogComment.findMany({
    where: { postId: post.id, parentId: null, status: 'PUBLISHED' },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      replies: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  });
  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE);
  return NextResponse.json({
    items: items.map(toPublicComment),
    nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ success: true }, { status: 202 });
  }
  const parsed = blogCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { slug } = await context.params;
  const post = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true, status: true, commentsEnabled: true } });
  if (!post || post.status !== 'PUBLISHED' || !post.commentsEnabled) {
    return NextResponse.json({ error: 'Esta publicación no recibe opiniones' }, { status: 404 });
  }

  let parentId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await prisma.blogComment.findUnique({
      where: { id: parsed.data.parentId },
      select: { id: true, postId: true, parentId: true, status: true },
    });
    if (!parent || parent.postId !== post.id || parent.parentId !== null || parent.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'La opinión a responder no está disponible' }, { status: 400 });
    }
    parentId = parent.id;
  }

  const email = parsed.data.email.toLowerCase();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipHash = hashAntiAbuseValue(ip);
  const emailHash = hashAntiAbuseValue(email);
  const keys = [`blog-comment:ip:${ipHash}`, `blog-comment:email:${emailHash}`];
  const since = new Date(Date.now() - WINDOW_MS);
  const counts = await Promise.all(
    keys.map((key) => prisma.rateLimitEntry.count({ where: { key, createdAt: { gte: since } } })),
  );
  if (counts.some((count) => count >= MAX_SUBMISSIONS)) {
    return NextResponse.json({ error: 'Demasiados envíos. Intenta nuevamente en unos minutos.' }, { status: 429 });
  }
  await prisma.rateLimitEntry.createMany({ data: keys.map((key) => ({ key })) });

  await prisma.blogComment.create({
    data: {
      postId: post.id,
      parentId,
      displayName: sanitizePlainText(parsed.data.displayName),
      email,
      body: sanitizePlainText(parsed.data.body),
      status: 'PENDING',
      ipHash,
      userAgentHash: hashAntiAbuseValue(userAgent),
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Gracias. Tu opinión fue recibida y será publicada después de su revisión.',
  }, { status: 201 });
}
