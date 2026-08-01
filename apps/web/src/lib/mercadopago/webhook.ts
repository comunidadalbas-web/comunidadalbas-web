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
  const varName =
    env === 'production' ? 'MERCADOPAGO_WEBHOOK_SECRET_PROD' : 'MERCADOPAGO_WEBHOOK_SECRET_TEST';
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

const PAID_PROVIDER_STATUSES = new Set(['approved', 'paid']);

async function reconcileConfirmedOrder(orderId: string): Promise<string> {
  const order = await prisma.mercadoPagoOrder.findUnique({ where: { orderId } });
  if (!order || !PAID_PROVIDER_STATUSES.has(order.status) || order.excludeFromCommunityBalance) {
    return 'ORDER_UPDATED_NOT_PAID';
  }
  const movementId = order.paymentId || order.orderId;
  if (await prisma.payment.findUnique({ where: { providerMovementId: movementId } })) {
    return 'PAYMENT_ALREADY_RECONCILED';
  }
  if (!order.building || !order.apartment) return 'PAID_ORDER_REQUIRES_UNIT_REVIEW';
  const units = await prisma.unit.findMany({
    where: {
      apartmentNumber: { equals: order.apartment, mode: 'insensitive' },
      building: {
        OR: [
          { code: { equals: order.building, mode: 'insensitive' } },
          { name: { equals: order.building, mode: 'insensitive' } },
        ],
      },
    },
  });
  if (units.length !== 1) return 'PAID_ORDER_REQUIRES_UNIT_REVIEW';
  const unit = units[0];
  const concepts = order.feeConceptId
    ? await prisma.feeConcept.findMany({ where: { id: order.feeConceptId } })
    : order.feeConceptName
      ? await prisma.feeConcept.findMany({
          where: { name: { equals: order.feeConceptName, mode: 'insensitive' } },
        })
      : [];
  const candidateCharges =
    concepts.length === 1
      ? await prisma.charge.findMany({
          where: { unitId: unit.id, feeConceptId: concepts[0].id },
          include: { payments: { select: { amount: true } } },
          orderBy: [{ dueDate: 'asc' }, { period: 'asc' }],
        })
      : [];
  const compatible = candidateCharges.filter((charge) => {
    const applied = charge.payments.reduce((sum, item) => sum + Number(item.amount), 0);
    return Number(order.amount) <= Number(charge.amount) - applied + 0.001;
  });
  if (compatible.length !== 1) {
    await prisma.payment.create({
      data: {
        unitId: unit.id,
        paidAt: new Date(),
        amount: order.amount,
        reference: order.reference || order.externalReference,
        providerMovementId: movementId,
        status: 'CONFIRMED',
      },
    });
    return 'PAYMENT_CONFIRMED_REQUIRES_CHARGE_REVIEW';
  }
  const paymentId = crypto.randomUUID();
  await prisma.$transaction([
    prisma.payment.create({
      data: {
        id: paymentId,
        unitId: unit.id,
        paidAt: new Date(),
        amount: order.amount,
        reference: order.reference || order.externalReference,
        providerMovementId: movementId,
        status: 'APPLIED',
      },
    }),
    prisma.paymentApplication.create({
      data: { paymentId, chargeId: compatible[0].id, amount: order.amount },
    }),
  ]);
  return 'PAYMENT_APPLIED_TO_UNIQUE_CHARGE';
}

export async function processOrderNotification(
  resourceId: string,
  topic = 'unknown',
): Promise<string> {
  try {
    const { getOrderById, getPaymentStatusById } = await import('./orders');

    if (topic.startsWith('payment')) {
      const payment = await getPaymentStatusById(resourceId);
      if (!payment.success || !payment.externalReference)
        return 'PAYMENT_PROVIDER_LOOKUP_INCOMPLETE';

      const order = await prisma.mercadoPagoOrder.findFirst({
        where: { externalReference: payment.externalReference },
      });
      if (!order) return 'LOCAL_ORDER_NOT_FOUND';

      const updated = await prisma.mercadoPagoOrder.update({
        where: { id: order.id },
        data: {
          status: payment.status ?? order.status,
          statusDetail: payment.statusDetail ?? order.statusDetail,
          paymentId: payment.paymentId ?? order.paymentId,
        },
      });
      return reconcileConfirmedOrder(updated.orderId);
    }

    const result = await getOrderById(resourceId);
    if (!result.success || !result.orderId) return 'ORDER_PROVIDER_LOOKUP_INCOMPLETE';

    const existing = await prisma.mercadoPagoOrder.findUnique({
      where: { orderId: result.orderId },
    });
    if (!existing) return 'LOCAL_ORDER_NOT_FOUND';

    const updated = await prisma.mercadoPagoOrder.update({
      where: { orderId: result.orderId },
      data: {
        status: result.status ?? existing.status,
        statusDetail: result.statusDetail ?? existing.statusDetail,
        paymentId: result.paymentId ?? existing.paymentId,
        reference: result.reference ?? existing.reference,
        ticketUrl: result.ticketUrl ?? existing.ticketUrl,
      },
    });
    return reconcileConfirmedOrder(updated.orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('processOrderNotification error:', message);
    throw err;
  }
}

export async function registerWebhook(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const env = process.env.MERCADOPAGO_ENV || 'test';
    const varName =
      env === 'production' ? 'MERCADOPAGO_ACCESS_TOKEN_PROD' : 'MERCADOPAGO_ACCESS_TOKEN_TEST';
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
