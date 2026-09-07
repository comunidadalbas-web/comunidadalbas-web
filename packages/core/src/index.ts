export const INSTITUTIONAL_STATUS = {
  AC_EXISTING: process.env.AC_EXISTING === 'true',
  SITE_STATUS: process.env.INSTITUTIONAL_STATUS || 'pending',
} as const;

export const SITE_INFO = {
  name: 'PATRIMONIO',
  domain: 'comunidadalbas.com.mx',
  address: 'Privada Albas, Real Granada Quinta Etapa, Tecámac, Estado de México, C.P. 55745',
  emails: {
    superadmin: 'secretaria@comunidadalbas.com.mx',
    gestion: 'gestion@comunidadalbas.com.mx',
    arrendamiento: 'transparencia@comunidadalbas.com.mx',
    pagos: 'pagos@comunidadalbas.com.mx',
    contacto: 'contacto@comunidadalbas.com.mx',
  },
} as const;
