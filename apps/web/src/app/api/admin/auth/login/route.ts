import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { verifyPassword } from '@/lib/auth/password';
import { buildSessionCookies, sessionExpiryDate, SESSION_COOKIE, CSRF_COOKIE } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Correo inválido').max(254),
  password: z.string().min(1, 'La contraseña es obligatoria').max(200),
});

const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;

interface Attempt {
  count: number;
  blockedUntil: number;
}

const attempts = new Map<string, Attempt>();

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const current = attempts.get(ip);
  if (current && current.blockedUntil > now) {
    const waitMin = Math.ceil((current.blockedUntil - now) / 60000);
    return NextResponse.json({ error: `Demasiados intentos. Espera ${waitMin} min.` }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Correo o contraseña inválidos' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const ok = user && user.active && verifyPassword(password, user.passwordHash);

  if (!ok) {
    const entry = current && current.blockedUntil > now ? current : { count: 0, blockedUntil: 0 };
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
      entry.blockedUntil = now + WINDOW_MS;
      entry.count = 0;
    }
    attempts.set(ip, entry);
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  attempts.delete(ip);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN,
    entityType: 'User',
    entityId: user.id,
    after: { email: user.email },
  });

  const roles = (await prisma.roleAssignment.findMany({ where: { userId: user.id } })).map((r) => r.role);

  const payload = {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    roles,
    exp: Math.floor(sessionExpiryDate().getTime() / 1000),
  };

  const { session, csrf } = buildSessionCookies(payload);

  const response = NextResponse.json({ success: true, user: { email: user.email, displayName: user.displayName, roles } });
  response.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  response.cookies.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
