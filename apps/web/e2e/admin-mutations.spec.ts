import { test, expect } from '@playwright/test';
import { buildAdminCookies } from './helpers/session';
import { Client } from 'pg';

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  'postgresql://albas:albas_dev@localhost:55432/comunidadalbas_e2e';

let csrfToken = '';
let cookieHeader = '';
test.beforeEach(async ({ context }) => {
  const cookies = buildAdminCookies();
  csrfToken = cookies.csrf.split('.')[0];
  cookieHeader = `patrimonio_session=${cookies.session}; patrimonio_csrf=${cookies.csrf}`;
  await context.addCookies([
    {
      name: 'patrimonio_session',
      value: cookies.session,
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
    { name: 'patrimonio_csrf', value: cookies.csrf, url: 'http://localhost:3000', sameSite: 'Lax' },
  ]);
});

async function getOrCreatePropertyId(): Promise<string> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    const existing = await client.query(`SELECT id FROM "Property" WHERE code = 'E2E-TEST' LIMIT 1`);
    if (existing.rows.length > 0) return existing.rows[0].id;
    const id = 'e2e_' + Date.now().toString(36);
    await client.query(
      `INSERT INTO "Property" (id, code, name, type, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [id, 'E2E-TEST', 'Propiedad de prueba E2E', 'Departamento']
    );
    return id;
  } finally {
    await client.end();
  }
}

test('expense create and delete round trip', async ({ request }) => {
  const propertyId = await getOrCreatePropertyId();
  const created = await request.post('/api/admin/expenses', {
    headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    data: {
      propertyId,
      category: 'Prueba técnica',
      description: 'Registro efímero E2E',
      amount: 1,
      fund: 'Pruebas',
      status: 'REQUESTED',
    },
  });
  expect(created.status()).toBe(201);
  const item = (await created.json()).item;
  try {
    const invalid = await request.patch(`/api/admin/expenses/${item.id}`, {
      headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
      data: { status: 'RECONCILED' },
    });
    expect(invalid.status()).toBe(409);
  } finally {
    const removed = await request.delete(`/api/admin/expenses/${item.id}`, {
      headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    });
    expect(removed.status()).toBe(200);
  }
});

test('document create and delete round trip', async ({ request }) => {
  const created = await request.post('/api/admin/documents', {
    headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    data: {
      title: 'Prueba técnica E2E',
      category: 'Administración',
      version: '1',
      visibility: 'RESTRICTED',
      fileUrl: 'https://example.com/e2e.pdf',
      sha256: 'e'.repeat(64),
      approved: false,
    },
  });
  expect(created.status()).toBe(201);
  const item = (await created.json()).item;
  const removed = await request.delete(`/api/admin/documents/${item.id}`, {
    headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
  });
  expect(removed.status()).toBe(200);
});

test('finance APIs reject movements without a real unit', async ({ request }) => {
  const charge = await request.post('/api/admin/charges', {
    headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    data: { unitId: 'missing', feeConceptId: 'missing', period: '2026-08', amount: 1 },
  });
  expect(charge.status()).toBe(400);
  const payment = await request.post('/api/admin/payments', {
    headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    data: { unitId: 'missing', amount: 1 },
  });
  expect(payment.status()).toBe(400);
});
