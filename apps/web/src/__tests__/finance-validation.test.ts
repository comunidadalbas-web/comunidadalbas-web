import { describe, expect, it } from 'vitest';
import {
  chargeSchema,
  documentSchema,
  expenseSchema,
  manualPaymentSchema,
  paymentStatusSchema,
} from '@/lib/finance/validation';

describe('finance validation', () => {
  it('accepts a requested expense with HTTPS evidence', () => {
    expect(
      expenseSchema.safeParse({
        category: 'Mantenimiento',
        description: 'Reparación de bomba',
        amount: 1250,
        fund: 'General',
        status: 'REQUESTED',
        evidenceUrl: 'https://example.com/factura.pdf',
      }).success,
    ).toBe(true);
  });
  it('rejects non-positive expenses and insecure evidence URLs', () => {
    expect(
      expenseSchema.safeParse({
        category: 'X',
        description: 'Reparación',
        amount: 0,
        fund: 'General',
        evidenceUrl: 'http://example.com/a.pdf',
      }).success,
    ).toBe(false);
  });
  it('accepts a document with a valid SHA-256', () => {
    expect(
      documentSchema.safeParse({
        title: 'Acta',
        category: 'Actas',
        version: '1',
        visibility: 'PUBLIC',
        fileUrl: 'https://example.com/acta.pdf',
        sha256: 'a'.repeat(64),
        approved: true,
      }).success,
    ).toBe(true);
  });
  it('rejects an invalid document hash', () => {
    expect(
      documentSchema.safeParse({
        title: 'Acta',
        category: 'Actas',
        version: '1',
        visibility: 'PUBLIC',
        fileUrl: 'https://example.com/acta.pdf',
        sha256: 'abc',
      }).success,
    ).toBe(false);
  });
  it('accepts a charge and manual payment', () => {
    expect(
      chargeSchema.safeParse({ unitId: 'u1', feeConceptId: 'c1', period: '2026-08', amount: 500 })
        .success,
    ).toBe(true);
    expect(
      manualPaymentSchema.safeParse({ unitId: 'u1', amount: 500, trackingKey: 'clave-1' }).success,
    ).toBe(true);
  });
  it('requires a known payment status', () => {
    expect(paymentStatusSchema.safeParse({ status: 'APPLIED', chargeId: 'charge-1' }).success).toBe(
      true,
    );
    expect(paymentStatusSchema.safeParse({ status: 'INVENTED' }).success).toBe(false);
  });
});
