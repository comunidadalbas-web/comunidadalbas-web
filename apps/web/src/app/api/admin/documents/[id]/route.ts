import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { documentUpdateSchema } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
interface Context {
  params: Promise<{ id: string }>;
}
const serialize = (
  item: {
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    documentDate: Date | null;
  } & Record<string, unknown>,
) => ({
  ...item,
  approvedAt: item.approvedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  documentDate: item.documentDate?.toISOString().slice(0, 10) ?? '',
});

export async function PATCH(request: NextRequest, context: Context) {
  const guard = await guardAdminRequest(request, {
    roles: ['director', 'secretario', 'admin'],
    csrf: true,
  });
  if (guard instanceof NextResponse) return guard;
  const { id } = await context.params;
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  const parsed = documentUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const data = parsed.data;
  if (data.sha256 && data.sha256.toLowerCase() !== existing.sha256) {
    const duplicate = await prisma.document.findFirst({
      where: { sha256: data.sha256.toLowerCase(), NOT: { id } },
    });
    if (duplicate)
      return NextResponse.json(
        { error: 'Ya existe un documento con ese SHA-256' },
        { status: 409 },
      );
  }
  const item = await prisma.document.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.version !== undefined && { version: data.version }),
      ...(data.documentDate !== undefined && {
        documentDate: data.documentDate ? new Date(`${data.documentDate}T12:00:00.000Z`) : null,
      }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.fileSizeBytes !== undefined && { fileSizeBytes: data.fileSizeBytes }),
      ...(data.storageProvider !== undefined && { storageProvider: data.storageProvider }),
      ...(data.storageKey !== undefined && { storageKey: data.storageKey }),
      ...(data.sha256 !== undefined && { sha256: data.sha256.toLowerCase() }),
      ...(data.isPermanent !== undefined && { isPermanent: data.isPermanent }),
      ...(data.approved !== undefined && { approvedAt: data.approved ? new Date() : null }),
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.DOCUMENT_UPDATE,
    entityType: 'Document',
    entityId: id,
    before: serialize(existing),
    after: serialize(item),
  });
  return NextResponse.json({ success: true, item: serialize(item) });
}

export async function DELETE(request: NextRequest, context: Context) {
  const guard = await guardAdminRequest(request, {
    roles: ['director', 'secretario', 'admin'],
    csrf: true,
  });
  if (guard instanceof NextResponse) return guard;
  const { id } = await context.params;
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  if (existing.isPermanent)
    return NextResponse.json(
      {
        error:
          'Los documentos permanentes deben marcarse como históricos antes de eliminar su registro.',
      },
      { status: 409 },
    );
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.DOCUMENT_DELETE,
    entityType: 'Document',
    entityId: id,
    before: serialize(existing),
  });
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
