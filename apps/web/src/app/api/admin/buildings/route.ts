import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { buildingSchema } from '@/lib/catalog/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const buildings = await prisma.building.findMany({
    orderBy: { code: 'asc' },
    include: { _count: { select: { units: true } } },
  });

  return NextResponse.json({
    items: buildings.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      status: b.status,
      units: b._count.units,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = buildingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const existing = await prisma.building.findUnique({ where: { code: data.code.trim() } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un edificio con ese código' }, { status: 409 });
  }

  const item = await prisma.building.create({
    data: { code: data.code.trim(), name: data.name.trim(), status: data.status },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
