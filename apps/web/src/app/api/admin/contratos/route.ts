import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createLeaseSchema = z.object({
  propertyId: z.string().min(1, 'Selecciona una propiedad'),
  unitId: z.string().optional(),
  tenantId: z.string().min(1, 'Selecciona un arrendatario'),
  code: z.string().min(1, 'El código es obligatorio').max(30),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de término es obligatoria'),
  monthlyRent: z.coerce.number().positive('La renta debe ser mayor a cero'),
  depositAmount: z.coerce.number().min(0).default(0),
  paymentDay: z.coerce.number().int().min(1).max(28).default(1),
  guaranteeType: z.string().max(50).optional(),
  guaranteeAmount: z.coerce.number().min(0).optional(),
  petsAllowed: z.boolean().default(false),
  vehicles: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createLeaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const existing = await prisma.lease.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un contrato con ese código' }, { status: 409 });
  }

  const lease = await prisma.lease.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'LEASE_CREATE',
    entityType: 'Lease',
    entityId: lease.id,
    after: { code: lease.code, monthlyRent: lease.monthlyRent },
  });

  return NextResponse.json({ id: lease.id, code: lease.code }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const leases = await prisma.lease.findMany({
    include: {
      property: { select: { code: true, name: true } },
      tenant: { select: { firstName: true, lastName: true } },
    },
    orderBy: { endDate: 'asc' },
  });

  return NextResponse.json(leases);
}
