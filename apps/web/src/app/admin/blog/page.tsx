import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import BlogClient from './blog-client';
import CommentsAdmin from './comments-admin';

export const metadata: Metadata = {
  title: 'Blog',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  const [items, total, commentGroups, comments] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { author: { select: { displayName: true } } },
    }),
    prisma.blogPost.count(),
    prisma.blogComment.groupBy({
      by: ['postId', 'status'],
      _count: { _all: true },
    }),
    prisma.blogComment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { post: { select: { title: true } } },
    }),
  ]);

  const countsByPost = new Map<string, { total: number; pending: number; published: number }>();
  for (const group of commentGroups) {
    const counts = countsByPost.get(group.postId) ?? { total: 0, pending: 0, published: 0 };
    counts.total += group._count._all;
    if (group.status === 'PENDING') counts.pending += group._count._all;
    if (group.status === 'PUBLISHED') counts.published += group._count._all;
    countsByPost.set(group.postId, counts);
  }

  const serialized = items.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    coverImageAlt: p.coverImageAlt,
    status: p.status,
    commentsEnabled: p.commentsEnabled,
    commentCounts: countsByPost.get(p.id) ?? { total: 0, pending: 0, published: 0 },
    authorName: p.author.displayName,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';
  const serializedComments = comments.map((comment) => ({
    id: comment.id,
    postTitle: comment.post.title,
    parentId: comment.parentId,
    displayName: comment.displayName,
    email: comment.email,
    body: comment.body,
    status: comment.status,
    isInstitutional: comment.isInstitutional,
    createdAt: comment.createdAt.toISOString(),
  }));

  return (
    <>
      <h1 className="page-title">Blog</h1>
      <p className="page-subtitle">{total} publicaciones registradas</p>
      <BlogClient items={serialized} total={total} csrfToken={csrf} />
      <CommentsAdmin initialItems={serializedComments} csrfToken={csrf} />
    </>
  );
}
