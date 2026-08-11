import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('contenido y navegación', () => {
  it('Home anuncia tarjeta y SPEI', () => {
    const text = source('src/app/page.tsx');
    expect(text).toContain('con tarjeta o mediante transferencia SPEI');
  });

  it('login permite mostrar u ocultar y enlaza recuperación', () => {
    const text = source('src/app/login/page.tsx');
    expect(text).toContain("type={showPassword ? 'text' : 'password'}");
    expect(text).toContain('Mostrar contraseña');
    expect(text).toContain('/recuperar-contrasena');
  });

  it('footer incluye Secretaría y WhatsApp HTTPS', () => {
    const text = source('src/app/layout.tsx');
    expect(text).toContain('secretaria@comunidadalbas.com.mx');
    expect(text).toContain('https://wa.me/525663011493');
    expect(text).toContain('No es un canal de emergencias');
  });

  it('navegación superior incluye Campañas', () => {
    expect(source('src/components/site-header.tsx')).toContain('href="/campanas"');
  });

  it('suscripción verificada queda visible con enlace externo seguro', () => {
    const text = source('src/app/pagos/page.tsx');
    expect(text).toContain('Pago automático mensual');
    expect(text).toContain("const MONTHLY_SUBSCRIPTION_URL = 'https://mpago.la/1zLpGTV'");
    expect(text).toContain('href={MONTHLY_SUBSCRIPTION_URL}');
    expect(text).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it('privacidad cubre suscripciones y participación', () => {
    const text = source('src/app/privacidad/page.tsx');
    expect(text).toContain('Suscripciones y pagos recurrentes');
    expect(text).toContain('Participación y opiniones en el blog');
  });

  it('documentos organiza transparencia y mantiene el aviso de privacidad fijo', () => {
    const page = source('src/app/documentos/page.tsx');
    const categories = source('src/lib/documents.ts');
    expect(page).toContain('Documentos y transparencia');
    expect(page).toContain('Aviso de privacidad integral del sitio');
    expect(page).toContain('Ver integridad');
    expect(categories).toContain('Informes financieros trimestrales');
    expect(categories).toContain('Actas de asambleas y reuniones');
    expect(categories).toContain('Convocatorias oficiales');
  });
});
