import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const env = process.env.MERCADOPAGO_ENV || 'test';
  const hasToken = !!process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;
  const hasProdToken = !!process.env.MERCADOPAGO_ACCESS_TOKEN_PROD;
  const webhookSecretVar = env === 'production' ? 'MERCADOPAGO_WEBHOOK_SECRET_PROD' : 'MERCADOPAGO_WEBHOOK_SECRET_TEST';
  const hasWebhookSecret = !!(process.env[webhookSecretVar] || process.env.MERCADOPAGO_WEBHOOK_SECRET);
  const webhookUrl = 'https://comunidadalbas.com.mx/api/integrations/mercadopago/webhook';

  const lastOrder = await prisma.mercadoPagoOrder.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderId: true, status: true, statusDetail: true, amount: true, isPilot: true, createdAt: true },
  });

  const lastWebhook = await prisma.mercadoPagoWebhookEvent.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const orderCount = await prisma.mercadoPagoOrder.count();

  return NextResponse.json({
    env,
    tokenConfigured: hasToken,
    prodTokenConfigured: hasProdToken,
    webhookSecretConfigured: hasWebhookSecret,
    webhookUrl,
    lastOrder,
    lastWebhook: lastWebhook
      ? {
          id: lastWebhook.id,
          topic: lastWebhook.topic,
          resource: lastWebhook.resource,
          action: lastWebhook.action,
          signatureValid: lastWebhook.signatureValid,
          duplicate: lastWebhook.duplicate,
          processed: lastWebhook.processed,
          processResult: lastWebhook.processResult,
          processError: lastWebhook.processError,
          createdAt: lastWebhook.createdAt,
        }
      : null,
    orderCount,
    isProduction: env === 'production',
    pilotEnabled: process.env.PAYMENTS_PILOT_ENABLED === 'true',
    pilotAmount: process.env.PILOT_PAYMENT_AMOUNT || '200.00',
    paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true' && env === 'production',
    cuotaAmount: process.env.PAYMENTS_CUOTA_AMOUNT || '100.00',
    maxExtraordinaryAmount: process.env.PAYMENTS_MAX_EXTRAORDINARY || '10000.00',
    allowedEmails: (process.env.PAYMENTS_ALLOWED_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean),
  });
}
