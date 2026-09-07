import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      units: { orderBy: { apartmentNumber: 'asc' } },
      leases: {
        where: { status: 'ACTIVE' },
        include: { tenant: true },
      },
      expenses: { orderBy: { createdAt: 'desc' }, take: 10 },
      tickets: { orderBy: { reportedAt: 'desc' }, take: 10 },
      documents: { orderBy: { createdAt: 'desc' }, take: 10 },
      administrationFees: { where: { status: 'ACTIVE' } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
  }

  return NextResponse.json(property);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
  }

  const updated = await prisma.property.update({
    where: { id },
    data: body,
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'PROPERTY_UPDATE',
    entityType: 'Property',
    entityId: id,
    before: { code: property.code, name: property.name },
    after: { code: updated.code, name: updated.name },
  });

  return NextResponse.json(updated);
}
