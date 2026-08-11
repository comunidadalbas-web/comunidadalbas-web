import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@comunidad-albas/db';
import BlogComments from '@/components/blog-comments';
import { toPublicComment } from '@/lib/blog-comments';
import ShareLinks from '@/components/share-links';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, summary: true },
  });
  if (!post) return { title: 'Publicación no encontrada' };
  return {
    title: post.title,
    description: post.summary ?? undefined,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { displayName: true } } },
  });

  if (!post || post.status !== 'PUBLISHED') {
    notFound();
  }

  const commentRows = post.commentsEnabled
    ? await prisma.blogComment.findMany({
        where: { postId: post.id, parentId: null, status: 'PUBLISHED' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
        include: {
          replies: {
            where: { status: 'PUBLISHED' },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          },
        },
      })
    : [];
  const initialComments = commentRows.slice(0, 20);
  const initialCursor = commentRows.length > 20 ? initialComments.at(-1)?.id ?? null : null;

  return (
    <article style={{ maxWidth: '760px', margin: '0 auto' }}>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        <Link href="/blog" style={{ textDecoration: 'none' }}>← Volver al blog</Link>
      </p>

      <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>{post.title}</h1>

      <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        {post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
          : ''}
        {post.author.displayName ? ` · ${post.author.displayName}` : ''}
      </div>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.coverImageAlt || post.title}
          style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: 'var(--radius, 8px)', marginBottom: '1.5rem' }}
        />
      )}

      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.content}</div>
      <ShareLinks title={post.title} path={`/blog/${post.slug}`} />
      {post.commentsEnabled && (
        <BlogComments
          slug={post.slug}
          initialItems={initialComments.map(toPublicComment)}
          initialCursor={initialCursor}
        />
      )}
    </article>
  );
}
