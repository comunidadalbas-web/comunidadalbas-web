import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getOrderById } from '@/lib/mercadopago/orders';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 },
      );
    }

    const local = await prisma.mercadoPagoOrder.findUnique({
      where: { orderId },
    });

    const mp = await getOrderById(orderId);

    return NextResponse.json({
      local: local
        ? {
            id: local.id,
            status: local.status,
            statusDetail: local.statusDetail,
            amount: local.amount.toString(),
            reference: local.reference,
            hasTicketUrl: !!local.ticketUrl,
            createdAt: local.createdAt,
          }
        : null,
      mp: mp.success
        ? {
            orderId: mp.orderId,
            status: mp.status,
            statusDetail: mp.statusDetail,
            hasTicketUrl: !!mp.ticketUrl,
            reference: mp.reference,
          }
        : { error: mp.error },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('get-mercadopago-order error:', message);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
