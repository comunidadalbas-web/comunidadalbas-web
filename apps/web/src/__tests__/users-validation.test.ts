import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema, USER_ROLES } from '@/lib/users/validation';

describe('users/validation - create', () => {
  const valid = {
    email: 'juan@comunidadalbas.com.mx',
    displayName: 'Juan Pérez',
    password: 'clave-muy-segura-123',
    roles: ['resident'],
  };

  it('accepts valid data', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const res = createUserSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(res.success).toBe(false);
  });

  it('rejects short password', () => {
    const res = createUserSchema.safeParse({ ...valid, password: 'corta' });
    expect(res.success).toBe(false);
  });

  it('rejects empty display name', () => {
    const res = createUserSchema.safeParse({ ...valid, displayName: '' });
    expect(res.success).toBe(false);
  });

  it('rejects empty roles', () => {
    const res = createUserSchema.safeParse({ ...valid, roles: [] });
    expect(res.success).toBe(false);
  });

  it('rejects unknown role', () => {
    const res = createUserSchema.safeParse({ ...valid, roles: ['presidente'] });
    expect(res.success).toBe(false);
  });

  it('exposes the six roles', () => {
    expect(USER_ROLES).toEqual(['admin', 'director', 'tesorero', 'secretario', 'vocal', 'resident']);
  });
});

describe('users/validation - update', () => {
  it('accepts partial update with roles', () => {
    expect(updateUserSchema.safeParse({ roles: ['admin'] }).success).toBe(true);
  });

  it('accepts deactivation', () => {
    expect(updateUserSchema.safeParse({ active: false }).success).toBe(true);
  });

  it('accepts password reset', () => {
    expect(updateUserSchema.safeParse({ password: 'nueva-clave-123456' }).success).toBe(true);
  });

  it('rejects empty object', () => {
    const res = updateUserSchema.safeParse({});
    expect(res.success).toBe(false);
  });

  it('rejects empty roles array in update', () => {
    const res = updateUserSchema.safeParse({ roles: [] });
    expect(res.success).toBe(false);
  });

  it('rejects short password in update', () => {
    const res = updateUserSchema.safeParse({ password: 'x' });
    expect(res.success).toBe(false);
  });
});
