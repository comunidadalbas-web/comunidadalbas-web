import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_DETAILS, formatFileSize } from '@/lib/documents';

export const metadata: Metadata = {
  title: 'Documentos y transparencia',
  description:
    'Biblioteca pública de normativa, avisos, informes, actas y convocatorias de Comunidad Albas.',
};

export const dynamic = 'force-dynamic';

export default async function DocumentosPage() {
  const publicDocs = await prisma.document.findMany({
    where: { visibility: 'PUBLIC', approvedAt: { not: null } },
    orderBy: [{ documentDate: 'desc' }, { title: 'asc' }],
  });

  return (
    <>
      <header className="documents-hero">
        <p className="documents-eyebrow">Rendición de cuentas</p>
        <h1 className="page-title">Documentos y transparencia</h1>
        <p className="page-subtitle">
          Consulta normativa, avisos y documentos institucionales publicados para la comunidad. Cada
          archivo conserva su versión y huella digital de integridad.
        </p>
      </header>

      <div className="alert alert-info documents-notice">
        La publicación de una copia documental no sustituye su fuente oficial ni acredita por sí
        sola su vigencia. Cuando exista una versión emitida por una autoridad, prevalece la fuente
        oficial correspondiente.
      </div>

      <div className="documents-index" aria-label="Categorías de transparencia">
        {DOCUMENT_CATEGORIES.map((category) => (
          <a key={category} href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
            {category}
          </a>
        ))}
      </div>

      {DOCUMENT_CATEGORIES.map((category) => {
        const details = DOCUMENT_CATEGORY_DETAILS[category];
        const documents = publicDocs.filter((document) => document.category === category);
        const hasFixedPrivacy = category === 'Avisos de privacidad';
        return (
          <section
            key={category}
            id={category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
            className="info-section documents-section"
          >
            <div className="documents-section-heading">
              <div>
                <h2>{category}</h2>
                <p>{details.description}</p>
              </div>
              <span className="badge badge-review">
                {details.permanent ? 'Consulta permanente' : 'Publicación periódica'}
              </span>
            </div>
            <div className="document-grid">
              {hasFixedPrivacy && (
                <article className="document-card">
                  <div className="document-card-icon" aria-hidden="true">
                    PDF
                  </div>
                  <div>
                    <h3>Aviso de privacidad integral del sitio</h3>
                    <p>Versión vigente para el uso de comunidadalbas.com.mx y sus formularios.</p>
                    <div className="document-meta">Documento permanente · Página web</div>
                    <Link className="btn btn-ghost" href="/privacidad">
                      Consultar aviso
                    </Link>
                  </div>
                </article>
              )}
              {documents.map((document) => (
                <article className="document-card" key={document.id}>
                  <div className="document-card-icon" aria-hidden="true">
                    PDF
                  </div>
                  <div>
                    <h3>{document.title}</h3>
                    {document.description && <p>{document.description}</p>}
                    <div className="document-meta">
                      {document.documentDate
                        ? new Intl.DateTimeFormat('es-MX', {
                            dateStyle: 'medium',
                            timeZone: 'UTC',
                          }).format(document.documentDate)
                        : 'Sin fecha documental'}
                      {document.version ? ` · Versión ${document.version}` : ''}
                      {formatFileSize(document.fileSizeBytes)
                        ? ` · ${formatFileSize(document.fileSizeBytes)}`
                        : ''}
                    </div>
                    <a
                      className="btn btn-ghost"
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir documento
                    </a>
                    <details className="document-integrity">
                      <summary>Ver integridad</summary>
                      <code>{document.sha256}</code>
                    </details>
                  </div>
                </article>
              ))}
              {!hasFixedPrivacy && documents.length === 0 && (
                <div className="documents-empty">
                  <strong>Sin publicaciones disponibles.</strong>
                  <span>
                    Los documentos aparecerán aquí después de su revisión y aprobación
                    administrativa.
                  </span>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
