import { z } from 'zod';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_STORAGE_PROVIDERS,
} from '@/lib/documents';

const optionalHttpsUrl = z
  .union([
    z.literal(''),
    z
      .string()
      .url('URL inválida')
      .refine((value) => value.startsWith('https://'), 'La URL debe usar HTTPS'),
  ])
  .optional();

export const EXPENSE_STATUSES = [
  'REQUESTED',
  'AUTHORIZED',
  'PAID',
  'VERIFIED',
  'RECONCILED',
  'REJECTED',
] as const;

export const expenseSchema = z.object({
  spentAt: z.union([z.literal(''), z.string().date('Fecha inválida')]).optional(),
  category: z.string().trim().min(2, 'La categoría es obligatoria').max(80),
  provider: z.string().trim().max(160).optional().default(''),
  description: z.string().trim().min(3, 'El concepto es obligatorio').max(500),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero').max(10_000_000),
  fund: z.string().trim().min(2, 'El fondo es obligatorio').max(120),
  status: z.enum(EXPENSE_STATUSES).default('REQUESTED'),
  evidenceUrl: optionalHttpsUrl,
});

export const expenseUpdateSchema = expenseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay campos para actualizar');

export const DOCUMENT_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'RESTRICTED'] as const;

export const documentSchema = z.object({
  title: z.string().trim().min(2, 'El título es obligatorio').max(180),
  description: z.string().trim().max(500).default(''),
  category: z.enum(DOCUMENT_CATEGORIES),
  version: z.string().trim().max(40).default('1.0'),
  documentDate: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe usar AAAA-MM-DD'),
      z.literal(''),
    ])
    .default(''),
  visibility: z.enum(DOCUMENT_VISIBILITIES).default('RESTRICTED'),
  fileUrl: z
    .string()
    .url('URL inválida')
    .refine((value) => value.startsWith('https://'), 'La URL debe usar HTTPS'),
  fileSizeBytes: z.number().int().positive().max(DOCUMENT_MAX_BYTES).nullable().default(null),
  storageProvider: z.enum(DOCUMENT_STORAGE_PROVIDERS).default('EXTERNAL'),
  storageKey: z.string().trim().max(1024).nullable().default(null),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i, 'SHA-256 debe tener 64 caracteres hexadecimales'),
  isPermanent: z.boolean().default(false),
  approved: z.boolean().default(false),
});

export const documentUpdateSchema = documentSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'No hay campos para actualizar');

export const chargeSchema = z.object({
  unitId: z.string().min(1, 'Selecciona un departamento'),
  feeConceptId: z.string().min(1, 'Selecciona un concepto'),
  period: z.string().trim().min(4, 'El periodo es obligatorio').max(30),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero').max(1_000_000),
  dueDate: z.union([z.literal(''), z.string().date('Fecha inválida')]).optional(),
});

export const PAYMENT_STATUSES = [
  'REPORTED',
  'CONFIRMED',
  'APPLIED',
  'CLARIFICATION',
  'REJECTED',
  'DUPLICATE',
] as const;

export const manualPaymentSchema = z.object({
  unitId: z.string().min(1, 'Selecciona un departamento'),
  paidAt: z.union([z.literal(''), z.string().date('Fecha inválida')]).optional(),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero').max(1_000_000),
  reference: z.string().trim().max(120).optional().default(''),
  trackingKey: z.string().trim().max(120).optional().default(''),
});

export const paymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
  chargeId: z.string().min(1).optional(),
});
