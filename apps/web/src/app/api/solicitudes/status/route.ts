import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const lookupSchema = z.object({
  folio: z.string().regex(/^CA-\d{4}-\d{6}$/, 'Folio no válido'),
  email: z.string().email('Correo inválido').max(254),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas consultas. Intenta de nuevo en un minuto.' },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Folio o correo no válidos' }, { status: 400 });
  }

  const { folio, email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const item = await prisma.contactRequest.findUnique({ where: { folio } });
  if (!item || item.email.toLowerCase() !== normalizedEmail) {
    return NextResponse.json({ error: 'No se encontró la solicitud con esos datos.' }, { status: 404 });
  }

  return NextResponse.json({
    folio: item.folio,
    category: item.category,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}
