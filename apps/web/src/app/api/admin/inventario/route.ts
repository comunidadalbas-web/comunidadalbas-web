import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createInventoryItemSchema = z.object({
  propertyId: z.string().min(1, 'Selecciona una propiedad'),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  brand: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  serialNumber: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  quantity: z.number().int().min(1).default(1),
  condition: z.enum(['GOOD', 'FAIR', 'POOR', 'RETIRED']).default('GOOD'),
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

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const items = await prisma.assetInventory.findMany({
    where: { propertyId: {} as any },
    include: { property: { select: { code: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createInventoryItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = {
    ...parsed.data,
    property: { connect: { id: parsed.data.propertyId } },
  } as const;

  const item = await prisma.assetInventory.create({
    data: data as any,
    include: { property: { select: { code: true, name: true } } },
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'INVENTORY_CREATE',
    entityType: 'AssetInventory',
    entityId: item.id,
    after: { name: item.name, propertyId: item.propertyId, condition: item.condition, serialNumber: item.serialNumber },
  });

  return NextResponse.json({ success: true, item: serialize(item) }, { status: 201 });
}