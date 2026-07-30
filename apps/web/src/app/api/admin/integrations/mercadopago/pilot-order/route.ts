import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createSpeiOrder } from '@/lib/mercadopago/orders';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const env = process.env.MERCADOPAGO_ENV || 'test';
  const pilotEnabled = process.env.PAYMENTS_PILOT_ENABLED === 'true';

  if (env !== 'production' || !pilotEnabled) {
    return NextResponse.json({ error: 'Piloto no habilitado en este ambiente' }, { status: 403 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const uuid = crypto.randomUUID().slice(0, 8);
    const externalReference = `PILOTO-BORIS-${today}-${uuid}`;
    const amount = process.env.PILOT_PAYMENT_AMOUNT || '200.00';

    const result = await createSpeiOrder({
      externalReference,
      totalAmount: amount,
      payerEmail: 'test_user_mx@testuser.com',
      payerName: 'Boris',
      isPilot: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Error al crear orden piloto' }, { status: 502 });
    }

    const expiresAt = result.expiresAt ? new Date(result.expiresAt) : null;

    await prisma.mercadoPagoOrder.create({
      data: {
        orderId: result.orderId!,
        externalReference,
        status: result.status!,
        statusDetail: result.statusDetail,
        paymentId: result.paymentId,
        reference: result.reference,
        ticketUrl: result.ticketUrl,
        expiresAt,
        amount: parseFloat(amount),
        environment: 'production',
        idempotencyKey: crypto.randomUUID(),
        isPilot: true,
        excludeFromCommunityBalance: true,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      status: result.status,
      statusDetail: result.statusDetail,
      paymentId: result.paymentId,
      reference: result.reference,
      ticketUrl: result.ticketUrl,
      expiresAt: result.expiresAt,
      hasTicketUrl: !!result.ticketUrl,
      hasReference: !!result.reference,
      isPilot: true,
      excludeFromCommunityBalance: true,
      disclaimer: 'PRUEBA PILOTO — NO CORRESPONDE A CUOTA CONDOMINAL',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('pilot-order error:', message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
