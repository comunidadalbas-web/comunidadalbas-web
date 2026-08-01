import { z } from 'zod';

export const RECORD_STATUS = ['ACTIVE', 'ARCHIVED'] as const;

export const buildingSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(20),
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  status: z.enum(RECORD_STATUS).default('ACTIVE'),
});

export const unitSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(20),
  apartmentNumber: z.string().min(1, 'El número de departamento es obligatorio').max(20),
  buildingId: z.string().min(1, 'Selecciona un edificio'),
  status: z.enum(RECORD_STATUS).default('ACTIVE'),
});

export const feeConceptSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(120),
  amount: z.coerce.number().min(0, 'El monto no puede ser negativo').max(1_000_000),
  authoritySource: z.string().min(1, 'La fuente de autoridad es obligatoria').max(200).default('Asamblea general'),
  status: z.enum(RECORD_STATUS).default('ACTIVE'),
});

export type BuildingInput = z.infer<typeof buildingSchema>;
export type UnitInput = z.infer<typeof unitSchema>;
export type FeeConceptInput = z.infer<typeof feeConceptSchema>;
