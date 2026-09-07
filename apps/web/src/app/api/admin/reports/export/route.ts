import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import type { ExpenseStatus } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { toCsv, getDelinquency, getMonthlySeries } from '@/lib/statistics';

export const dynamic = 'force-dynamic';

const EXPENSE_INCLUDED_STATUSES: ExpenseStatus[] = ['AUTHORIZED', 'PAID', 'VERIFIED', 'RECONCILED'];

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, {
    roles: ['director', 'tesorero', 'admin'],
  });
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'units';
  const today = new Date().toISOString().slice(0, 10);

  if (type === 'units') {
    const units = await prisma.unit.findMany({
      orderBy: [{ building: { code: 'asc' } }, { apartmentNumber: 'asc' }],
      include: { building: { select: { code: true, name: true } } },
    });
    const rows = units.map((u: any) => ({
      edificio: u.building.code,
      nombre_edificio: u.building.name,
      departamento: u.apartmentNumber,
      codigo: u.code,
      estado: u.status,
    }));
    return csvResponse(toCsv(rows), `unidades-${today}.csv`);
  }

  if (type === 'buildings') {
    const buildings = await prisma.building.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { units: true } } },
    });
    const rows = buildings.map((b: any) => ({
      codigo: b.code,
      nombre: b.name,
      estado: b.status,
      departamentos: b._count.units,
    }));
    return csvResponse(toCsv(rows), `edificios-${today}.csv`);
  }

  if (type === 'concepts') {
    const concepts = await prisma.feeConcept.findMany({ orderBy: { name: 'asc' } });
    const rows = concepts.map((c: any) => ({
      nombre: c.name,
      monto: Number(c.amount),
      fuente_autoridad: c.authoritySource,
      estado: c.status,
    }));
    return csvResponse(toCsv(rows), `conceptos-${today}.csv`);
  }

  if (type === 'delinquency') {
    const rows = await getDelinquency();
    const csvRows = rows.map((r) => ({
      edificio: r.buildingCode,
      departamento: r.apartmentNumber,
      unidad: r.unitCode,
      periodo: r.period,
      monto: r.amount,
      aplicado: r.applied,
      pendiente: r.remaining,
    }));
    return csvResponse(toCsv(csvRows), `morosidad-${today}.csv`);
  }

  if (type === 'payments') {
    const payments = await prisma.payment.findMany({
      orderBy: { reportedAt: 'desc' },
      include: { unit: { select: { code: true, apartmentNumber: true } } },
      take: 1000,
    });
    const rows = payments.map((p: any) => ({
      fecha_reporte: p.reportedAt.toISOString(),
      unidad: p.unit.code,
      departamento: p.unit.apartmentNumber,
      monto: Number(p.amount),
      referencia: p.reference ?? '',
      estado: p.status,
    }));
    return csvResponse(toCsv(rows), `pagos-${today}.csv`);
  }

  if (type === 'orders') {
    const orders = await prisma.mercadoPagoOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const rows = orders.map((o: any) => ({
      fecha: o.createdAt.toISOString(),
      orden: o.orderId,
      referencia_externa: o.externalReference,
      monto: Number(o.amount),
      estado: o.status,
      detalle: o.statusDetail ?? '',
      ambiente: o.environment,
      edificio: o.building ?? '',
      departamento: o.apartment ?? '',
      concepto: o.feeConceptName ?? '',
    }));
    return csvResponse(toCsv(rows), `ordenes-mp-${today}.csv`);
  }

  if (type === 'expenses') {
    const expenses = await prisma.expense.findMany({
      where: { status: { in: EXPENSE_INCLUDED_STATUSES } },
      orderBy: { spentAt: 'desc' },
      take: 1000,
    });
    const rows = expenses.map((e: any) => ({
      fecha: e.spentAt?.toISOString() ?? '',
      categoria: e.category,
      proveedor: e.provider ?? '',
      descripcion: e.description,
      fondo: e.fund,
      monto: Number(e.amount),
      estado: e.status,
    }));
    return csvResponse(toCsv(rows), `egresos-${today}.csv`);
  }

  if (type === 'series') {
    const months = Math.min(Math.max(Number(searchParams.get('months') || 6), 1), 24);
    const series = await getMonthlySeries(months);
    const rows = series.map((s: any) => ({
      mes: s.month,
      ingresos: s.income,
      egresos: s.expenses,
      balance: s.income - s.expenses,
    }));
    return csvResponse(toCsv(rows), `ingresos-egresos-${today}.csv`);
  }

  return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
}
