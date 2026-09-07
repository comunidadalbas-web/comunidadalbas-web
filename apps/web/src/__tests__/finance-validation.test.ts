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
        propertyId: 'prop-1',
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
        propertyId: 'prop-1',
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
        category: 'Propiedad',
        version: '1',
        documentDate: '2026-08-11',
        visibility: 'PUBLIC',
        fileUrl: 'https://example.com/acta.pdf',
        fileSizeBytes: 8_000_000,
        storageProvider: 'SUPABASE',
        storageKey: 'public/documents/2026/08/acta.pdf',
        sha256: 'a'.repeat(64),
        approved: true,
      }).success,
    ).toBe(true);
  });
  it('rejects an invalid document hash', () => {
    expect(
      documentSchema.safeParse({
        title: 'Acta',
        category: 'Actas de asambleas y reuniones',
        version: '1',
        visibility: 'PUBLIC',
        fileUrl: 'https://example.com/acta.pdf',
        sha256: 'abc',
      }).success,
    ).toBe(false);
  });
  it('rechaza categorías libres y archivos mayores de 20 MB', () => {
    const base = {
      title: 'Acta',
      category: 'Actas de asambleas y reuniones',
      visibility: 'PUBLIC',
      fileUrl: 'https://example.com/acta.pdf',
      sha256: 'a'.repeat(64),
    };
    expect(documentSchema.safeParse({ ...base, category: 'Carpeta improvisada' }).success).toBe(
      false,
    );
    expect(documentSchema.safeParse({ ...base, fileSizeBytes: 20 * 1024 * 1024 + 1 }).success).toBe(
      false,
    );
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