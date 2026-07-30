import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createSpeiOrder } from '@/lib/mercadopago/orders';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 30_000;
const RATE_LIMIT_MAX = 3;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`test-spei:${ip}`)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en 30 segundos.' },
      { status: 429 },
    );
  }

  try {
    const result = await createSpeiOrder({
      externalReference: 'ALB-TEST-SPEI-001',
      totalAmount: '200.00',
      payerEmail: 'test_user_mx@testuser.com',
      payerName: 'Boris',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al crear la orden' },
        { status: 502 },
      );
    }

    if (result.ticketUrl) {
      try {
        const url = new URL(result.ticketUrl);
        if (url.protocol !== 'https:') {
          return NextResponse.json(
            { error: 'La URL del ticket no es HTTPS' },
            { status: 502 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'La URL del ticket no es válida' },
          { status: 502 },
        );
      }
    }

    await prisma.mercadoPagoOrder.create({
      data: {
        orderId: result.orderId!,
        externalReference: 'ALB-TEST-SPEI-001',
        status: result.status!,
        statusDetail: result.statusDetail,
        paymentId: result.paymentId,
        reference: result.reference,
        ticketUrl: result.ticketUrl,
        amount: 200.00,
        environment: 'test',
        idempotencyKey: '[internal]',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      status: result.status,
      statusDetail: result.statusDetail,
      hasTicketUrl: !!result.ticketUrl,
      hasReference: !!result.reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('test-spei-order error:', message);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
