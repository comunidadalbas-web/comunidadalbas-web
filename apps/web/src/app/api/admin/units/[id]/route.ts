import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { unitSchema } from '@/lib/catalog/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = unitSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.unit.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 });
  }

  const data = parsed.data;
  if (data.code) {
    const dup = await prisma.unit.findUnique({ where: { code: data.code.trim() } });
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: 'Ya existe un departamento con ese código' }, { status: 409 });
    }
  }
  if (data.buildingId) {
    const building = await prisma.building.findUnique({ where: { id: data.buildingId } });
    if (!building) return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 400 });
  }
  if (data.buildingId && data.apartmentNumber !== undefined) {
    const dupInBuilding = await prisma.unit.findFirst({
      where: { buildingId: data.buildingId, apartmentNumber: data.apartmentNumber.trim(), NOT: { id } },
    });
    if (dupInBuilding) {
      return NextResponse.json({ error: 'Ese departamento ya existe en el edificio' }, { status: 409 });
    }
  }

  const item = await prisma.unit.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code.trim() }),
      ...(data.apartmentNumber !== undefined && { apartmentNumber: data.apartmentNumber.trim() }),
      ...(data.buildingId !== undefined && { buildingId: data.buildingId }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const existing = await prisma.unit.findUnique({
    where: { id },
    include: { _count: { select: { charges: true, payments: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Departamento no encontrado' }, { status: 404 });
  }
  if (existing._count.charges > 0 || existing._count.payments > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: el departamento tiene cargos o pagos' },
      { status: 409 },
    );
  }

  await prisma.unit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
