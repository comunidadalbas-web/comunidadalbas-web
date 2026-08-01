import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, verifyCsrfToken, CSRF_COOKIE } from './session';
import type { SessionPayload } from './session';

export const ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  TESORERO: 'tesorero',
  SECRETARIO: 'secretario',
  VOCAL: 'vocal',
  RESIDENT: 'resident',
} as const;

export async function requireSession(request: NextRequest): Promise<SessionPayload | null> {
  return getSessionFromRequest();
}

export function hasRole(session: SessionPayload | null, ...allowed: string[]): boolean {
  if (!session) return false;
  if (session.roles.includes(ROLES.ADMIN)) return true;
  return allowed.some((role) => session.roles.includes(role));
}

export async function requireAdminPage(): Promise<SessionPayload | null> {
  return getSessionFromRequest();
}

export function requireCsrf(request: NextRequest): boolean {
  const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value;
  if (!csrfCookie) return false;
  const headerValue = request.headers.get('x-csrf-token');
  if (!headerValue) return false;
  return verifyCsrfToken(csrfCookie, headerValue);
}

export function unauthorized(message = 'No autorizado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Acceso denegado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badCsrf(): NextResponse {
  return NextResponse.json({ error: 'Token de seguridad inválido' }, { status: 403 });
}

export async function guardAdminRequest(
  request: NextRequest,
  opts: { roles?: string[]; csrf?: boolean } = {},
): Promise<{ session: SessionPayload } | NextResponse> {
  const session = await getSessionFromRequest();
  if (!session) return unauthorized('Sesión requerida');

  if (opts.roles && opts.roles.length > 0 && !hasRole(session, ...opts.roles)) {
    return forbidden();
  }

  if (opts.csrf && !requireCsrf(request)) {
    return badCsrf();
  }

  return { session };
}

export function isAuthenticatedSession(session: SessionPayload | null): session is SessionPayload {
  return session !== null;
}
