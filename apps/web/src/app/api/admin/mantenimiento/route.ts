import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createTicketSchema = z.object({
  propertyId: z.string().min(1, 'Selecciona una propiedad'),
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedTo: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

const serialize = (item: any) => ({
  ...item,
  cost: item.cost ? Number(item.cost) : null,
  reportedAt: item.reportedAt.toISOString(),
  resolvedAt: item.resolvedAt?.toISOString() ?? null,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'] });
  if (guard instanceof NextResponse) return guard;

  const items = await prisma.maintenanceTicket.findMany({
    include: { property: { select: { code: true, name: true } } },
    orderBy: { reportedAt: 'desc' },
  });

  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const ticket = await prisma.maintenanceTicket.create({
    data: data,
    include: { property: { select: { code: true, name: true } } },
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'TICKET_CREATE',
    entityType: 'MaintenanceTicket',
    entityId: ticket.id,
    after: { title: ticket.title, propertyId: ticket.propertyId, priority: ticket.priority },
  });

  return NextResponse.json({ success: true, item: serialize(ticket) }, { status: 201 });
}