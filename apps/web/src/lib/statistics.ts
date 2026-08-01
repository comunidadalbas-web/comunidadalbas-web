import { prisma } from '@/lib/db';
import type { ExpenseStatus } from '@comunidad-albas/db';

export interface SummaryStats {
  buildings: number;
  units: number;
  activeUnits: number;
  feeConcepts: number;
  totalCharges: number;
  unpaidAmount: number;
  confirmedPayments: number;
  confirmedIncome: number;
  expenses: number;
  expensesTotal: number;
  balance: number;
  recentOrders: {
    status: string;
    count: number;
    amount: number;
  }[];
}

const MP_PAID_STATUSES = ['approved', 'paid', 'applied'];
const EXPENSE_INCLUDED_STATUSES: ExpenseStatus[] = ['AUTHORIZED', 'PAID', 'VERIFIED', 'RECONCILED'];

export async function getSummaryStats(): Promise<SummaryStats> {
  const [buildingCount, unitCount, activeUnitCount, feeConceptCount, paymentAgg, expenseAgg, orders] =
    await Promise.all([
      prisma.building.count({ where: { status: 'ACTIVE' } }),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: 'ACTIVE' } }),
      prisma.feeConcept.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { status: { in: ['CONFIRMED', 'APPLIED'] } },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { status: { in: EXPENSE_INCLUDED_STATUSES } },
        _sum: { amount: true },
      }),
      prisma.mercadoPagoOrder.groupBy({
        by: ['status'],
        where: { excludeFromCommunityBalance: false },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

  // Cargos pendientes: por unidad, el total cobrado (Charge) contra lo aplicado (PaymentApplication)
  const charges = await prisma.charge.findMany({
    select: { amount: true, payments: { select: { amount: true } } },
  });
  const totalCharges = charges.reduce((acc, c) => acc + Number(c.amount), 0);
  const appliedTotal = charges.reduce(
    (acc, c) => acc + c.payments.reduce((a, x) => a + Number(x.amount), 0),
    0,
  );

  const confirmedIncome = Number(paymentAgg._sum?.amount ?? 0);
  const confirmedPayments = paymentAgg._count;
  const expensesTotal = Number(expenseAgg._sum?.amount ?? 0);

  const recentOrders = orders
    .map((o) => ({
      status: o.status,
      count: o._count._all,
      amount: Number(o._sum?.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    buildings: buildingCount,
    units: unitCount,
    activeUnits: activeUnitCount,
    feeConcepts: feeConceptCount,
    totalCharges,
    unpaidAmount: Math.max(0, totalCharges - appliedTotal),
    confirmedPayments,
    confirmedIncome,
    expenses: await prisma.expense.count({ where: { status: { in: EXPENSE_INCLUDED_STATUSES } } }),
    expensesTotal,
    balance: confirmedIncome - expensesTotal,
    recentOrders,
  };
}

export interface MonthlySeriesPoint {
  month: string; // YYYY-MM
  income: number;
  expenses: number;
}

export async function getMonthlySeries(months = 6): Promise<MonthlySeriesPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [payments, expenses, mpOrders] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: { in: ['CONFIRMED', 'APPLIED'] },
        paidAt: { gte: since },
      },
      select: { amount: true, paidAt: true },
    }),
    prisma.expense.findMany({
      where: {
        status: { in: EXPENSE_INCLUDED_STATUSES },
        spentAt: { gte: since },
      },
      select: { amount: true, spentAt: true },
    }),
    prisma.mercadoPagoOrder.findMany({
      where: {
        status: { in: MP_PAID_STATUSES },
        excludeFromCommunityBalance: false,
        createdAt: { gte: since },
      },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const points: MonthlySeriesPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    points.push({ month: key, income: 0, expenses: 0 });
  }

  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const indexOf = new Map(points.map((p, i) => [p.month, i]));

  for (const p of payments) {
    const i = indexOf.get(keyOf(p.paidAt ?? new Date()));
    if (i !== undefined) points[i].income += Number(p.amount);
  }
  for (const o of mpOrders) {
    const i = indexOf.get(keyOf(o.createdAt));
    if (i !== undefined) points[i].income += Number(o.amount);
  }
  for (const e of expenses) {
    const i = indexOf.get(keyOf(e.spentAt ?? new Date()));
    if (i !== undefined) points[i].expenses += Number(e.amount);
  }

  return points;
}

export interface DelinquencyRow {
  unitCode: string;
  buildingCode: string;
  apartmentNumber: string;
  period: string;
  amount: number;
  applied: number;
  remaining: number;
}

export async function getDelinquency(): Promise<DelinquencyRow[]> {
  const charges = await prisma.charge.findMany({
    orderBy: { dueDate: 'asc' },
    take: 200,
    include: {
      unit: { select: { code: true, apartmentNumber: true, building: { select: { code: true } } } },
      payments: { select: { amount: true } },
    },
  });

  return charges
    .map((c) => {
      const applied = c.payments.reduce((a, x) => a + Number(x.amount), 0);
      const amount = Number(c.amount);
      return {
        unitCode: c.unit.code,
        buildingCode: c.unit.building.code,
        apartmentNumber: c.unit.apartmentNumber,
        period: c.period,
        amount,
        applied,
        remaining: Math.max(0, amount - applied),
      };
    })
    .filter((r) => r.remaining > 0);
}

export function formatMxn(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}
