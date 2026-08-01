import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { verifySignature, processOrderNotification } from '@/lib/mercadopago/webhook';
import type { MercadoPagoWebhookPayload } from '@/lib/mercadopago/webhook';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let createdEventId: string | null = null;
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
      ? verifySignature(resourceId, xRequestId, signatureHeader)
      : false;

    const signatureError = !signatureHeader ? 'Firma ausente' : !signatureValid ? 'Firma inválida' : null;

    let duplicate = false;
    if (xRequestId) {
      const existing = await prisma.mercadoPagoWebhookEvent.findFirst({
        where: { xRequestId },
      });
      duplicate = !!existing;
    }

    let orderIdForEvent: string | null = null;
    if (topic.startsWith('order')) {
      const order = await prisma.mercadoPagoOrder.findUnique({
        where: { orderId: resourceId },
        select: { orderId: true },
      });
      orderIdForEvent = order?.orderId ?? null;
    } else if (topic.startsWith('payment')) {
      const order = await prisma.mercadoPagoOrder.findFirst({
        where: { OR: [{ paymentId: resourceId }, { orderId: `PREF-${resourceId}` }] },
        select: { orderId: true },
      });
      orderIdForEvent = order?.orderId ?? null;
    }

    const event = await prisma.mercadoPagoWebhookEvent.create({
      data: {
        orderId: orderIdForEvent,
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
    createdEventId = event.id;

    if (!signatureValid) {
      return NextResponse.json({ received: false, error: 'Firma no válida' }, { status: 401 });
    }

    if (!duplicate && (topic.startsWith('order') || topic.startsWith('payment'))) {
      try {
        await processOrderNotification(resourceId, topic);
        await prisma.mercadoPagoWebhookEvent.update({
          where: { id: event.id },
          data: { processed: true, processResult: 'OK' },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('webhook process failed:', message);
        await prisma.mercadoPagoWebhookEvent.update({
          where: { id: event.id },
          data: { processError: message },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('webhook error:', message);
    if (createdEventId) {
      await prisma.mercadoPagoWebhookEvent.update({
        where: { id: createdEventId },
        data: { processError: `outer: ${message}` },
      }).catch(() => {});
    }
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
