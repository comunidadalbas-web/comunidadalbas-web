import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200, 'Nombre demasiado largo'),
  email: z.string().email('Correo inválido').max(254),
  phone: z.string().max(20).optional().default(''),
  building: z.string().max(50).optional().default(''),
  apartment: z.string().max(50).optional().default(''),
  category: z.enum(['general', 'administration', 'maintenance', 'security', 'suggestion', 'other']),
  message: z.string().min(1, 'El mensaje es obligatorio').max(2000, 'El mensaje no puede exceder 2000 caracteres'),
  privacyAccepted: z.literal(true, { message: 'Debes aceptar el aviso de privacidad' }),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    if (body.website) {
      return NextResponse.json({ success: true });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || 'Datos inválidos';
      return NextResponse.json({ error: firstError, fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    const sanitize = (s: string) => s.trim().replace(/<[^>]*>/g, '');
    const sanitized = {
      name: sanitize(data.name),
      email: data.email.trim().toLowerCase(),
      phone: data.phone ? sanitize(data.phone) : '',
      building: data.building ? sanitize(data.building) : '',
      apartment: data.apartment ? sanitize(data.apartment) : '',
      category: data.category,
      message: sanitize(data.message),
      privacyAccepted: true,
    };

    const { prisma } = await import('@/lib/db');
    const { assignFolio } = await import('@/lib/solicitudes/folio');

    let contactRequest = await prisma.contactRequest.create({ data: sanitized });
    const folio = await assignFolio(
      (year) =>
        prisma.contactRequest.findMany({
          where: { folio: { startsWith: `CA-${year}-` } },
          select: { id: true, folio: true },
          orderBy: { folio: 'desc' },
        }),
      (f) => prisma.contactRequest.update({ where: { id: contactRequest.id }, data: { folio: f } }).then(() => undefined),
    );
    contactRequest = await prisma.contactRequest.findUniqueOrThrow({ where: { id: contactRequest.id } });

    try {
      const { sendContactConfirmation, sendContactAdminNotification } = await import('@/lib/email/notifications');
      const adminTo = process.env.CONTACT_NOTIFICATION_EMAIL || 'contacto@comunidadalbas.com.mx';
      const [adminResult, citizenResult] = await Promise.all([
        sendContactAdminNotification({
          to: adminTo,
          name: sanitized.name,
          email: sanitized.email,
          phone: sanitized.phone || null,
          building: sanitized.building || null,
          apartment: sanitized.apartment || null,
          category: sanitized.category,
          message: sanitized.message,
          folio: contactRequest.folio,
        }),
        sendContactConfirmation({
          to: sanitized.email,
          name: sanitized.name,
          folio: contactRequest.folio ?? '',
          category: sanitized.category,
        }),
      ]);

      if (adminResult.success || citizenResult.success) {
        await prisma.contactRequest.update({
          where: { id: contactRequest.id },
          data: { notifiedAt: new Date() },
        });
      }
    } catch {
      // Notification failure is non-blocking
    }

    return NextResponse.json({ success: true, id: contactRequest.id, folio: contactRequest.folio }, { status: 201 });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
