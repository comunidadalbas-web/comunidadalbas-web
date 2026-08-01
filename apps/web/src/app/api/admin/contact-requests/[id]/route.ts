import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED'] as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const status = body.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
  }

  const existing = await prisma.contactRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
  }

  const updated = await prisma.contactRequest.update({
    where: { id },
    data: { status, notes: typeof body.notes === 'string' ? body.notes : existing.notes },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.CONTACT_STATUS_CHANGE,
    entityType: 'ContactRequest',
    entityId: id,
    before: { status: existing.status },
    after: { status: updated.status, folio: updated.folio },
  });

  if (updated.status !== existing.status && updated.email && updated.folio) {
    try {
      const { sendSolicitudStatusChange } = await import('@/lib/email/notifications');
      await sendSolicitudStatusChange({
        to: updated.email,
        name: updated.name,
        folio: updated.folio,
        status: updated.status,
        category: updated.category,
      });
    } catch {
      // Notification failure is non-blocking
    }
  }

  return NextResponse.json({ success: true, item: updated });
}
