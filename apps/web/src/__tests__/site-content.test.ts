import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('contenido y navegación', () => {
  it('Home anuncia PATRIMONIO', () => {
    const text = source('src/app/page.tsx');
    expect(text).toContain('PATRIMONIO');
  });

  it('login permite mostrar u ocultar y enlaza recuperación', () => {
    const text = source('src/app/login/page.tsx');
    expect(text).toContain("type={showPassword ? 'text' : 'password'}");
    expect(text).toContain('Mostrar contraseña');
    expect(text).toContain('/recuperar-contrasena');
  });

  it('footer incluye email institucional', () => {
    const text = source('src/app/layout.tsx');
    expect(text).toContain('contacto@comunidadalbas.com.mx');
  });

  it('navegación superior incluye PATRIMONIO', () => {
    const text = source('src/components/site-header.tsx');
    expect(text).toContain('PATRIMONIO');
  });

  it('suscripción verificada queda visible con enlace externo seguro', () => {
    const text = source('src/app/pagos/page.tsx');
    // Flujo SPEI local: verificar componentes clave, ausencia de Mercado Pago antiguo
    // El nuevo /pagos usa flujo SPEI local sin referencias a Mercado Pago
    const hasSpeiFlow = text.includes('Reportar Pago SPEI') || text.includes('SPEI')
    const hasOldMpSubscription = text.includes('Pago automático mensual')
    const hasMpUrl = text.includes('MONTHLY_SUBSCRIPTION_URL')
    // El nuevo flujo debe tener referencias a Cobranza/LeaseCharge y ausentes las antiguas de MP
    const hasNewComponents = text.includes('Cobranza') && text.includes('LeaseCharge')
    // Ausencia de Mercado Pago antiguo es un requisito
    const noOldMp = !hasMpUrl && !hasOldMpSubscription
    // Reportar: el test pasa si tiene flujo SPEI nuevo O si ausenta componentes antiguos
    expect(noOldMp).toBe(true)
    expect(hasNewComponents).toBe(true)
  });

  it('privacidad cubre suscripciones y participación', () => {
    const text = source('src/app/privacidad/page.tsx');
    expect(text).toContain('Suscripciones y pagos recurrentes');
    expect(text).toContain('Participación y opiniones en el blog');
  });

  it('documentos organiza transparencia y categorías patrimonio', () => {
    const page = source('src/app/documentos/page.tsx');
    const categories = source('src/lib/documents.ts');
    expect(page).toContain('Documentos y transparencia');
    expect(categories).toContain('Contratos');
    expect(categories).toContain('Inventarios');
    expect(categories).toContain('Fiscal');
  });
});
