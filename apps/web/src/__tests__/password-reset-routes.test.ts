import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  rateCount: vi.fn(), rateCreate: vi.fn(), userFind: vi.fn(), userUpdate: vi.fn(),
  tokenDeleteMany: vi.fn(), tokenCreate: vi.fn(), tokenDelete: vi.fn(), tokenFind: vi.fn(), tokenUpdateMany: vi.fn(),
  send: vi.fn(), audit: vi.fn(),
}));

vi.mock('@comunidad-albas/db', () => ({ prisma: {
  rateLimitEntry: { count: mocks.rateCount, create: mocks.rateCreate },
  user: { findUnique: mocks.userFind, update: mocks.userUpdate },
  passwordResetToken: {
    deleteMany: mocks.tokenDeleteMany, create: mocks.tokenCreate, delete: mocks.tokenDelete,
    findUnique: mocks.tokenFind, updateMany: mocks.tokenUpdateMany,
  },
} }));
vi.mock('@/lib/email', () => ({ createEmailAdapter: () => ({ send: mocks.send }) }));
vi.mock('@/lib/audit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/audit')>('@/lib/audit');
  return { ...actual, writeAuditLog: mocks.audit };
});

const requestRoute = await import('@/app/api/auth/password-reset/request/route');
const confirmRoute = await import('@/app/api/auth/password-reset/confirm/route');

function request(body: unknown) {
  return new NextRequest('https://comunidadalbas.com.mx/api/auth/password-reset/request', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' }, body: JSON.stringify(body),
  });
}

describe('rutas de recuperación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-secret-for-anti-abuse-hashing';
    mocks.rateCount.mockResolvedValue(0);
    mocks.rateCreate.mockResolvedValue({});
    mocks.tokenDeleteMany.mockResolvedValue({ count: 0 });
    mocks.tokenCreate.mockResolvedValue({ id: 'r1' });
    mocks.tokenDelete.mockResolvedValue({});
    mocks.send.mockResolvedValue({ success: true });
    mocks.audit.mockResolvedValue(undefined);
  });

  it('responde de forma genérica para correo inexistente', async () => {
    mocks.userFind.mockResolvedValue(null);
    const response = await requestRoute.POST(request({ email: 'nadie@example.com' }));
    expect(response.status).toBe(200);
    expect((await response.json()).message).toContain('Si existe una cuenta asociada');
    expect(mocks.tokenCreate).not.toHaveBeenCalled();
  });

  it('mantiene respuesta genérica al alcanzar rate limit', async () => {
    mocks.rateCount.mockResolvedValue(5);
    const response = await requestRoute.POST(request({ email: 'nadie@example.com' }));
    expect(response.status).toBe(200);
    expect(mocks.userFind).not.toHaveBeenCalled();
  });

  it('almacena hash, no el token enviado por correo', async () => {
    mocks.userFind.mockResolvedValue({ id: 'u1', active: true, email: 'secretaria@comunidadalbas.com.mx', displayName: 'Secretaría' });
    await requestRoute.POST(request({ email: 'secretaria@comunidadalbas.com.mx' }));
    const data = mocks.tokenCreate.mock.calls[0][0].data;
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data).not.toHaveProperty('token');
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it.each([
    ['inexistente', null],
    ['expirado', { id: 'r1', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() - 1), user: { active: true } }],
    ['reutilizado', { id: 'r1', userId: 'u1', usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000), user: { active: true } }],
  ])('rechaza token %s', async (_label, record) => {
    mocks.tokenFind.mockResolvedValue(record);
    const response = await confirmRoute.POST(request({ token: 'x'.repeat(32), password: 'nueva-clave-segura', confirmPassword: 'nueva-clave-segura' }));
    expect(response.status).toBe(400);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('consume el token una sola vez y actualiza la contraseña', async () => {
    mocks.tokenFind.mockResolvedValue({ id: 'r1', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { active: true } });
    mocks.tokenUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    mocks.userUpdate.mockResolvedValue({});
    const response = await confirmRoute.POST(request({ token: 'x'.repeat(32), password: 'nueva-clave-segura', confirmPassword: 'nueva-clave-segura' }));
    expect(response.status).toBe(200);
    expect(mocks.userUpdate).toHaveBeenCalledOnce();
  });
});
