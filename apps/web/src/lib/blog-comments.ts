import { z } from 'zod';

export const blogCommentSchema = z.object({
  displayName: z.string().trim().min(1, 'Escribe tu nombre o alias').max(80),
  email: z.string().trim().email('Correo inválido').max(254),
  body: z.string().trim().min(3, 'La opinión es demasiado breve').max(1500),
  parentId: z.string().trim().min(1).max(64).nullable().optional(),
  privacyAccepted: z.literal(true, { error: 'Debes aceptar el Aviso de Privacidad' }),
  website: z.string().max(0).optional(),
});

export function sanitizePlainText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\u0000/g, '').trim();
}

export interface PublicBlogComment {
  id: string;
  displayName: string;
  body: string;
  isInstitutional: boolean;
  createdAt: string;
  replies: PublicBlogComment[];
}

export function toPublicComment(comment: {
  id: string;
  displayName: string;
  body: string;
  isInstitutional: boolean;
  createdAt: Date;
  replies?: Array<{
    id: string;
    displayName: string;
    body: string;
    isInstitutional: boolean;
    createdAt: Date;
  }>;
}): PublicBlogComment {
  return {
    id: comment.id,
    displayName: comment.displayName,
    body: comment.body,
    isInstitutional: comment.isInstitutional,
    createdAt: comment.createdAt.toISOString(),
    replies: (comment.replies ?? []).map((reply) => ({
      id: reply.id,
      displayName: reply.displayName,
      body: reply.body,
      isInstitutional: reply.isInstitutional,
      createdAt: reply.createdAt.toISOString(),
      replies: [],
    })),
  };
}
