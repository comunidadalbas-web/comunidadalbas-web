import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createPropertySchema = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(20),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  type: z.string().max(50).default('Departamento'),
  state: z.string().max(100).optional(),
  municipality: z.string().max(100).optional(),
  development: z.string().max(200).optional(),
  privateArea: z.string().max(200).optional(),
  unitNumber: z.string().max(20).optional(),
  areaM2: z.coerce.number().positive().optional(),
  parkingSpace: z.string().max(20).optional(),
  use: z.string().max(50).default('Habitacional'),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const existing = await prisma.property.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una propiedad con ese código' }, { status: 409 });
  }

  const property = await prisma.property.create({ data: parsed.data });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'PROPERTY_CREATE',
    entityType: 'Property',
    entityId: property.id,
    after: { code: property.code, name: property.name },
  });

  return NextResponse.json({ id: property.id, code: property.code }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const properties = await prisma.property.findMany({
    include: {
      _count: { select: { units: true, leases: true, tickets: true } },
    },
    orderBy: { code: 'asc' },
  });

  return NextResponse.json(properties);
}
