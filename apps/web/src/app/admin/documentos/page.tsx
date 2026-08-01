import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Documentos',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: 'Público',
  PRIVATE: 'Privado',
  RESTRICTED: 'Restringido',
};

export default async function AdminDocumentosPage() {
  const docs = await prisma.document.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  return (
    <>
      <h1 className="page-title">Documentos</h1>
      <p className="page-subtitle">{docs.length} documentos registrados</p>

      {docs.length === 0 ? (
        <div className="alert alert-info">
          No hay documentos registrados. La gestión de documentos con carga de archivos se
          habilitará en la Fase C (CMS).
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Versión</th>
                <th>Visibilidad</th>
                <th>Aprobado</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.category}</td>
                  <td>{d.version || '—'}</td>
                  <td>
                    <span className="badge badge-new">{VISIBILITY_LABEL[d.visibility] || d.visibility}</span>
                  </td>
                  <td>{d.approvedAt ? new Date(d.approvedAt).toLocaleDateString('es-MX') : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
