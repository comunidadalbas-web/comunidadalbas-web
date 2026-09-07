import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateTenantSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100).optional(),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(100).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  altPhone: z.string().max(20).optional(),
  idType: z.string().max(50).optional(),
  idNumber: z.string().max(50).optional(),
  emergencyName: z.string().max(200).optional(),
  emergencyPhone: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      property: { select: { code: true, name: true } },
      leases: { include: { unit: true, property: true }, orderBy: { startDate: 'desc' } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Arrendatario no encontrado' }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateTenantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Arrendatario no encontrado' }, { status: 404 });
  }

  const data = { ...parsed.data, email: parsed.data.email || undefined };
  const tenant = await prisma.tenant.update({
    where: { id },
    data,
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'TENANT_UPDATE',
    entityType: 'Tenant',
    entityId: id,
    before: { firstName: existing.firstName, lastName: existing.lastName, email: existing.email },
    after: { firstName: tenant.firstName, lastName: tenant.lastName, email: tenant.email },
  });

  return NextResponse.json(tenant);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.tenant.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: 'Arrendatario no encontrado' }, { status: 404 });
  }

  // Check if tenant has active leases
  const activeLeases = await prisma.lease.count({
    where: { tenantId: id, status: 'ACTIVE' },
  });

  if (activeLeases > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar un arrendatario con contratos activos' },
      { status: 409 },
    );
  }

  await prisma.tenant.delete({ where: { id } });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'TENANT_DELETE',
    entityType: 'Tenant',
    entityId: id,
    before: { firstName: existing.firstName, lastName: existing.lastName },
  });

  return NextResponse.json({ success: true });
}