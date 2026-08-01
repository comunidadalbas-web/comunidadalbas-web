import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

type ContactStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'ARCHIVED';
const VALID_STATUSES: ContactStatus[] = ['NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED'];

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request);
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') || undefined;
  const status = VALID_STATUSES.includes(statusParam as ContactStatus)
    ? (statusParam as ContactStatus)
    : undefined;
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.contactRequest.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
