import { createClient } from '@supabase/supabase-js';
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
    url: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_DOCUMENTS_BUCKET,
  };
  if (Object.values(values).some((value) => !value)) return null;
  return values as Record<keyof typeof values, string>;
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
          'Supabase Storage aún no está configurado. Puedes registrar mientras tanto una URL HTTPS externa.',
      },
      { status: 503 },
    );

  const body = await request.json().catch(() => ({}));
  const storage = createClient(settings.url, settings.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).storage.from(settings.bucket);

  if (body.action === 'authorize') {
    const parsed = authorizeSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Archivo inválido' },
        { status: 400 },
      );

    const now = new Date();
    const key = `public/documents/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}-${safeFilename(parsed.data.filename)}`;
    const { data, error } = await storage.createSignedUploadUrl(key, { upsert: false });
    if (error)
      return NextResponse.json(
        { error: `No se pudo autorizar la carga: ${error.message}` },
        { status: 502 },
      );

    const completionToken = makeCompletionToken(settings.serviceRoleKey, {
      key,
      size: parsed.data.size,
      userId: guard.session.userId,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    });
    return NextResponse.json({
      supabaseUrl: settings.url,
      publishableKey: settings.publishableKey,
      bucket: settings.bucket,
      key,
      uploadToken: data.token,
      completionToken,
    });
  }

  if (body.action === 'complete') {
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Confirmación inválida' },
        { status: 400 },
      );

    const signed = verifyCompletionToken(settings.serviceRoleKey, parsed.data.completionToken);
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

    const cleanup = () => storage.remove([parsed.data.key]).catch(() => undefined);
    const { data: storedFile, error: downloadError } = await storage.download(parsed.data.key);
    if (downloadError || !storedFile) {
      await cleanup();
      return NextResponse.json(
        { error: 'No se pudo verificar el archivo almacenado.' },
        { status: 400 },
      );
    }
    const bytes = Buffer.from(await storedFile.arrayBuffer());
    if (bytes.length !== parsed.data.size || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      await cleanup();
      return NextResponse.json(
        { error: 'El archivo almacenado no coincide con un PDF válido.' },
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

    const { data: publicLocation } = storage.getPublicUrl(parsed.data.key);
    await writeAuditLog({
      userId: guard.session.userId,
      action: 'DOCUMENT_FILE_UPLOAD',
      entityType: 'DocumentFile',
      entityId: parsed.data.key,
      after: { storageProvider: 'SUPABASE', size: parsed.data.size, sha256: verifiedHash },
    });
    return NextResponse.json({
      url: publicLocation.publicUrl,
      key: parsed.data.key,
      size: parsed.data.size,
      sha256: verifiedHash,
      storageProvider: 'SUPABASE',
    });
  }

  return NextResponse.json({ error: 'Acción de carga no reconocida.' }, { status: 400 });
}
