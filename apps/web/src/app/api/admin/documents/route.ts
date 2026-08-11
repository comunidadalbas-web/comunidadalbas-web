import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { documentSchema } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
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

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'] });
  if (guard instanceof NextResponse) return guard;
  const items = await prisma.document.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });
  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, {
    roles: ['director', 'secretario', 'admin'],
    csrf: true,
  });
  if (guard instanceof NextResponse) return guard;
  const parsed = documentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const data = parsed.data;
  const duplicate = await prisma.document.findFirst({
    where: { sha256: data.sha256.toLowerCase() },
  });
  if (duplicate)
    return NextResponse.json({ error: 'Ya existe un documento con ese SHA-256' }, { status: 409 });
  const item = await prisma.document.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category,
      version: data.version,
      documentDate: data.documentDate ? new Date(`${data.documentDate}T12:00:00.000Z`) : null,
      visibility: data.visibility,
      fileUrl: data.fileUrl,
      fileSizeBytes: data.fileSizeBytes,
      storageProvider: data.storageProvider,
      storageKey: data.storageKey,
      sha256: data.sha256.toLowerCase(),
      isPermanent: data.isPermanent,
      approvedAt: data.approved ? new Date() : null,
    },
  });
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.DOCUMENT_CREATE,
    entityType: 'Document',
    entityId: item.id,
    after: serialize(item),
  });
  return NextResponse.json({ success: true, item: serialize(item) }, { status: 201 });
}
