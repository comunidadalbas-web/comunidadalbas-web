import { describe, it, expect } from 'vitest';

describe('Phase 15: Institutional Security Checks (smoke)', () => {
  it('payment config has reference model', () => {
    const schema = require('fs').readFileSync(
      'C:\\Users\\rbori\\OneDrive\\Desktop\\comunidadalbas\\packages\\db\\prisma\\schema.prisma',
      'utf8'
    );
    expect(schema).toContain('paymentReference');
  });

  it('payment page uses local SPEI flow', () => {
    const page = require('fs').readFileSync(
      'C:\\Users\\rbori\\OneDrive\\Desktop\\comunidadalbas\\apps\\web\\src\\app\\pagos\\page.tsx',
      'utf8'
    );
    expect(page).toContain('Cobranza');
  });

  it('no STRIPE in schema', () => {
    const schema = require('fs').readFileSync(
      'C:\\Users\\rbori\\OneDrive\\Desktop\\comunidadalbas\\packages\\db\\prisma\\schema.prisma',
      'utf8'
    );
    expect(schema).not.toContain('stripe');
    expect(schema).not.toContain('STRIPE_');
  });

  it('routing conflict resolved - admin API exists', () => {
    const adminRoute = require('fs').readFileSync(
      'C:\\Users\\rbori\\OneDrive\\Desktop\\comunidadalbas\\apps\\web\\src\\app\\api\\admin\\rentas\\route.ts',
      'utf8'
    );
    expect(typeof adminRoute).toBe('string');
  });

  it('email matrix file exists', () => {
    const fs = require('fs');
    const path = require('path');
    const matrixPath = path.join('C:\\Users\\rbori\\OneDrive\\Desktop\\comunidadalbas', 'email-matrix.txt');
    expect(fs.existsSync(matrixPath)).toBe(true);
  });
});