import { describe, it, expect } from 'vitest';
import { announcementSchema, campaignSchema, calendarEventSchema } from '@/lib/cms/validation';

describe('cms/announcement', () => {
  const valid = { title: 'Aviso importante', body: 'Contenido', category: 'aviso', status: 'DRAFT' };

  it('acepta comunicado válido', () => {
    expect(announcementSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza sin título', () => {
    const r = announcementSchema.safeParse({ ...valid, title: '' });
    expect(r.success).toBe(false);
  });

  it('rechaza sin contenido', () => {
    const r = announcementSchema.safeParse({ ...valid, body: '' });
    expect(r.success).toBe(false);
  });

  it('rechaza estado inválido', () => {
    const r = announcementSchema.safeParse({ ...valid, status: 'NOEXISTE' });
    expect(r.success).toBe(false);
  });

  it('rechaza título demasiado largo', () => {
    const r = announcementSchema.safeParse({ ...valid, title: 'x'.repeat(201) });
    expect(r.success).toBe(false);
  });
});

describe('cms/campaign', () => {
  const valid = { title: 'Campaña', description: 'Desc', status: 'DRAFT' };

  it('acepta campaña válida', () => {
    expect(campaignSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza meta negativa', () => {
    const r = campaignSchema.safeParse({ ...valid, goalAmount: -5 });
    expect(r.success).toBe(false);
  });

  it('rechaza estado inválido', () => {
    const r = campaignSchema.safeParse({ ...valid, status: 'X' });
    expect(r.success).toBe(false);
  });

  it('acepta fechas válidas', () => {
    const r = campaignSchema.safeParse({
      ...valid,
      startsAt: '2026-08-01T12:00:00Z',
      endsAt: '2026-09-01T12:00:00Z',
    });
    expect(r.success).toBe(true);
  });

  it('acepta imagen y texto alternativo válidos', () => {
    const r = campaignSchema.safeParse({
      ...valid,
      imageUrl: 'https://example.com/campana.webp',
      imageAlt: 'Cartel de campaña comunitaria',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza una URL de imagen inválida', () => {
    expect(campaignSchema.safeParse({ ...valid, imageUrl: 'archivo-local.png' }).success).toBe(false);
  });
});

describe('cms/calendarEvent', () => {
  const valid = { title: 'Asamblea', startsAt: '2026-08-01T18:00:00Z', status: 'SCHEDULED' };

  it('acepta evento válido', () => {
    expect(calendarEventSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza fecha de inicio inválida', () => {
    const r = calendarEventSchema.safeParse({ ...valid, startsAt: 'no-es-fecha' });
    expect(r.success).toBe(false);
  });

  it('rechaza estado inválido', () => {
    const r = calendarEventSchema.safeParse({ ...valid, status: 'NOPE' });
    expect(r.success).toBe(false);
  });

  it('acepta endsAt null', () => {
    const r = calendarEventSchema.safeParse({ ...valid, endsAt: null });
    expect(r.success).toBe(true);
  });
});
