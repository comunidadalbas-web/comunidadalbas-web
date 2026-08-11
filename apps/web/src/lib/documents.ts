export const DOCUMENT_CATEGORIES = [
  'Estatutos y reglamentos',
  'Avisos de privacidad',
  'Informes financieros trimestrales',
  'Actas de asambleas y reuniones',
  'Convocatorias oficiales',
  'Manuales y lineamientos',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_DETAILS: Record<
  DocumentCategory,
  { description: string; permanent: boolean; requiresHumanUpload: boolean }
> = {
  'Estatutos y reglamentos': {
    description: 'Marco normativo y reglas de convivencia aplicables a la comunidad.',
    permanent: true,
    requiresHumanUpload: false,
  },
  'Avisos de privacidad': {
    description: 'Avisos vigentes sobre el tratamiento y protección de datos personales.',
    permanent: true,
    requiresHumanUpload: false,
  },
  'Informes financieros trimestrales': {
    description: 'Informes aprobados de ingresos, egresos y aplicación de recursos.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Actas de asambleas y reuniones': {
    description:
      'Versiones públicas escaneadas después de revisar y ocultar datos personales no necesarios.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Convocatorias oficiales': {
    description: 'Convocatorias emitidas por los órganos facultados de la comunidad.',
    permanent: false,
    requiresHumanUpload: true,
  },
  'Manuales y lineamientos': {
    description: 'Materiales de orientación aportados para propietarios y residentes.',
    permanent: true,
    requiresHumanUpload: false,
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
