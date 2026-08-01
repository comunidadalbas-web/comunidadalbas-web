import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { calendarEventSchema } from '@/lib/cms/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 100), 200);

  const items = await prisma.calendarEvent.findMany({
    orderBy: { startsAt: 'asc' },
    take: limit,
  });

  return NextResponse.json({ items, total: items.length });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['director', 'secretario', 'admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = calendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;
  const item = await prisma.calendarEvent.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      location: data.location?.trim() || null,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      status: data.status,
      createdById: guard.session.userId,
    },
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
