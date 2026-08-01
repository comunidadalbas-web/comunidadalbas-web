import { NextRequest, NextResponse } from 'next/server';
import { createSpeiOrder, createCheckoutPreference } from '@/lib/mercadopago/orders';
import { getPaymentsConfig } from '@/lib/mercadopago/config';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

const CUOTA_CODE = 'CUOTA';
const EXTRAORDINARIO_CODE = 'EXTRAORDINARIO';
const METHOD_CARD = 'tarjeta';
const METHOD_SPEI = 'spei';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

async function isRateLimited(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.rateLimitEntry.count({
    where: { key: `pagos:${ip}`, createdAt: { gte: since } },
  });
  if (count >= RATE_LIMIT_MAX) return true;
  await prisma.rateLimitEntry.create({ data: { key: `pagos:${ip}` } });
  return false;
}

export async function POST(request: NextRequest) {
  const config = getPaymentsConfig();
  if (!config.enabled) {
    return NextResponse.json({ error: 'Los pagos en línea no están disponibles en este momento' }, { status: 403 });
  }

  try {
    const ip = getClientIp(request);
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Demasiados intentos. Intenta nuevamente más tarde' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));

    const payerEmail = typeof body.payerEmail === 'string' ? body.payerEmail.trim().toLowerCase() : '';
    const payerName = typeof body.payerName === 'string' ? body.payerName.trim() : '';
    const conceptCode = typeof body.concept === 'string' ? body.concept.trim().toUpperCase() : '';
    const rawAmount = typeof body.amount === 'string' ? body.amount.trim() : '';
    const building = typeof body.building === 'string' ? body.building.trim() : '';
    const apartment = typeof body.apartment === 'string' ? body.apartment.trim() : '';
    const method = typeof body.metodo === 'string' && body.metodo.trim() === METHOD_SPEI
      ? METHOD_SPEI
      : METHOD_CARD;

    if (!payerEmail || !payerName) {
      return NextResponse.json({ error: 'Nombre y correo son obligatorios' }, { status: 400 });
    }
    if (!building || !apartment) {
      return NextResponse.json({ error: 'Edificio y departamento son obligatorios' }, { status: 400 });
    }

    let externalReference: string;
    let amount: string;
    let conceptName: string;

    const today = new Date().toISOString().slice(0, 10);
    const uuid = crypto.randomUUID().slice(0, 8);

    if (conceptCode === CUOTA_CODE) {
      amount = config.cuotaAmount;
      conceptName = 'Cuota de mantenimiento';
      externalReference = `CUOTA-${today}-${building}-${apartment}-${uuid}`;
    } else if (conceptCode === EXTRAORDINARIO_CODE) {
      const parsed = parseFloat(rawAmount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ error: 'El monto del extraordinario debe ser mayor a cero' }, { status: 400 });
      }
      if (parsed > parseFloat(config.maxExtraordinaryAmount)) {
        return NextResponse.json({ error: `El monto no puede exceder $${config.maxExtraordinaryAmount} MXN` }, { status: 400 });
      }
      amount = parsed.toFixed(2);
      conceptName = 'Cuota extraordinaria';
      externalReference = `EXTRA-${today}-${building}-${apartment}-${uuid}`;
    } else {
      return NextResponse.json({ error: 'Concepto de pago no válido' }, { status: 400 });
    }

    const base = 'https://comunidadalbas.com.mx/pagos';

    if (method === METHOD_CARD) {
      const prefResult = await createCheckoutPreference({
        externalReference,
        totalAmount: amount,
        payerEmail,
        payerName,
        itemTitle: `${conceptName} — Edif. ${building} Depto. ${apartment}`,
        backUrlSuccess: `${base}?resultado=exito`,
        backUrlFailure: `${base}?resultado=error`,
        backUrlPending: `${base}?resultado=pendiente`,
        isPilot: false,
      });

      if (!prefResult.success) {
        return NextResponse.json({ error: prefResult.error || 'No se pudo generar el pago' }, { status: 502 });
      }

      await prisma.mercadoPagoOrder.create({
        data: {
          orderId: `PREF-${prefResult.preferenceId!}`,
          externalReference,
          status: 'in_process',
          statusDetail: 'checkout_created',
          amount: parseFloat(amount),
          environment: 'production',
          idempotencyKey: prefResult.idempotencyKey!,
          isPilot: false,
          excludeFromCommunityBalance: false,
          feeConceptName: conceptName,
          payerName,
          payerEmail,
          building,
          apartment,
        },
      });

      return NextResponse.json({
        success: true,
        metodo: METHOD_CARD,
        initPoint: prefResult.initPoint,
        preferenceId: prefResult.preferenceId,
        amount,
        conceptName,
        building,
        apartment,
        externalReference,
      });
    }

    const result = await createSpeiOrder({
      externalReference,
      totalAmount: amount,
      payerEmail,
      payerName,
      isPilot: false,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'No se pudo generar la orden de pago' }, { status: 502 });
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
        idempotencyKey: result.idempotencyKey!,
        isPilot: false,
        excludeFromCommunityBalance: false,
        feeConceptName: conceptName,
        payerName,
        payerEmail,
        building,
        apartment,
      },
    });

    return NextResponse.json({
      success: true,
      metodo: METHOD_SPEI,
      orderId: result.orderId,
      status: result.status,
      statusDetail: result.statusDetail,
      paymentId: result.paymentId,
      reference: result.reference,
      ticketUrl: result.ticketUrl,
      expiresAt: result.expiresAt,
      amount,
      conceptName,
      building,
      apartment,
      externalReference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    console.error('pagos create error:', message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
