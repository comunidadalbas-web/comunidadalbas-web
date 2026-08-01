import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentos',
};

export const dynamic = 'force-dynamic';

export default async function DocumentosPage() {
  const publicDocs = await prisma.document.findMany({
    where: { visibility: 'PUBLIC', approvedAt: { not: null } },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  const categories = [...new Set(publicDocs.map((d) => d.category))];

  return (
    <>
      <h1 className="page-title">Documentos</h1>
      <p className="page-subtitle">Biblioteca de normativa, avisos e informes</p>

      {publicDocs.length === 0 ? (
        <div className="alert alert-info">
          Esta sección estará disponible próximamente. Aquí se publicarán los documentos
          institucionales, normativos y financieros de la comunidad una vez que el portal se
          encuentre en operación.
        </div>
      ) : (
        categories.map((category) => (
          <section key={category} className="info-section">
            <h2>{category}</h2>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
              {publicDocs
                .filter((d) => d.category === category)
                .map((d) => (
                  <li key={d.id}>
                    <Link href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                      {d.title}
                    </Link>
                    {d.version && <span className="text-muted"> · v{d.version}</span>}
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}

      <section className="info-section">
        <h2>Transparencia</h2>
        <p>En cumplimiento con nuestro compromiso de transparencia, este espacio alojará:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Estatutos y reglamentos</li>
          <li>Avisos de privacidad</li>
          <li>Informes financieros trimestrales</li>
          <li>Actas de asambleas y reuniones</li>
          <li>Convocatorias oficiales</li>
        </ul>
      </section>
    </>
  );
}
