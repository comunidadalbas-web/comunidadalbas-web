export const DOCUMENT_CATEGORIES = [
  'Propiedad',
  'Escritura',
  'FOVISSSTE',
  'Condominio',
  'Reglamentos',
  'Arrendatarios',
  'Contratos',
  'Inventarios',
  'Administración',
  'Pagos',
  'Fiscal',
  'Mantenimiento',
  'Fotografías',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_DETAILS: Record<
  DocumentCategory,
  { description: string; permanent: boolean; requiresHumanUpload: boolean }
> = {
  'Propiedad': {
    description: 'Documentos generales de la propiedad.',
    permanent: true,
    requiresHumanUpload: false,
  },
  'Escritura': {
    description: 'Escrituras y títulos de propiedad.',
    permanent: true,
    requiresHumanUpload: true,
  },
  'FOVISSSTE': {
    description: 'Documentos relacionados con FOVISSSTE.',
    permanent: true,
    requiresHumanUpload: true,
  },
  'Condominio': {
    description: 'Documentos de condominio y reglamento interno.',
    permanent: true,
    requiresHumanUpload: false,
  },
  'Reglamentos': {
    description: 'Reglamentos y normativas aplicables.',
    permanent: true,
    requiresHumanUpload: false,
  },
  'Arrendatarios': {
    description: 'Documentos de arrendatarios.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Contratos': {
    description: 'Contratos de arrendamiento.',
    permanent: true,
    requiresHumanUpload: true,
  },
  'Inventarios': {
    description: 'Inventarios de mobiliario y equipamiento.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Administración': {
    description: 'Documentos administrativos y de gestión.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Pagos': {
    description: 'Comprobantes de pago y recibos.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Fiscal': {
    description: 'Documentos fiscales y tributarios.',
    permanent: true,
    requiresHumanUpload: true,
  },
  'Mantenimiento': {
    description: 'Registros de mantenimiento y reparaciones.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Fotografías': {
    description: 'Fotografías de la propiedad.',
    permanent: false,
    requiresHumanUpload: true,
  },
};

export const DOCUMENT_STORAGE_PROVIDERS = ['SUPABASE', 'VERCEL_BLOB', 'EXTERNAL'] as const;
export type DocumentStorageProvider = (typeof DOCUMENT_STORAGE_PROVIDERS)[number];

export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_RECOMMENDED_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes < 1) return null;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
