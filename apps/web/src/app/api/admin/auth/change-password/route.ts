import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { buildSessionCookies, sessionExpiryDate, SESSION_COOKIE, CSRF_COOKIE } from '@/lib/auth/session';
import { writeAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual').max(200),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres').max(200),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña').max(200),
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { csrf: true, allowMustChangePassword: true });
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const body = await request.json().catch(() => ({}));
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.active) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
  }
  if (verifyPassword(newPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'La nueva contraseña debe ser diferente a la actual' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword), mustChangePassword: false },
  });

  await writeAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
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
    mustChangePassword: false,
    exp: Math.floor(sessionExpiryDate().getTime() / 1000),
  };

  const { session: newSession, csrf } = buildSessionCookies(payload);

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, newSession, {
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
