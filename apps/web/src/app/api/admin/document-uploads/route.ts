import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';
import { DOCUMENT_MAX_BYTES } from '@/lib/documents';

export const dynamic = 'force-dynamic';

const authorizeSchema = z.object({
  action: z.literal('authorize'),
  filename: z.string().trim().min(1).max(180),
  size: z.number().int().positive().max(DOCUMENT_MAX_BYTES),
  contentType: z.literal('application/pdf'),
});

const completeSchema = z.object({
  action: z.literal('complete'),
  key: z.string().min(1).max(1024),
  size: z.number().int().positive().max(DOCUMENT_MAX_BYTES),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  completionToken: z.string().min(20),
});

function config() {
  const values = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  };
  if (Object.values(values).some((value) => !value)) return null;
  return values as Record<keyof typeof values, string>;
}

function client(settings: NonNullable<ReturnType<typeof config>>) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${settings.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
}

function safeFilename(filename: string) {
  const base =
    filename
      .replace(/\.pdf$/i, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'documento';
  return `${base}.pdf`;
}

function publicUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function signCompletion(secret: string, payload: string) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function makeCompletionToken(
  secret: string,
  values: { key: string; size: number; userId: string; expiresAt: number },
) {
  const payload = Buffer.from(JSON.stringify(values)).toString('base64url');
  return `${payload}.${signCompletion(secret, payload)}`;
}

function verifyCompletionToken(secret: string, token: string) {
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature) return null;
  const expectedSignature = signCompletion(secret, payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      key: string;
      size: number;
      userId: string;
      expiresAt: number;
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, {
    roles: ['admin', 'director', 'secretario'],
    csrf: true,
  });
  if (guard instanceof NextResponse) return guard;

  const settings = config();
  if (!settings)
    return NextResponse.json(
      {
        error:
          'Cloudflare R2 aún no está configurado. Puedes registrar mientras tanto una URL HTTPS externa.',
      },
      { status: 503 },
    );

  const body = await request.json().catch(() => ({}));
  const storage = client(settings);

  if (body.action === 'authorize') {
    const parsed = authorizeSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Archivo inválido' },
        { status: 400 },
      );

    const now = new Date();
    const key = `public/documents/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}-${safeFilename(parsed.data.filename)}`;
    const command = new PutObjectCommand({
      Bucket: settings.bucket,
      Key: key,
      ContentType: 'application/pdf',
      ContentLength: parsed.data.size,
      CacheControl: 'public, max-age=3600',
    });
    const uploadUrl = await getSignedUrl(storage, command, { expiresIn: 10 * 60 });
    const completionToken = makeCompletionToken(settings.secretAccessKey, {
      key,
      size: parsed.data.size,
      userId: guard.session.userId,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    return NextResponse.json({ uploadUrl, key, completionToken });
  }

  if (body.action === 'complete') {
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Confirmación inválida' },
        { status: 400 },
      );

    const signed = verifyCompletionToken(settings.secretAccessKey, parsed.data.completionToken);
    if (
      !signed ||
      signed.expiresAt < Date.now() ||
      signed.userId !== guard.session.userId ||
      signed.key !== parsed.data.key ||
      signed.size !== parsed.data.size
    )
      return NextResponse.json(
        { error: 'La autorización de carga expiró o no corresponde al archivo.' },
        { status: 403 },
      );

    const cleanup = () =>
      storage
        .send(new DeleteObjectCommand({ Bucket: settings.bucket, Key: parsed.data.key }))
        .catch(() => undefined);
    const head = await storage.send(
      new HeadObjectCommand({ Bucket: settings.bucket, Key: parsed.data.key }),
    );
    if (head.ContentLength !== parsed.data.size || head.ContentType !== 'application/pdf') {
      await cleanup();
      return NextResponse.json(
        { error: 'El archivo almacenado no coincide con la carga autorizada.' },
        { status: 400 },
      );
    }
    const storedObject = await storage.send(
      new GetObjectCommand({ Bucket: settings.bucket, Key: parsed.data.key }),
    );
    const bytes = storedObject.Body
      ? Buffer.from(await storedObject.Body.transformToByteArray())
      : Buffer.alloc(0);
    const signature = bytes.subarray(0, 5).toString('ascii');
    if (signature !== '%PDF-') {
      await cleanup();
      return NextResponse.json(
        { error: 'El contenido cargado no es un PDF válido.' },
        { status: 400 },
      );
    }
    const verifiedHash = createHash('sha256').update(bytes).digest('hex');
    if (verifiedHash !== parsed.data.sha256.toLowerCase()) {
      await cleanup();
      return NextResponse.json(
        { error: 'La huella SHA-256 no coincide con el archivo almacenado.' },
        { status: 400 },
      );
    }

    await writeAuditLog({
      userId: guard.session.userId,
      action: 'DOCUMENT_FILE_UPLOAD',
      entityType: 'DocumentFile',
      entityId: parsed.data.key,
      after: { storageProvider: 'R2', size: parsed.data.size, sha256: parsed.data.sha256 },
    });
    return NextResponse.json({
      url: publicUrl(settings.publicBaseUrl, parsed.data.key),
      key: parsed.data.key,
      size: parsed.data.size,
      sha256: parsed.data.sha256.toLowerCase(),
      storageProvider: 'R2',
    });
  }

  return NextResponse.json({ error: 'Acción de carga no reconocida.' }, { status: 400 });
}
