import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { documentSchema } from '@/lib/finance/validation';
import { AUDIT_ACTIONS, writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
const serialize = (
  item: { approvedAt: Date | null; createdAt: Date } & Record<string, unknown>,
) => ({
  ...item,
  approvedAt: item.approvedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
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
      category: data.category,
      version: data.version,
      visibility: data.visibility,
      fileUrl: data.fileUrl,
      sha256: data.sha256.toLowerCase(),
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
