import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  body: z.string().min(1, 'El contenido es obligatorio').max(10000),
  category: z.string().min(1, 'La categoría es obligatoria').max(50),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export const campaignSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().min(1, 'La descripción es obligatoria').max(10000),
  goalAmount: z.coerce.number().positive('El objetivo debe ser mayor a cero').max(999999999).optional(),
  collectedAmount: z.coerce.number().min(0).max(999999999).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export const calendarEventSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startsAt: z.string().datetime('Fecha de inicio inválida'),
  endsAt: z.string().datetime().nullable().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']),
});

const slugSchema = z
  .string()
  .min(1, 'El slug es obligatorio')
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones');

export const blogPostSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  slug: slugSchema.optional(),
  summary: z.string().max(500).optional(),
  content: z.string().min(1, 'El contenido es obligatorio').max(50000),
  coverImageUrl: z.string().url('URL de imagen inválida').max(500).optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
