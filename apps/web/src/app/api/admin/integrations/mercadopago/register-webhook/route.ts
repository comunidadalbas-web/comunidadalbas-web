import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { registerWebhook } from '@/lib/mercadopago/webhook';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comunidadalbas.com.mx';
    const webhookUrl = `${siteUrl}/api/integrations/mercadopago/webhook`;

    const result = await registerWebhook(webhookUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al registrar webhook' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      webhookUrl,
      message: 'Webhook registrado en Mercado Pago',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('register-webhook error:', message);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
