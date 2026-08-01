import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type UploadKind = 'image' | 'document';

function parseKind(clientPayload: string | null): UploadKind | null {
  try {
    const value = JSON.parse(clientPayload ?? '{}') as { kind?: unknown };
    return value.kind === 'image' || value.kind === 'document' ? value.kind : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: 'Solicitud de carga inválida' }, { status: 400 });

  let sessionUserId: string | null = null;
  if (body.type === 'blob.generate-client-token') {
    const guard = await guardAdminRequest(request, {
      roles: ['admin', 'director', 'secretario', 'tesorero'],
      csrf: true,
    });
    if (guard instanceof NextResponse) return guard;
    sessionUserId = guard.session.userId;
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = parseKind(clientPayload);
        const expectedPrefix = kind === 'image' ? 'media/images/' : 'media/documents/';
        if (!kind || !pathname.startsWith(expectedPrefix) || pathname.includes('..')) {
          throw new Error('Ruta de carga no permitida');
        }
        return {
          allowedContentTypes:
            kind === 'image' ? ['image/jpeg', 'image/png', 'image/webp'] : ['application/pdf'],
          maximumSizeInBytes: kind === 'image' ? 8 * 1024 * 1024 : 25 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30,
          tokenPayload: JSON.stringify({ kind, userId: sessionUserId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload ?? '{}') as { kind?: string; userId?: string };
          await writeAuditLog({
            userId: payload.userId ?? null,
            action: 'MEDIA_UPLOAD',
            entityType: payload.kind === 'document' ? 'DocumentFile' : 'ImageFile',
            entityId: blob.pathname,
            after: { pathname: blob.pathname, contentType: blob.contentType },
          });
        } catch {
          // The upload remains valid even if its auxiliary audit callback cannot be recorded.
        }
      },
    });
    return NextResponse.json(result);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : 'No se pudo autorizar la carga';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
