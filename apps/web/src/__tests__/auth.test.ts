import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionToken, verifySessionToken, buildSessionCookies, verifyCsrfToken, SESSION_COOKIE, CSRF_COOKIE } from '@/lib/auth/session';

describe('auth/password', () => {
  it('hash y verificación correctos', () => {
    const hash = hashPassword('clave-super-segura-123');
    expect(hash).toMatch(/^scrypt\$/);
    expect(verifyPassword('clave-super-segura-123', hash)).toBe(true);
  });

  it('rechaza contraseña incorrecta', () => {
    const hash = hashPassword('clave-correcta');
    expect(verifyPassword('clave-incorrecta', hash)).toBe(false);
  });

  it('usa salt aleatorio por hash', () => {
    const a = hashPassword('misma-clave');
    const b = hashPassword('misma-clave');
    expect(a).not.toBe(b);
  });

  it('rechaza formato inválido', () => {
    expect(verifyPassword('x', 'invalido')).toBe(false);
  });
});

describe('auth/session', () => {
  const payload = {
    userId: 'u1',
    email: 'a@b.com',
    displayName: 'Ana',
    roles: ['admin'],
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  it('crea token válido y verifica', () => {
    const token = createSessionToken(payload);
    const decoded = verifySessionToken(token);
    expect(decoded?.userId).toBe('u1');
    expect(decoded?.roles).toEqual(['admin']);
  });

  it('rechaza token manipulado', () => {
    const token = createSessionToken(payload);
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    expect(verifySessionToken(tampered)).toBeNull();
  });

  it('rechaza token expirado', () => {
    const expired = { ...payload, exp: Math.floor(Date.now() / 1000) - 10 };
    const token = createSessionToken(expired);
    expect(verifySessionToken(token)).toBeNull();
  });

  it('rechaza token basura', () => {
    expect(verifySessionToken('no-valid')).toBeNull();
  });

  it('genera cookies de sesión y csrf consistentes', () => {
    const { session, csrf } = buildSessionCookies(payload);
    expect(session).toBeTruthy();
    expect(csrf).toBeTruthy();
    const [value] = csrf.split('.');
    expect(verifyCsrfToken(csrf, value)).toBe(true);
    expect(verifyCsrfToken(csrf, 'wrong')).toBe(false);
  });

  it('constantes de cookie definidas', () => {
    expect(SESSION_COOKIE).toBe('patrimonio_session');
    expect(CSRF_COOKIE).toBe('patrimonio_csrf');
  });
});
