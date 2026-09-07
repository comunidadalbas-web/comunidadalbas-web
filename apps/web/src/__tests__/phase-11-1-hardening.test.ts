import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('Fase 11.1 - Publicación gratuita hardening', () => {
  it('Zod rejects invalid email', () => {
    const result = z.object({ email: z.string().email() }).safeParse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('Zod rejects negative rent', () => {
    const result = z
      .object({ monthlyRent: z.coerce.number().min(0) })
      .safeParse({ monthlyRent: -100 });
    expect(result.success).toBe(false);
  });

  it('Zod rejects required fields when empty', () => {
    const result = z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
        privateArea: z.string().min(1),
        acceptPrivacy: z.boolean().refine(val => val === true),
        acceptAuthorization: z.boolean().refine(val => val === true),
      })
      .safeParse({
        name: '',
        email: '',
        privateArea: '',
        acceptPrivacy: false,
        acceptAuthorization: false,
      });
    expect(result.success).toBe(false);
  });

  it('Zod string max length enforcement', () => {
    const result = z.object({ name: z.string().max(5) }).safeParse({ name: 'abcdef' });
    expect(result.success).toBe(false);
  });

  it('Zod boolean refinement', () => {
    const result = z
      .object({ accept: z.boolean().refine(val => val === true) })
      .safeParse({ accept: false });
    expect(result.success).toBe(false);
  });

  it('Zod number range enforcement', () => {
    const result = z
      .object({ rent: z.coerce.number().min(0).max(100000) })
      .safeParse({ rent: 999999 });
    expect(result.success).toBe(false);
  });

  it('Zod optional field passthrough', () => {
    const result = z
      .object({ phone: z.string().max(50).optional() })
      .safeParse({});
    expect(result.success).toBe(true);

    const result2 = z
      .object({ phone: z.string().max(50).optional() })
      .safeParse({ phone: '12345' });
    expect(result2.success).toBe(true);
  });

  it('Zod requires all fields by default', () => {
    const schema = z.object({ name: z.string().min(1), email: z.string().email() });
    // When all fields are required, missing fields cause failure
    const parsed = schema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});