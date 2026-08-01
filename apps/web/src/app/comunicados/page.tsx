import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Comunicados',
};

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<string, string> = {
  aviso: 'Aviso',
  convocatoria: 'Convocatoria',
  informe: 'Informe',
  reglamento: 'Reglamento',
  evento: 'Evento',
  otro: 'Otro',
};

export default async function ComunicadosPage() {
  const comunicados = await prisma.announcement.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <>
      <h1 className="page-title">Comunicados</h1>
      <p className="page-subtitle">Avisos oficiales de la administración de Privada Albas</p>

      {comunicados.length === 0 ? (
        <div className="alert alert-info">
          No hay comunicados publicados en este momento. Vuelve pronto.
        </div>
      ) : (
        comunicados.map((c) => (
          <article key={c.id} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.15rem' }}>{c.title}</h2>
              <span className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                {' · '}
                {CATEGORY_LABEL[c.category] || c.category}
              </span>
            </div>
            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{c.body}</p>
          </article>
        ))
      )}
    </>
  );
}
