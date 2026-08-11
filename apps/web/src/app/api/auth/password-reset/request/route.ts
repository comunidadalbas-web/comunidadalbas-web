import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { createEmailAdapter } from '@/lib/email';
import { renderPasswordReset } from '@/lib/email/templates';
import {
  generatePasswordResetToken,
  hashAntiAbuseValue,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} from '@/lib/auth/password-reset';
import { writeAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const GENERIC_MESSAGE = 'Si existe una cuenta asociada, recibirás instrucciones para restablecer tu contraseña.';
const schema = z.object({ email: z.string().email().max(254) });
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function genericResponse() {
  return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return genericResponse();

  const email = parsed.data.email.trim().toLowerCase();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  try {
    const keys = [
      `password-reset:ip:${hashAntiAbuseValue(ip)}`,
      `password-reset:email:${hashAntiAbuseValue(email)}`,
    ];
    const since = new Date(Date.now() - WINDOW_MS);
    const counts = await Promise.all(
      keys.map((key) => prisma.rateLimitEntry.count({ where: { key, createdAt: { gte: since } } })),
    );
    if (counts.some((count) => count >= MAX_REQUESTS)) return genericResponse();
    await Promise.all(keys.map((key) => prisma.rateLimitEntry.create({ data: { key } })));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return genericResponse();

    const token = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    const record = await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comunidadalbas.com.mx';
    const resetUrl = `${siteUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
    const rendered = renderPasswordReset({
      displayName: user.displayName,
      resetUrl,
      expiresInMinutes: Math.round(PASSWORD_RESET_TTL_MS / 60000),
    });
    const sent = await createEmailAdapter().send({
      to: user.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
    if (!sent.success) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => undefined);
      return genericResponse();
    }

    await writeAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      entityType: 'User',
      entityId: user.id,
    });
  } catch {
    // The public response remains generic and never exposes account or mail state.
  }

  return genericResponse();
}
