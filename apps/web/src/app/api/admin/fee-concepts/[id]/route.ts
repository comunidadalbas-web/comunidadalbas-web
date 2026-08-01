import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { feeConceptSchema } from '@/lib/catalog/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = feeConceptSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.feeConcept.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Concepto no encontrado' }, { status: 404 });
  }

  const data = parsed.data;
  if (data.name) {
    const dup = await prisma.feeConcept.findFirst({ where: { name: data.name.trim(), NOT: { id } } });
    if (dup) {
      return NextResponse.json({ error: 'Ya existe un concepto con ese nombre' }, { status: 409 });
    }
  }

  const item = await prisma.feeConcept.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.authoritySource !== undefined && { authoritySource: data.authoritySource.trim() }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return NextResponse.json({ success: true, item: { ...item, amount: Number(item.amount) } });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const existing = await prisma.feeConcept.findUnique({
    where: { id },
    include: { _count: { select: { charges: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Concepto no encontrado' }, { status: 404 });
  }
  if (existing._count.charges > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: el concepto tiene cargos asociados' },
      { status: 409 },
    );
  }

  await prisma.feeConcept.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
