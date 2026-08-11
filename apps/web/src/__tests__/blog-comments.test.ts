import { describe, expect, it } from 'vitest';
import { blogCommentSchema, sanitizePlainText, toPublicComment } from '@/lib/blog-comments';

describe('opiniones del blog', () => {
  const valid = {
    displayName: 'Vecina A',
    email: 'vecina@example.com',
    body: 'Me gustaría participar en la propuesta.',
    privacyAccepted: true as const,
    website: '',
  };

  it('acepta una opinión válida que quedará pendiente en la ruta', () => {
    expect(blogCommentSchema.safeParse(valid).success).toBe(true);
  });

  it('exige consentimiento y límites de longitud', () => {
    expect(blogCommentSchema.safeParse({ ...valid, privacyAccepted: false }).success).toBe(false);
    expect(blogCommentSchema.safeParse({ ...valid, body: 'x'.repeat(1501) }).success).toBe(false);
  });

  it('elimina HTML y evita XSS almacenado', () => {
    expect(sanitizePlainText('<script>alert(1)</script>Opinión <b>válida</b>')).toBe('alert(1)Opinión válida');
  });

  it('no expone correo ni datos antiabuso en la representación pública', () => {
    const result = toPublicComment({
      id: 'c1', displayName: 'Alias', body: 'Texto', isInstitutional: false, createdAt: new Date(0), replies: [],
    });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('ipHash');
  });
});
