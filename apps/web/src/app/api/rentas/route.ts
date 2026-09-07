import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const listQuerySchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT', 'PENDING_REVIEW', 'RESERVED', 'RENTED', 'ARCHIVED']).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const parsed = listQuerySchema.safeParse({ status: status ?? 'PUBLISHED' });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetro status inválido' },
      { status: 400 },
    );
  }

  const where = {
    status: parsed.data.status,
  };

  const items = await prisma.listing.findMany({
    where,
    include: { property: { select: { code: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}