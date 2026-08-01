import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { calendarEventSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = calendarEventSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
  }

  const data = parsed.data;
  const item = await prisma.calendarEvent.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.location !== undefined && { location: data.location?.trim() || null }),
      ...(data.startsAt !== undefined && { startsAt: new Date(data.startsAt) }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
  }

  await prisma.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
