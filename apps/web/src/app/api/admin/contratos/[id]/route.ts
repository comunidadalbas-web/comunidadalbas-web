import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateLeaseSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional().nullable(),
  tenantId: z.string().optional(),
  code: z.string().min(1, 'El código es obligatorio').max(30).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  monthlyRent: z.coerce.number().positive('La renta debe ser mayor a cero').optional(),
  depositAmount: z.coerce.number().min(0).optional(),
  paymentDay: z.coerce.number().int().min(1).max(28).optional(),
  guaranteeType: z.string().max(50).optional(),
  guaranteeAmount: z.coerce.number().min(0).optional(),
  petsAllowed: z.boolean().optional(),
  vehicles: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      property: { select: { code: true, name: true } },
      tenant: { select: { firstName: true, lastName: true, email: true, phone: true } },
      unit: { select: { code: true, apartmentNumber: true } },
      occupants: true,
      charges: { orderBy: { dueDate: 'desc' } },
    },
  });

  if (!lease) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  }

  return NextResponse.json(lease);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateLeaseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const existing = await prisma.lease.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  }

  const data = { ...parsed.data };
  if (data.startDate) data.startDate = new Date(data.startDate).toISOString();
  if (data.endDate) data.endDate = new Date(data.endDate).toISOString();

  const lease = await prisma.lease.update({
    where: { id },
    data,
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'LEASE_UPDATE',
    entityType: 'Lease',
    entityId: id,
    before: { code: existing.code, monthlyRent: existing.monthlyRent, status: existing.status },
    after: { code: lease.code, monthlyRent: lease.monthlyRent, status: lease.status },
  });

  return NextResponse.json(lease);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.lease.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  }

  await prisma.lease.delete({ where: { id } });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'LEASE_DELETE',
    entityType: 'Lease',
    entityId: id,
    before: { code: existing.code, monthlyRent: existing.monthlyRent },
  });

  return NextResponse.json({ success: true });
}