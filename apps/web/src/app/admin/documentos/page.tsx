import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@comunidad-albas/db';
import { getSessionFromRequest, CSRF_COOKIE } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import DocumentsClient from './documents-client';

export const dynamic = 'force-dynamic';

export default async function AdminDocumentosPage() {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');
  if (![ROLES.OWNER, ROLES.GESTOR, ROLES.GESTOR].some((role) => session.roles.includes(role)))
    redirect('/admin');
  const docs = await prisma.document.findMany({ orderBy: [{ category: 'asc' }, { title: 'asc' }] });
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  return (
    <>
      <h1 className="page-title">Documentos</h1>
      <p className="page-subtitle">
        Registro, integridad SHA-256, aprobación y visibilidad pública
      </p>
      <DocumentsClient
        csrfToken={csrfCookie.split('.')[0] ?? ''}
        items={docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description ?? '',
          category: doc.category,
          version: doc.version,
          documentDate: doc.documentDate?.toISOString().slice(0, 10) ?? '',
          visibility: doc.visibility,
          fileUrl: doc.fileUrl,
          fileSizeBytes: doc.fileSizeBytes,
          storageProvider: doc.storageProvider,
          storageKey: doc.storageKey,
          sha256: doc.sha256,
          isPermanent: doc.isPermanent,
          approved: Boolean(doc.approvedAt),
          approvedAt: doc.approvedAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
