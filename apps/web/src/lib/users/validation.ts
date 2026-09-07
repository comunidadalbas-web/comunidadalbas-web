import { z } from 'zod';
import { isAllowedAdminEmail } from './institutional-accounts';

export const USER_ROLES = [
  'owner',
  'gestor',
  'contador',
  'arrendatario',
] as const;

export const createUserSchema = z.object({
  email: z
    .string()
    .email('Correo inválido')
    .max(254)
    .refine(isAllowedAdminEmail, 'Solo se permiten las cuentas institucionales autorizadas'),
  displayName: z.string().min(1, 'El nombre es obligatorio').max(120),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres').max(200),
  roles: z.array(z.enum(USER_ROLES)).min(1, 'Debe tener al menos un rol').max(10),
});

export const updateUserSchema = z
  .object({
    displayName: z.string().min(1, 'El nombre es obligatorio').max(120).optional(),
    active: z.boolean().optional(),
    roles: z.array(z.enum(USER_ROLES)).min(1).max(10).optional(),
    password: z
      .string()
      .min(12, 'La contraseña debe tener al menos 12 caracteres')
      .max(200)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No hay campos para actualizar',
  });
