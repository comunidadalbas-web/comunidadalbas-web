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

  return NextResponse.json({ success: true, item: updated });
}
