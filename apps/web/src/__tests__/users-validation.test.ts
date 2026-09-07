import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema, USER_ROLES } from '@/lib/users/validation';
import {
  INSTITUTIONAL_ACCOUNTS,
  INSTITUTIONAL_ALIASES,
  MAX_ADMIN_USERS,
} from '@/lib/users/institutional-accounts';

describe('users/validation - create', () => {
  const valid = {
    email: 'gestion@comunidadalbas.com.mx',
    displayName: 'Gestor Patrimonial',
    password: 'clave-muy-segura-123',
    roles: ['gestor'],
  };

  it('accepts valid data', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const res = createUserSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(res.success).toBe(false);
  });

  it('rejects a valid but unauthorized institutional-domain email', () => {
    const res = createUserSchema.safeParse({ ...valid, email: 'persona@comunidadalbas.com.mx' });
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

  it('exposes the four roles', () => {
    expect(USER_ROLES).toEqual([
      'owner',
      'gestor',
      'contador',
      'arrendatario',
    ]);
  });

  it('defines exactly five panel accounts and no non-user aliases', () => {
    expect(INSTITUTIONAL_ACCOUNTS).toHaveLength(MAX_ADMIN_USERS);
    expect(INSTITUTIONAL_ALIASES).toHaveLength(0);
  });
});

describe('users/validation - update', () => {
  it('accepts partial update with roles', () => {
    expect(updateUserSchema.safeParse({ roles: ['gestor'] }).success).toBe(true);
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
