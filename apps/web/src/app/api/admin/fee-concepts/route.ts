import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { feeConceptSchema } from '@/lib/catalog/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const concepts = await prisma.feeConcept.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: concepts.map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount),
      authoritySource: c.authoritySource,
      status: c.status,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'tesorero', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = feeConceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const existing = await prisma.feeConcept.findFirst({ where: { name: data.name.trim() } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un concepto con ese nombre' }, { status: 409 });
  }

  const item = await prisma.feeConcept.create({
    data: {
      name: data.name.trim(),
      amount: data.amount,
      authoritySource: data.authoritySource.trim(),
      status: data.status,
    },
  });

  return NextResponse.json(
    { success: true, item: { ...item, amount: Number(item.amount) } },
    { status: 201 },
  );
}
