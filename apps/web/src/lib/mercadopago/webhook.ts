import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@comunidad-albas/db';

export interface MercadoPagoWebhookPayload {
  id: string;
  action: string;
  type: string;
  data: { id: string };
  live_mode: boolean;
  date_created: string;
  api_version: string;
}

function getWebhookSecret(): string {
  const env = process.env.MERCADOPAGO_ENV || 'test';
  const varName = env === 'production' ? 'MERCADOPAGO_WEBHOOK_SECRET_PROD' : 'MERCADOPAGO_WEBHOOK_SECRET_TEST';
  const secret = process.env[varName];
  if (secret) return secret;
  const legacy = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (legacy) return legacy;
  throw new Error(`${varName} no configurado`);
}

function parseSignatureHeader(header: string): { ts: string; v1: string } | null {
  const parts: Record<string, string> = {};
  for (const pair of header.split(',')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    parts[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

export function verifySignature(
  dataId: string,
  xRequestId: string,
  signatureHeader: string,
): boolean {
  try {
    const parsed = parseSignatureHeader(signatureHeader);
    if (!parsed) return false;
    const { ts, v1 } = parsed;
    const secret = getWebhookSecret();

    const normalizedDataId = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;

    let manifest = '';
    if (normalizedDataId) manifest += `id:${normalizedDataId};`;
    if (xRequestId) manifest += `request-id:${xRequestId};`;
    manifest += `ts:${ts};`;

    const computed = createHmac('sha256', secret).update(manifest).digest('hex');
    if (computed.length !== v1.length) return false;
    return timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function processOrderNotification(resourceId: string, topic = 'unknown'): Promise<void> {
  try {
    const { getOrderById, getPaymentStatusById } = await import('./orders');

    if (topic.startsWith('payment')) {
      const payment = await getPaymentStatusById(resourceId);
      if (!payment.success || !payment.externalReference) return;

      const order = await prisma.mercadoPagoOrder.findFirst({
        where: { externalReference: payment.externalReference },
      });
      if (!order) return;

      await prisma.mercadoPagoOrder.update({
        where: { id: order.id },
        data: {
          status: payment.status ?? order.status,
          statusDetail: payment.statusDetail ?? order.statusDetail,
          paymentId: payment.paymentId ?? order.paymentId,
        },
      });
      return;
    }

    const result = await getOrderById(resourceId);
    if (!result.success || !result.orderId) return;

    const existing = await prisma.mercadoPagoOrder.findUnique({
      where: { orderId: result.orderId },
    });
    if (!existing) return;

    await prisma.mercadoPagoOrder.update({
      where: { orderId: result.orderId },
      data: {
        status: result.status ?? existing.status,
        statusDetail: result.statusDetail ?? existing.statusDetail,
        paymentId: result.paymentId ?? existing.paymentId,
        reference: result.reference ?? existing.reference,
        ticketUrl: result.ticketUrl ?? existing.ticketUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('processOrderNotification error:', message);
    throw err;
  }
}

export async function registerWebhook(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const env = process.env.MERCADOPAGO_ENV || 'test';
    const varName = env === 'production' ? 'MERCADOPAGO_ACCESS_TOKEN_PROD' : 'MERCADOPAGO_ACCESS_TOKEN_TEST';
    const token = process.env[varName];
    if (!token) return { success: false, error: 'Token no configurado' };

    const res = await fetch('https://api.mercadopago.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url,
        event_types: ['order.created', 'order.updated', 'payment.created', 'payment.updated'],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Error ${res.status}: ${body}` };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
