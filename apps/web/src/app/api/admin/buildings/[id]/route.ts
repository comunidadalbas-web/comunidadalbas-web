import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { buildingSchema } from '@/lib/catalog/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = buildingSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.building.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
  }

  const data = parsed.data;
  if (data.code) {
    const dup = await prisma.building.findUnique({ where: { code: data.code.trim() } });
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: 'Ya existe un edificio con ese código' }, { status: 409 });
    }
  }

  const item = await prisma.building.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code.trim() }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const existing = await prisma.building.findUnique({
    where: { id },
    include: { _count: { select: { units: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
  }
  if (existing._count.units > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: el edificio tiene departamentos asignados' },
      { status: 409 },
    );
  }

  await prisma.building.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
