import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateInventorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200).optional(),
  brand: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  serialNumber: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  quantity: z.number().int().min(1).optional(),
  condition: z.enum(['GOOD', 'FAIR', 'POOR', 'RETIRED']).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

const serialize = (item: any) => ({
  ...item,
  quantity: item.quantity ?? 1,
  condition: item.condition ?? 'GOOD',
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const item = await prisma.assetInventory.findUnique({
    where: { id },
    include: { property: { select: { code: true, name: true } } },
  });

  if (!item) {
    return NextResponse.json({ error: 'Elemento de inventario no encontrado' }, { status: 404 });
  }

  return NextResponse.json(serialize(item));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateInventorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.assetInventory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Elemento de inventario no encontrado' }, { status: 404 });
  }

  const data = {
    ...parsed.data,
  } as const;

  const item = await prisma.assetInventory.update({
    where: { id },
    data: data as any,
    include: { property: { select: { code: true, name: true } } },
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'INVENTORY_UPDATE',
    entityType: 'AssetInventory',
    entityId: id,
    before: { name: existing.name, serialNumber: existing.serialNumber, condition: existing.condition },
    after: { name: item.name, serialNumber: item.serialNumber, condition: item.condition },
  });

  return NextResponse.json({ success: true, item: serialize(item) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.assetInventory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Elemento de inventario no encontrado' }, { status: 404 });
  }

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'INVENTORY_DELETE',
    entityType: 'AssetInventory',
    entityId: id,
    before: { name: existing.name, serialNumber: existing.serialNumber },
  });

  await prisma.assetInventory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}