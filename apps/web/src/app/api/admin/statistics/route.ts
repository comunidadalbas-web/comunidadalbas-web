import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRequest } from '@/lib/auth/guards';
import { getSummaryStats, getMonthlySeries, getDelinquency, formatMxn } from '@/lib/statistics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, {
    roles: ['director', 'tesorero', 'admin'],
  });
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'summary';

  if (type === 'series') {
    const months = Math.min(Math.max(Number(searchParams.get('months') || 6), 1), 24);
    const series = await getMonthlySeries(months);
    return NextResponse.json({ items: series });
  }

  if (type === 'delinquency') {
    const rows = await getDelinquency();
    return NextResponse.json({ items: rows, total: rows.reduce((a, r) => a + r.remaining, 0) });
  }

  const summary = await getSummaryStats();
  return NextResponse.json({
    ...summary,
    totalChargesFormatted: formatMxn(summary.totalCharges),
    unpaidFormatted: formatMxn(summary.unpaidAmount),
    confirmedIncomeFormatted: formatMxn(summary.confirmedIncome),
    expensesFormatted: formatMxn(summary.expensesTotal),
    balanceFormatted: formatMxn(summary.balance),
  });
}
