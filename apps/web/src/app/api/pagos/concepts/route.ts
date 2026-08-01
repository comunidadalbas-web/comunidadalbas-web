import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsConfig } from '@/lib/mercadopago/config';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const config = getPaymentsConfig();
  return NextResponse.json({
    enabled: config.enabled,
    environment: config.environment,
    cuotaAmount: config.cuotaAmount,
    maxExtraordinaryAmount: config.maxExtraordinaryAmount,
    concepts: [
      {
        code: 'CUOTA',
        name: 'Cuota de mantenimiento',
        description: 'Cuota condominal del periodo en curso',
        fixedAmount: config.cuotaAmount,
        allowsCustomAmount: false,
      },
      {
        code: 'EXTRAORDINARIO',
        name: 'Cuota extraordinaria',
        description: 'Aportación extraordinaria aprobada por la asamblea',
        fixedAmount: null,
        allowsCustomAmount: true,
      },
    ],
  });
}
