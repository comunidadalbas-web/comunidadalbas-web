import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const updateTicketSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().max(200).optional(),
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

const transitions: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['OPEN'],
};

const serialize = (item: any) => ({
  ...item,
  cost: item.cost ? Number(item.cost) : null,
  reportedAt: item.reportedAt.toISOString(),
  resolvedAt: item.resolvedAt?.toISOString() ?? null,
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
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: { property: { select: { code: true, name: true } } },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  }

  return NextResponse.json(serialize(ticket));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.maintenanceTicket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  }

  const data = parsed.data;
  if (
    data.status &&
    data.status !== existing.status &&
    !transitions[existing.status]?.includes(data.status)
  ) {
    return NextResponse.json(
      { error: `Transición no permitida: ${existing.status} → ${data.status}` },
      { status: 409 },
    );
  }

  const ticket = await prisma.maintenanceTicket.update({
    where: { id },
    data: {
      ...data,
      ...(data.status === 'RESOLVED' && { resolvedAt: new Date() }),
      ...(data.status === 'CLOSED' && { resolvedAt: new Date() }),
    },
    include: { property: { select: { code: true, name: true } } },
  });

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'TICKET_UPDATE',
    entityType: 'MaintenanceTicket',
    entityId: id,
    before: { status: existing.status, priority: existing.priority, cost: existing.cost },
    after: { status: ticket.status, priority: ticket.priority, cost: ticket.cost },
  });

  return NextResponse.json({ success: true, item: serialize(ticket) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminRequest(request, { roles: ['owner'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.maintenanceTicket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
  }

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'TICKET_DELETE',
    entityType: 'MaintenanceTicket',
    entityId: id,
    before: { title: existing.title, status: existing.status },
  });

  await prisma.maintenanceTicket.delete({ where: { id } });

  return NextResponse.json({ success: true });
}