import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { verifySignature, processOrderNotification } from '@/lib/mercadopago/webhook';
import type { MercadoPagoWebhookPayload } from '@/lib/mercadopago/webhook';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const xRequestId = request.headers.get('x-request-id') || '';
    const signatureHeader = request.headers.get('x-signature') || '';
    const body = await request.json();
    const payload = body as MercadoPagoWebhookPayload;
    const resourceId = payload.data?.id;
    const topic = payload.type || payload.action || 'unknown';

    if (!resourceId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const signatureValid = signatureHeader
      ? verifySignature(payload.id || resourceId, signatureHeader)
      : false;

    const signatureError = signatureHeader && !signatureValid ? 'Firma inválida' : null;

    let duplicate = false;
    if (xRequestId) {
      const existing = await prisma.mercadoPagoWebhookEvent.findFirst({
        where: { xRequestId },
      });
      duplicate = !!existing;
    }

    await prisma.mercadoPagoWebhookEvent.create({
      data: {
        orderId: resourceId,
        topic,
        resource: resourceId,
        action: payload.action,
        xRequestId: xRequestId || undefined,
        signatureValid,
        signatureError,
        duplicate,
        rawPayload: JSON.parse(JSON.stringify(payload)),
      },
    });

    if (!duplicate && (topic.startsWith('order') || topic.startsWith('payment'))) {
      try {
        await processOrderNotification(resourceId);
        await prisma.mercadoPagoWebhookEvent.updateMany({
          where: { resource: resourceId, duplicate: false, processed: false },
          data: { processed: true, processResult: 'OK' },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await prisma.mercadoPagoWebhookEvent.updateMany({
          where: { resource: resourceId, duplicate: false, processed: false },
          data: { processError: message },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('webhook error:', message);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('hub.challenge')) {
    const challenge = request.nextUrl.searchParams.get('hub.challenge');
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Método no soportado' }, { status: 405 });
}
