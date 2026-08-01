import { randomUUID } from 'crypto';
import type {
  MercadoPagoCreateOrderParams,
  MercadoPagoOrderResponse,
  CreateSpeiOrderResult,
  MercadoPagoPreference,
  CreateCheckoutPreferenceParams,
  CreateCheckoutPreferenceResult,
  MercadoPagoPaymentStatusResponse,
  GetPaymentStatusResult,
} from './types';

const BASE_URL = 'https://api.mercadopago.com/v1';

function getAccessToken(): string {
  const env = process.env.MERCADOPAGO_ENV || 'test';
  const varName = env === 'production' ? 'MERCADOPAGO_ACCESS_TOKEN_PROD' : 'MERCADOPAGO_ACCESS_TOKEN_TEST';
  const token = process.env[varName];
  if (!token) throw new Error(`${varName} no configurado`);
  return token;
}

function sanitizeForLog(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLog);
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (/secret|token|auth|password|key/i.test(key)) sanitized[key] = '[REDACTED]';
    else if (typeof val === 'object' && val !== null) sanitized[key] = sanitizeForLog(val);
    else sanitized[key] = val;
  }
  return sanitized;
}

async function mpFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };
  if (options.idempotencyKey) headers['X-Idempotency-Key'] = options.idempotencyKey;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text();
      console.error('MP API error', sanitizeForLog({ status: res.status, body }));
      throw new Error(`Mercado Pago API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createSpeiOrder(
  params: MercadoPagoCreateOrderParams,
): Promise<CreateSpeiOrderResult> {
  const idempotencyKey = randomUUID();
  try {
    const body = {
      type: 'online',
      external_reference: params.externalReference,
      processing_mode: 'automatic',
      marketplace: 'NONE',
      total_amount: params.totalAmount,
      payer: {
        first_name: params.payerName,
        email: params.payerEmail,
      },
      transactions: {
        payments: [{ amount: params.totalAmount, payment_method: { id: 'clabe', type: 'bank_transfer' } }],
      },
    };
    const order = await mpFetch<MercadoPagoOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
      idempotencyKey,
    });
    const payment = order.transactions?.payments?.[0];
    const paymentMethod = payment?.payment_method;
    return {
      success: true,
      orderId: order.id,
      status: order.status,
      statusDetail: order.status_detail,
      paymentId: payment?.id?.toString(),
      reference: paymentMethod?.reference,
      ticketUrl: paymentMethod?.ticket_url,
      expiresAt: order.date_expiration,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('createSpeiOrder failed', sanitizeForLog({ error: message }));
    return { success: false, error: message };
  }
}

export async function getOrderById(orderId: string): Promise<CreateSpeiOrderResult> {
  try {
    const order = await mpFetch<MercadoPagoOrderResponse>(`/orders/${orderId}`);
    const payment = order.transactions?.payments?.[0];
    const paymentMethod = payment?.payment_method;
    return {
      success: true,
      orderId: order.id,
      status: order.status,
      statusDetail: order.status_detail,
      paymentId: payment?.id?.toString(),
      reference: paymentMethod?.reference,
      ticketUrl: paymentMethod?.ticket_url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, error: message };
  }
}

export async function createCheckoutPreference(
  params: CreateCheckoutPreferenceParams,
): Promise<CreateCheckoutPreferenceResult> {
  const idempotencyKey = randomUUID();
  try {
    const body = {
      items: [
        {
          title: params.itemTitle,
          quantity: 1,
          unit_price: parseFloat(params.totalAmount),
          currency_id: 'MXN',
        },
      ],
      payer: {
        first_name: params.payerName,
        email: params.payerEmail,
      },
      external_reference: params.externalReference,
      back_urls: {
        success: params.backUrlSuccess,
        failure: params.backUrlFailure,
        pending: params.backUrlPending,
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [
          { id: 'atm' },
          { id: 'ticket' },
        ],
      },
      notification_url: 'https://comunidadalbas.com.mx/api/integrations/mercadopago/webhook',
    };
    const preference = await mpFetch<MercadoPagoPreference>('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify(body),
      idempotencyKey,
    });
    return {
      success: true,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      externalReference: preference.external_reference,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('createCheckoutPreference failed', sanitizeForLog({ error: message }));
    return { success: false, error: message };
  }
}

export async function getPaymentStatusById(paymentId: string): Promise<GetPaymentStatusResult> {
  try {
    const payment = await mpFetch<MercadoPagoPaymentStatusResponse>(`/payments/${paymentId}`);
    return {
      success: true,
      paymentId: payment.id?.toString(),
      status: payment.status,
      statusDetail: payment.status_detail,
      externalReference: payment.external_reference,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, error: message };
  }
}
