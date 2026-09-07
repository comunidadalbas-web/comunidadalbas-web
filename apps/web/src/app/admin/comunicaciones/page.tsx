import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comunicaciones',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ComunicacionesPage() {
  const [announcements, blogPosts] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <>
      <h1 className="page-title">Comunicaciones</h1>
      <p className="page-subtitle">Bitácora patrimonial y comunicaciones</p>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{announcements.length}</div>
          <div className="stat-label">Comunicados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{blogPosts.length}</div>
          <div className="stat-label">Publicaciones</div>
        </div>
      </div>

      <section className="info-section">
        <h2>Comunicados recientes</h2>
        {announcements.length === 0 ? (
          <p>No hay comunicados.</p>
        ) : (
          <div className="card-grid">
            {announcements.map((a: any) => (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3>{a.title}</h3>
                  <span className={`badge badge-${a.status === 'PUBLISHED' ? 'success' : 'muted'}`}>
                    {a.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                  {a.category} · {a.createdAt.toLocaleDateString('es-MX')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
