import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import ShareLinks from '@/components/share-links';

export const metadata: Metadata = {
  title: 'Campañas',
};

export const dynamic = 'force-dynamic';

export default async function CampanasPage() {
  const campanas = await prisma.campaign.findMany({
    where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <h1 className="page-title">Campañas</h1>
      <p className="page-subtitle">Iniciativas y proyectos de la comunidad</p>

      {campanas.length === 0 ? (
        <div className="alert alert-info">
          No hay campañas activas en este momento.
        </div>
      ) : (
        campanas.map((c) => {
          const goal = c.goalAmount ? Number(c.goalAmount) : 0;
          const collected = Number(c.collectedAmount);
          const pct = goal > 0 ? Math.min(100, Math.round((collected / goal) * 100)) : 0;
          return (
            <article id={`campana-${c.id}`} key={c.id} className="card" style={{ marginBottom: '1rem' }}>
              {c.imageUrl && (
                <img
                  src={c.imageUrl}
                  alt={c.imageAlt || c.title}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: '720px',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius, 8px)',
                    background: '#f4f7fb',
                    marginBottom: '1rem',
                  }}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.15rem' }}>{c.title}</h2>
                <span className={`badge ${c.status === 'ACTIVE' ? 'badge-resolved' : 'badge-new'}`}>
                  {c.status === 'ACTIVE' ? 'En curso' : 'Completada'}
                </span>
              </div>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{c.description}</p>
              {goal > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>
                      Recaudado: <strong>${collected.toLocaleString('es-MX')}</strong>
                    </span>
                    <span className="text-muted">Meta: ${goal.toLocaleString('es-MX')}</span>
                  </div>
                  <div style={{ background: 'var(--color-border)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: 'var(--color-primary-medium)', height: '100%' }} />
                  </div>
                </div>
              )}
              {c.endsAt && (
                <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                  Concluye el {new Date(c.endsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <ShareLinks title={c.title} path={`/campanas#campana-${c.id}`} />
            </article>
          );
        })
      )}
    </>
  );
}
