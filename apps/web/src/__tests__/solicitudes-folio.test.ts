import { describe, it, expect } from 'vitest';
import {
  buildFolio,
  folioYear,
  nextFolioSequence,
  hasUniqueConflict,
  assignFolio,
} from '@/lib/solicitudes/folio';

describe('solicitudes/folio', () => {
  it('builds a CA-YYYY-NNNNNN folio', () => {
    expect(buildFolio(2026, 1)).toBe('CA-2026-000001');
    expect(buildFolio(2026, 123)).toBe('CA-2026-000123');
  });

  it('extracts year from a folio', () => {
    expect(folioYear('CA-2026-000123')).toBe(2026);
    expect(folioYear('CA-9999-000001')).toBe(9999);
  });

  it('returns null for malformed folio', () => {
    expect(folioYear('CA-26-123')).toBeNull();
    expect(folioYear('')).toBeNull();
    expect(folioYear(null as unknown as string)).toBeNull();
  });

  it('computes next sequence per year ignoring other years', () => {
    const existing = [
      { folio: 'CA-2026-000010' },
      { folio: 'CA-2026-000007' },
      { folio: 'CA-2025-000999' },
      { folio: null },
    ];
    expect(nextFolioSequence(existing, 2026)).toBe(11);
    expect(nextFolioSequence(existing, 2025)).toBe(1000);
  });

  it('starts at 1 when no folios exist', () => {
    expect(nextFolioSequence([], 2026)).toBe(1);
    expect(nextFolioSequence([{ folio: null }], 2026)).toBe(1);
  });

  it('detects P2002 unique conflict', () => {
    expect(hasUniqueConflict({ code: 'P2002', meta: { target: ['folio'] } })).toBe(true);
    expect(hasUniqueConflict({ code: 'P2002', meta: { target: ['email'] } })).toBe(false);
    expect(hasUniqueConflict(new Error('other'))).toBe(false);
  });

  it('assignFolio retries on unique conflict and returns assigned folio', async () => {
    let created = 0;
    const calls: string[] = [];
    const folio = await assignFolio(
      async () => [{ id: 'x', folio: 'CA-2026-000001' }],
      async (f) => {
        calls.push(f);
        if (created++ === 0) {
          throw { code: 'P2002', meta: { target: ['folio'] } };
        }
      },
      2026,
    );
    expect(folio).toBe('CA-2026-000002');
    expect(calls).toEqual(['CA-2026-000002', 'CA-2026-000002']);
  });

  it('assignFolio throws after exhausting retries', async () => {
    await expect(
      assignFolio(
        async () => [],
        async () => {
          throw { code: 'P2002', meta: { target: ['folio'] } };
        },
        2026,
      ),
    ).rejects.toThrow('folio único');
  });

  it('assignFolio rethrows non-conflict errors', async () => {
    await expect(
      assignFolio(
        async () => [],
        async () => {
          throw new Error('db down');
        },
        2026,
      ),
    ).rejects.toThrow('db down');
  });
});
