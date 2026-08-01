import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, CSRF_COOKIE } from './constants';

export { SESSION_COOKIE, CSRF_COOKIE };
const MAX_AGE_SECONDS = 60 * 60 * 12;
const SESSION_VERSION = 'v1';

export interface SessionPayload {
  v?: string;
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  mustChangePassword?: boolean;
  exp: number;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error('SESSION_SECRET no configurado');
  return value;
}

function csrfSecret(): string {
  const value = process.env.CSRF_SECRET;
  if (!value) throw new Error('CSRF_SECRET no configurado');
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function signCsrf(value: string): string {
  return createHmac('sha256', csrfSecret()).update(value).digest('base64url');
}

export function createSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify({ v: SESSION_VERSION, ...payload });
  const body = Buffer.from(json).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;
    const expected = sign(body);
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (decoded.v !== SESSION_VERSION) return null;
    if (!decoded.userId || !decoded.email || !Array.isArray(decoded.roles)) return null;
    if (typeof decoded.exp !== 'number' || decoded.exp < Date.now() / 1000) return null;
    return { ...decoded, mustChangePassword: decoded.mustChangePassword === true };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function buildSessionCookies(payload: SessionPayload): {
  session: string;
  csrf: string;
} {
  const csrfValue = randomBytes(24).toString('hex');
  const csrfSignature = signCsrf(csrfValue);
  return {
    session: createSessionToken(payload),
    csrf: `${csrfValue}.${csrfSignature}`,
  };
}

export function verifyCsrfToken(csrfCookie: string, headerValue: string): boolean {
  try {
    const [value, signature] = csrfCookie.split('.');
    if (!value || !signature) return false;
    const expected = signCsrf(value);
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;
    return timingSafeEqual(Buffer.from(value), Buffer.from(headerValue));
  } catch {
    return false;
  }
}

export function sessionExpiryDate(): Date {
  return new Date(Date.now() + MAX_AGE_SECONDS * 1000);
}
