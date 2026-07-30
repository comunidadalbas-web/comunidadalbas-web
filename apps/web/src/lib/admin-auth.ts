import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function requireAdmin(request: NextRequest): NextResponse | null {
  if (process.env.MERCADOPAGO_ENV !== 'test') {
    return NextResponse.json(
      { error: 'Solo disponible en entorno de pruebas' },
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
