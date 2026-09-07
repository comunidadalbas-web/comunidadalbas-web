import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createTenantSchema = z.object({
  propertyId: z.string().min(1, 'Selecciona una propiedad'),
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(100),
  email: z.string().email().max(254).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  altPhone: z.string().max(20).optional(),
  idType: z.string().max(50).optional(),
  idNumber: z.string().max(50).optional(),
  emergencyName: z.string().max(200).optional(),
  emergencyPhone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const data = { ...parsed.data, email: parsed.data.email || undefined };
  const tenant = await prisma.tenant.create({ data });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'TENANT_CREATE',
    entityType: 'Tenant',
    entityId: tenant.id,
    after: { firstName: tenant.firstName, lastName: tenant.lastName },
  });

  return NextResponse.json({ id: tenant.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const tenants = await prisma.tenant.findMany({
    include: {
      property: { select: { code: true, name: true } },
      leases: { where: { status: 'ACTIVE' }, take: 1 },
    },
    orderBy: { lastName: 'asc' },
  });

  return NextResponse.json(tenants);
}
