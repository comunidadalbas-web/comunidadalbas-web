import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import BlogClient from './blog-client';

export const metadata: Metadata = {
  title: 'Blog',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { author: { select: { displayName: true } } },
    }),
    prisma.blogPost.count(),
  ]);

  const serialized = items.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    coverImageAlt: p.coverImageAlt,
    status: p.status,
    authorName: p.author.displayName,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return (
    <>
      <h1 className="page-title">Blog</h1>
      <p className="page-subtitle">{total} publicaciones registradas</p>
      <BlogClient items={serialized} total={total} csrfToken={csrf} />
    </>
  );
}
