import { createHmac } from 'node:crypto';

export const E2E_SESSION_SECRET = 'e2e-session-secret-only-2026-08-01-0123456789';
export const E2E_CSRF_SECRET = 'e2e-csrf-secret-only-2026-08-01-9876543210';

const E2E_DB_URL =
  process.env.E2E_DATABASE_URL ||
  'postgresql://albas:albas_dev@localhost:55432/comunidadalbas_e2e';

// Network guardrail: fail immediately if E2E touches a remote host
const FORBIDDEN_HOSTS = ['neon.tech', 'aws.neon.tech'];
const DB_HOST = E2E_DB_URL.toLowerCase();
for (const h of FORBIDDEN_HOSTS) {
  if (DB_HOST.includes(h)) {
    throw new Error(`E2E blocked: database host contains "${h}". E2E must use local Postgres only.`);
  }
}

export function buildAdminCookies() {
  const payload = {
    v: 'v1',
    userId: 'e2e-read-only-admin',
    email: 'e2e-admin@example.invalid',
    displayName: 'Auditoría E2E',
    roles: ['admin', 'owner', 'tesorero'],
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

/**
 * Build cookies for a specific user role.
 * Uses deterministic payloads - the actual user must exist in the database
 * for the session to be validated server-side.
 * 
 * @param userId - The user ID (must match a user in the DB)
 * @param email - The user email (must match a user in the DB)
 * @param displayName - The user display name
 * @param roles - Array of role strings
 * @returns {object} session and csrf cookies
 */
export function buildUserCookies(
  userId: string,
  email: string,
  displayName: string,
  roles: string[]
) {
  const payload = {
    v: 'v1',
    userId,
    email,
    displayName,
    roles,
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