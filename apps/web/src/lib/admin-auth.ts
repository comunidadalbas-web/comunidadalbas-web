import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function requireAdmin(request: NextRequest): NextResponse | null {
  const env = process.env.MERCADOPAGO_ENV || 'test';
  const pilotEnabled = process.env.PAYMENTS_PILOT_ENABLED === 'true';
  if (env !== 'test' && !pilotEnabled) {
    return NextResponse.json(
      { error: 'Endpoint administrativo deshabilitado' },
      { status: 403 },
    );
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Autenticación requerida' },
      { status: 401 },
    );
  }
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    console.error('ADMIN_API_KEY no configurada');
    return NextResponse.json(
      { error: 'Error de configuración del servidor' },
      { status: 500 },
    );
  }
  const token = authHeader.slice(7);
  if (token !== apiKey) {
    return NextResponse.json(
      { error: 'Credenciales inválidas' },
      { status: 401 },
    );
  }
  return null;
}
