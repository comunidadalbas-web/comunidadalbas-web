import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  postFind: vi.fn(), commentFindMany: vi.fn(), commentFind: vi.fn(), commentCreate: vi.fn(), commentUpdate: vi.fn(),
  rateCount: vi.fn(), rateCreate: vi.fn(), guard: vi.fn(), audit: vi.fn(),
}));

vi.mock('@comunidad-albas/db', () => ({ prisma: {
  blogPost: { findUnique: mocks.postFind },
  blogComment: { findMany: mocks.commentFindMany, findUnique: mocks.commentFind, create: mocks.commentCreate, update: mocks.commentUpdate },
  rateLimitEntry: { count: mocks.rateCount, create: mocks.rateCreate },
} }));
vi.mock('@/lib/auth/guards', () => ({ guardAdminRequest: mocks.guard }));
vi.mock('@/lib/audit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/audit')>('@/lib/audit');
  return { ...actual, writeAuditLog: mocks.audit };
});

const publicRoute = await import('@/app/api/blog/[slug]/comments/route');
const adminRoute = await import('@/app/api/admin/blog/comments/[id]/route');
const context = { params: Promise.resolve({ slug: 'publicacion' }) };

function publicRequest(body?: unknown, cursor?: string) {
  return new NextRequest(`https://comunidadalbas.com.mx/api/blog/publicacion/comments${cursor ? `?cursor=${cursor}` : ''}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.20', 'user-agent': 'vitest' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe('rutas de opiniones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-secret-for-blog-comment-hashes';
    mocks.postFind.mockResolvedValue({ id: 'p1', status: 'PUBLISHED', commentsEnabled: true });
    mocks.rateCount.mockResolvedValue(0);
    mocks.rateCreate.mockResolvedValue({});
    mocks.commentCreate.mockResolvedValue({ id: 'c-new', status: 'PENDING' });
    mocks.audit.mockResolvedValue(undefined);
    mocks.guard.mockResolvedValue({ session: { userId: 'admin1', email: 'secretaria@comunidadalbas.com.mx' } });
  });

  it('pagina 20 opiniones publicadas y entrega cursor', async () => {
    mocks.commentFindMany.mockResolvedValue(Array.from({ length: 21 }, (_, index) => ({
      id: `c${index}`, displayName: `Alias ${index}`, body: 'Texto', isInstitutional: false,
      createdAt: new Date(2026, 0, index + 1), replies: [],
    })));
    const response = await publicRoute.GET(publicRequest(), context);
    const data = await response.json();
    expect(data.items).toHaveLength(20);
    expect(data.nextCursor).toBe('c19');
  });

  it('crea una opinión válida como pendiente', async () => {
    const response = await publicRoute.POST(publicRequest({
      displayName: 'Vecina', email: 'vecina@example.com', body: 'Una opinión válida', privacyAccepted: true, website: '',
    }), context);
    expect(response.status).toBe(201);
    expect(mocks.commentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }));
  });

  it('elimina HTML antes de almacenar', async () => {
    await publicRoute.POST(publicRequest({
      displayName: '<b>Alias</b>', email: 'vecina@example.com', body: '<img src=x onerror=alert(1)>Texto seguro', privacyAccepted: true, website: '',
    }), context);
    expect(mocks.commentCreate.mock.calls[0][0].data.displayName).toBe('Alias');
    expect(mocks.commentCreate.mock.calls[0][0].data.body).toBe('Texto seguro');
  });

  it('aplica rate limit de cinco envíos en diez minutos', async () => {
    mocks.rateCount.mockResolvedValue(5);
    const response = await publicRoute.POST(publicRequest({
      displayName: 'Vecina', email: 'vecina@example.com', body: 'Una opinión válida', privacyAccepted: true, website: '',
    }), context);
    expect(response.status).toBe(429);
    expect(mocks.commentCreate).not.toHaveBeenCalled();
  });

  it('impide respuestas de segundo nivel', async () => {
    mocks.commentFind.mockResolvedValue({ id: 'reply1', postId: 'p1', parentId: 'c1', status: 'PUBLISHED' });
    const response = await publicRoute.POST(publicRequest({
      displayName: 'Vecina', email: 'vecina@example.com', body: 'Una respuesta', parentId: 'reply1', privacyAccepted: true, website: '',
    }), context);
    expect(response.status).toBe(400);
  });

  it('exige acceso administrativo para moderar', async () => {
    mocks.guard.mockResolvedValue(NextResponse.json({ error: 'Sesión requerida' }, { status: 401 }));
    const response = await adminRoute.PATCH(publicRequest({ status: 'PUBLISHED' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(401);
  });

  it('publica una opinión mediante moderación y registra auditoría', async () => {
    mocks.commentFind.mockResolvedValue({ id: 'c1', postId: 'p1', parentId: null, status: 'PENDING' });
    mocks.commentUpdate.mockResolvedValue({ id: 'c1', status: 'PUBLISHED' });
    const response = await adminRoute.PATCH(publicRequest({ status: 'PUBLISHED' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(200);
    expect(mocks.audit).toHaveBeenCalledOnce();
  });

  it('crea respuesta institucional de un solo nivel', async () => {
    mocks.commentFind.mockResolvedValue({ id: 'c1', postId: 'p1', parentId: null, status: 'PUBLISHED' });
    mocks.commentCreate.mockResolvedValue({ id: 'r1', status: 'PUBLISHED' });
    const response = await adminRoute.PATCH(publicRequest({ replyBody: 'Respuesta institucional' }), { params: Promise.resolve({ id: 'c1' }) });
    expect(response.status).toBe(201);
    expect(mocks.commentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ displayName: 'Comunidad Albas', isInstitutional: true }) }));
  });
});
