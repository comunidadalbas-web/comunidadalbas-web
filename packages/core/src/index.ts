export const INSTITUTIONAL_STATUS = {
  AC_EXISTING: process.env.AC_EXISTING === 'true',
  SITE_STATUS: process.env.INSTITUTIONAL_STATUS || 'pending',
} as const;

export const SITE_INFO = {
  name: 'Comunidad Albas',
  domain: 'comunidadalbas.com.mx',
  address: 'Privada Albas, Real Granada Quinta Etapa, Tecámac, Estado de México, C.P. 55745',
  emails: {
    presidencia: 'presidencia@comunidadalbas.com.mx',
    secretaria: 'secretaria@comunidadalbas.com.mx',
    tesoreria: 'tesoreria@comunidadalbas.com.mx',
    contacto: 'contacto@comunidadalbas.com.mx',
    transparencia: 'transparencia@comunidadalbas.com.mx',
  },
} as const;
