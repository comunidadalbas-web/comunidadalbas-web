import { createHash, createHmac, randomBytes } from 'node:crypto';

export const PASSWORD_RESET_TTL_MS = 25 * 60 * 1000;

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashAntiAbuseValue(value: string): string {
  const secret = process.env.ANTI_ABUSE_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error('Secreto antiabuso no configurado');
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function passwordResetTokenIsUsable(record: {
  usedAt: Date | null;
  expiresAt: Date;
}, now = new Date()): boolean {
  return record.usedAt === null && record.expiresAt.getTime() > now.getTime();
}
