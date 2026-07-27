import { describe, it, expect } from 'vitest';

const contactSchema = (await import('zod')).z.object({
  name: (await import('zod')).z.string().min(1).max(200),
  email: (await import('zod')).z.string().email().max(254),
  phone: (await import('zod')).z.string().max(20).optional().default(''),
  category: (await import('zod')).z.enum(['general', 'administration', 'maintenance', 'security', 'suggestion', 'other']),
  message: (await import('zod')).z.string().min(1).max(2000),
  privacyAccepted: (await import('zod')).z.literal(true),
});

describe('Contact form validation', () => {
  it('should accept valid data', () => {
    const result = contactSchema.safeParse({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '5512345678',
      building: 'B01',
      apartment: 'D01',
      category: 'general',
      message: 'Test message',
      privacyAccepted: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const result = contactSchema.safeParse({
      name: '',
      email: 'juan@example.com',
      category: 'general',
      message: 'Test',
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = contactSchema.safeParse({
      name: 'Juan',
      email: 'not-an-email',
      category: 'general',
      message: 'Test',
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing privacy acceptance', () => {
    const result = contactSchema.safeParse({
      name: 'Juan',
      email: 'juan@example.com',
      category: 'general',
      message: 'Test',
      privacyAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it('should reject message exceeding 2000 characters', () => {
    const result = contactSchema.safeParse({
      name: 'Juan',
      email: 'juan@example.com',
      category: 'general',
      message: 'x'.repeat(2001),
      privacyAccepted: true,
    });
    expect(result.success).toBe(false);
  });

  it('should accept data without optional fields', () => {
    const result = contactSchema.safeParse({
      name: 'Juan',
      email: 'juan@example.com',
      category: 'maintenance',
      message: 'Test message',
      privacyAccepted: true,
    });
    expect(result.success).toBe(true);
  });
});
