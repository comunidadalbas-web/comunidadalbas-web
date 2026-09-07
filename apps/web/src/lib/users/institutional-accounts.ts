export const MAX_ADMIN_USERS = 5;

export const INSTITUTIONAL_ACCOUNTS = [
  {
    email: 'secretaria@comunidadalbas.com.mx',
    displayName: 'Superadministrador',
    responsibility: 'Superadministración, propietario de cuentas, recuperación, credenciales maestras.',
    defaultRoles: ['owner'],
  },
  {
    email: 'gestion@comunidadalbas.com.mx',
    displayName: 'Gestor Patrimonial',
    responsibility: 'Operación cotidiana, backoffice, gestión general, administración interna.',
    defaultRoles: ['gestor'],
  },
  {
    email: 'transparencia@comunidadalbas.com.mx',
    displayName: 'Arrendamiento',
    responsibility: 'Contratos, arrendatarios, renovaciones, inventarios, entrega-recepción.',
    defaultRoles: ['gestor'],
  },
  {
    email: 'pagos@comunidadalbas.com.mx',
    displayName: 'Finanzas',
    responsibility: 'Cobranza, comprobantes, recibos, conciliación, comunicaciones financieras.',
    defaultRoles: ['contador'],
  },
  {
    email: 'contacto@comunidadalbas.com.mx',
    displayName: 'Contacto',
    responsibility: 'Contacto general, formularios públicos, recepción de terceros.',
    defaultRoles: ['gestor'],
  },
] as const;

export const INSTITUTIONAL_ALIASES = [] as const;

export function isAllowedAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return INSTITUTIONAL_ACCOUNTS.some((account) => account.email === normalized);
}
