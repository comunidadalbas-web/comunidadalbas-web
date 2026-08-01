import { test, expect } from '@playwright/test';
import { buildAdminCookies } from './helpers/session';

let csrfToken = '';
let cookieHeader = '';
test.beforeEach(async ({ context }) => {
  const cookies = buildAdminCookies();
  csrfToken = cookies.csrf.split('.')[0];
  cookieHeader = `albas_session=${cookies.session}; albas_csrf=${cookies.csrf}`;
  await context.addCookies([
    {
      name: 'albas_session',
      value: cookies.session,
      url: 'http://localhost:3000',
      httpOnly: true,
      sameSite: 'Lax',
    },
    { name: 'albas_csrf', value: cookies.csrf, url: 'http://localhost:3000', sameSite: 'Lax' },
  ]);
});

test('expense create and delete round trip', async ({ request }) => {
  const created = await request.post('/api/admin/expenses', {
    headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    data: {
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
      category: 'Pruebas',
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
