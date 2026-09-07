import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const getBySlugSchema = z.object({
  slug: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const parsed = getBySlugSchema.safeParse({ slug });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Slug inválido' },
      { status: 400 },
    );
  }

  const item = await prisma.listing.findUnique({
    where: { slug },
    include: { property: { select: { code: true, name: true } } },
  });

  if (!item) {
    return NextResponse.json({ error: 'No publicado' }, { status: 404 });
  }

  if (item.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'No publicado' }, { status: 404 });
  }

  return NextResponse.json({ item });
}