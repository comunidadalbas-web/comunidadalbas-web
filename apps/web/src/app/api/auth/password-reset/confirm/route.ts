import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth/password';
import { hashPasswordResetToken, passwordResetTokenIsUsable } from '@/lib/auth/password-reset';
import { writeAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres').max(200),
  confirmPassword: z.string().min(1).max(200),
});

const INVALID_MESSAGE = 'El enlace no es válido, ya fue utilizado o expiró.';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  const now = new Date();
  if (!record || !record.user.active || !passwordResetTokenIsUsable(record, now)) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  const consumed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (consumed.count !== 1) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: hashPassword(parsed.data.password), mustChangePassword: false },
  });
  await prisma.passwordResetToken.updateMany({
    where: { userId: record.userId, usedAt: null },
    data: { usedAt: now },
  });
  await writeAuditLog({
    userId: record.userId,
    action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
    entityType: 'User',
    entityId: record.userId,
  });

  return NextResponse.json({ success: true });
}
