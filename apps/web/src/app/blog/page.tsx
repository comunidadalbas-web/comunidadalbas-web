import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Noticias y artículos de la comunidad de Privada Albas.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    include: { author: { select: { displayName: true } } },
  });

  return (
    <>
      <h1 className="page-title">Blog</h1>
      <p className="page-subtitle">Noticias y artículos de la comunidad</p>

      {posts.length === 0 ? (
        <div className="alert alert-info">
          Aún no hay publicaciones. Vuelve pronto.
        </div>
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {posts.map((p: any) => (
            <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {p.coverImageUrl && (
                  <img
                    src={p.coverImageUrl}
                    alt={p.coverImageAlt || p.title}
                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius, 8px) 8px 0 0', marginBottom: '0.75rem' }}
                  />
                )}
                <h2 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{p.title}</h2>
                {p.summary && <p style={{ color: 'var(--color-text-light)', flex: 1 }}>{p.summary}</p>}
                <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    : ''}
                  {p.author.displayName ? ` · ${p.author.displayName}` : ''}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
