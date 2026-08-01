import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { unitSchema } from '@/lib/catalog/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const units = await prisma.unit.findMany({
    orderBy: [{ building: { code: 'asc' } }, { apartmentNumber: 'asc' }],
    include: { building: { select: { code: true, name: true } } },
  });

  return NextResponse.json({
    items: units.map((u) => ({
      id: u.id,
      code: u.code,
      apartmentNumber: u.apartmentNumber,
      buildingId: u.buildingId,
      buildingCode: u.building.code,
      buildingName: u.building.name,
      status: u.status,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const building = await prisma.building.findUnique({ where: { id: data.buildingId } });
  if (!building) {
    return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 400 });
  }

  const dup = await prisma.unit.findUnique({ where: { code: data.code.trim() } });
  if (dup) {
    return NextResponse.json({ error: 'Ya existe un departamento con ese código' }, { status: 409 });
  }
  const dupInBuilding = await prisma.unit.findFirst({
    where: { buildingId: data.buildingId, apartmentNumber: data.apartmentNumber.trim() },
  });
  if (dupInBuilding) {
    return NextResponse.json(
      { error: 'Ese departamento ya existe en el edificio' },
      { status: 409 },
    );
  }

  const item = await prisma.unit.create({
    data: {
      code: data.code.trim(),
      apartmentNumber: data.apartmentNumber.trim(),
      buildingId: data.buildingId,
      status: data.status,
    },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
