export const FOLIO_PREFIX = 'CA';
export function buildFolio(year: number, sequence: number): string {
  return `${FOLIO_PREFIX}-${year}-${String(sequence).padStart(6, '0')}`;
}

export function folioYear(folio: string): number | null {
  const match = /^CA-(\d{4})-\d{6}$/.exec(folio);
  return match ? Number(match[1]) : null;
}

export function nextFolioSequence(
  existing: { folio: string | null }[],
  year: number,
): number {
  let max = 0;
  for (const item of existing) {
    const parsed = folioYear(item.folio ?? '');
    if (parsed !== year) continue;
    const seq = Number((item.folio ?? '').split('-').pop() ?? '0');
    if (Number.isFinite(seq) && seq > max) max = seq;
  }
  return max + 1;
}

export interface FolioRequest {
  id: string;
  folio: string | null;
}

export function hasUniqueConflict(err: unknown): boolean {
  const candidate = err as { code?: string; meta?: { target?: unknown } };
  const target = candidate?.meta?.target;
  const targetText = Array.isArray(target)
    ? target.map(String).join(',')
    : typeof target === 'string'
      ? target
      : '';
  return candidate?.code === 'P2002' && targetText.toLowerCase().includes('folio');
}

const MAX_RETRIES = 5;

export async function assignFolio<T extends FolioRequest>(
  getExisting: (year: number) => Promise<T[]>,
  create: (folio: string) => Promise<void>,
  year = new Date().getFullYear(),
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const existing = await getExisting(year);
    const sequence = nextFolioSequence(existing, year);
    const folio = buildFolio(year, sequence);
    try {
      await create(folio);
      return folio;
    } catch (err) {
      if (hasUniqueConflict(err)) continue;
      throw err;
    }
  }
  throw new Error('No se pudo asignar un folio único a la solicitud');
}
