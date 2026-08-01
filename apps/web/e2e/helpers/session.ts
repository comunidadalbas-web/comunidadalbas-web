import { createHmac } from 'node:crypto';

export const E2E_SESSION_SECRET = 'e2e-session-secret-only-2026-08-01-0123456789';
export const E2E_CSRF_SECRET = 'e2e-csrf-secret-only-2026-08-01-9876543210';

export function buildAdminCookies() {
  const payload = {
    v: 'v1',
    userId: 'e2e-read-only-admin',
    email: 'e2e-admin@example.invalid',
    displayName: 'Auditoría E2E',
    roles: ['admin'],
    mustChangePassword: false,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', E2E_SESSION_SECRET).update(body).digest('base64url');
  const csrfValue = 'e2e-csrf-value-read-only';
  const csrfSignature = createHmac('sha256', E2E_CSRF_SECRET).update(csrfValue).digest('base64url');
  return {
    session: `${body}.${signature}`,
    csrf: `${csrfValue}.${csrfSignature}`,
  };
}
