import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const webhookUrl = 'https://comunidadalbas.com.mx/api/integrations/mercadopago/webhook';
  const hasSecret = !!process.env.MERCADOPAGO_WEBHOOK_SECRET;

  return NextResponse.json({
    webhookUrl,
    webhookSecretConfigured: hasSecret,
    instructions: [
      '1. Ve a https://www.mercadopago.com.mx/developers/panel/apps',
      '2. Selecciona tu aplicación de prueba',
      '3. En la sección Webhooks, agrega: ' + webhookUrl,
      '4. Configura el mismo MERCADOPAGO_WEBHOOK_SECRET que está en Vercel',
      '5. Activa los eventos: order.created, order.updated, payment.created, payment.updated',
      '6. Guarda los cambios',
    ],
  });
}
