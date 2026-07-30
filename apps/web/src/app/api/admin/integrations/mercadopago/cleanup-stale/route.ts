import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleOrders = await prisma.mercadoPagoOrder.findMany({
      where: {
        status: 'action_required',
        createdAt: { lt: staleThreshold },
      },
    });

    let expired = 0;
    let errors = 0;

    for (const order of staleOrders) {
      try {
        await prisma.mercadoPagoOrder.update({
          where: { id: order.id },
          data: {
            status: 'expired',
            statusDetail: 'stale_auto_cleanup',
          },
        });
        expired++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      processed: staleOrders.length,
      markedExpired: expired,
      errors,
      threshold: staleThreshold.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('cleanup-stale error:', message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
