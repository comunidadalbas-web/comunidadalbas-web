export const MAX_ADMIN_USERS = 5;

export const INSTITUTIONAL_ACCOUNTS = [
  {
    email: 'presidencia@comunidadalbas.com.mx',
    displayName: 'Presidencia',
    responsibility: 'Representación y autorizaciones institucionales.',
    defaultRoles: ['admin', 'director'],
  },
  {
    email: 'secretaria@comunidadalbas.com.mx',
    displayName: 'Secretaría',
    responsibility: 'Convocatorias, actas, archivo, dominio y coordinación documental.',
    defaultRoles: ['secretario', 'director'],
  },
  {
    email: 'tesoreria@comunidadalbas.com.mx',
    displayName: 'Vocalía Primera / Tesorería',
    responsibility: 'Recaudación, conciliación, egresos e informes.',
    defaultRoles: ['tesorero'],
  },
  {
    email: 'contacto@comunidadalbas.com.mx',
    displayName: 'Vocalía Segunda',
    responsibility: 'Atención, solicitudes e incidencias.',
    defaultRoles: ['vocal'],
  },
  {
    email: 'transparencia@comunidadalbas.com.mx',
    displayName: 'Vocalía Tercera',
    responsibility: 'Rendición de cuentas y publicación autorizada.',
    defaultRoles: ['vocal', 'director'],
  },
] as const;

export const INSTITUTIONAL_ALIASES = [
  {
    email: 'pagos@comunidadalbas.com.mx',
    targetEmail: 'tesoreria@comunidadalbas.com.mx',
    function: 'Recaudación y pagos',
  },
  {
    email: 'privacidad@comunidadalbas.com.mx',
    targetEmail: 'transparencia@comunidadalbas.com.mx',
    function: 'Privacidad y transparencia',
  },
  {
    email: 'administracion@comunidadalbas.com.mx',
    targetEmail: 'secretaria@comunidadalbas.com.mx',
    function: 'Administración general',
  },
] as const;

export function isAllowedAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return INSTITUTIONAL_ACCOUNTS.some((account) => account.email === normalized);
}
