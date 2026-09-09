import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'node:fs';

const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const prismaSchemaPath = path.resolve(projectRoot, 'packages', 'db', 'prisma', 'schema.prisma');
const webRoot = path.resolve(projectRoot, 'apps', 'web');

const prSchema = fs.readFileSync(prismaSchemaPath, 'utf8');

describe('Phase 14: Payment Reference', () => {
  it('LeaseCharge has paymentReference String @unique', () => {
    expect(prSchema).toMatch(/paymentReference\s+String\s+@unique/);
  });

  it('LeaseChargePayment has speiTrackingKey String? @unique', () => {
    expect(prSchema).toMatch(/speiTrackingKey\s+String\?\s+@unique/);
  });

  it('Both paymentReference and speiTrackingKey exist in schema', () => {
    expect(prSchema).toContain('paymentReference');
    expect(prSchema).toContain('speiTrackingKey');
  });

  it('admin rentas API routes exist', () => {
    const adminRoute = fs.readFileSync(
      path.resolve(webRoot, 'src', 'app', 'api', 'admin', 'rentas', 'route.ts'),
      'utf8'
    );
    expect(typeof adminRoute).toBe('string');
  });

  it('admin rental detail API route exists', () => {
    const detailRoute = fs.readFileSync(
      path.resolve(webRoot, 'src', 'app', 'api', 'admin', 'rentas', '[id]', 'route.ts'),
      'utf8'
    );
    expect(typeof detailRoute).toBe('string');
  });

  it('payment page uses local SPEI flow', () => {
    const page = fs.readFileSync(
      path.resolve(webRoot, 'src', 'app', 'pagos', 'page.tsx'),
      'utf8'
    );
    expect(page).toContain('Cobranza');
    expect(page).not.toContain('MERCADOPAGO');
    expect(page).not.toContain('MONTHLY_SUBSCRIPTION_URL');
  });
});