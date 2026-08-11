import { describe, expect, it } from 'vitest';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetTokenIsUsable,
} from '@/lib/auth/password-reset';

describe('recuperación de contraseña', () => {
  it('genera tokens aleatorios y conserva únicamente un hash SHA-256', () => {
    const first = generatePasswordResetToken();
    const second = generatePasswordResetToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashPasswordResetToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPasswordResetToken(first)).not.toContain(first);
  });

  it('acepta un token vigente y no usado', () => {
    expect(passwordResetTokenIsUsable({ usedAt: null, expiresAt: new Date(Date.now() + 60_000) })).toBe(true);
  });

  it('rechaza token expirado', () => {
    expect(passwordResetTokenIsUsable({ usedAt: null, expiresAt: new Date(Date.now() - 1) })).toBe(false);
  });

  it('rechaza token reutilizado', () => {
    expect(passwordResetTokenIsUsable({ usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) })).toBe(false);
  });
});
