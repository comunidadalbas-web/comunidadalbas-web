import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';
import { guardAdminRequest } from '@/lib/auth/guards';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createPaymentSchema = z.object({
  leaseId: z.string().min(1, 'Selecciona un contrato'),
  leaseChargeId: z.string().optional(),
  paidAt: z.string().min(1, 'La fecha es obligatoria'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  method: z.enum(['TRANSFERENCIA', 'EFECTIVO', 'MERCADO_PAGO', 'OTRO']),
  reference: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['owner', 'gestor', 'contador'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Verify lease exists
  const lease = await prisma.lease.findUnique({ where: { id: data.leaseId } });
  if (!lease) {
    return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  }

  // If leaseChargeId provided, verify it belongs to the lease
  if (data.leaseChargeId) {
    const charge = await prisma.leaseCharge.findUnique({ where: { id: data.leaseChargeId } });
    if (!charge || charge.leaseId !== data.leaseId) {
      return NextResponse.json({ error: 'El cargo no pertenece al contrato seleccionado' }, { status: 400 });
    }
  }

  const payment = await prisma.payment.create({
    data: {
      leaseId: data.leaseId,
      unitId: lease.unitId ?? '',
      paidAt: new Date(data.paidAt),
      amount: data.amount,
      reference: data.reference || null,
      status: 'CONFIRMED',
      notes: data.notes || null,
    },
  });

  // If linked to a charge, create the application
  if (data.leaseChargeId) {
    // Check remaining balance on charge
    const charge = await prisma.leaseCharge.findUnique({
      where: { id: data.leaseChargeId },
      include: { payments: { select: { amount: true } } },
    });

    if (charge) {
      const alreadyApplied = charge.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(charge.amount) - alreadyApplied;

      if (data.amount > remaining + 0.001) {
        return NextResponse.json(
          { error: 'El pago excede el saldo pendiente del cargo' },
          { status: 409 },
        );
      }

      await prisma.leaseChargePayment.create({
        data: {
          leaseChargeId: data.leaseChargeId,
          paymentId: payment.id,
          amount: data.amount,
        },
      });

      // Update charge status if fully paid
      if (data.amount >= remaining - 0.001) {
        await prisma.leaseCharge.update({
          where: { id: data.leaseChargeId },
          data: { status: 'PAID' },
        });
      }
    }
  }

  await writeAuditLog({
    userId: guard.session.userId,
    action: 'PAYMENT_CREATE_MANUAL',
    entityType: 'Payment',
    entityId: payment.id,
    after: {
      leaseId: data.leaseId,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      leaseChargeId: data.leaseChargeId,
    },
  });

  return NextResponse.json({ id: payment.id }, { status: 201 });
}