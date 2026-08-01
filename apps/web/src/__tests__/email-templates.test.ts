import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  layout,
  renderContactConfirmation,
  renderContactAdminNotification,
  renderSolicitudStatusChange,
  renderUserWelcome,
  CATEGORY_LABEL,
  SOLICITUD_STATUS_LABEL,
} from '@/lib/email/templates';

const CTX = { siteName: 'Comunidad Albas', siteUrl: 'https://comunidadalbas.com.mx' };

describe('email/templates - escapeHtml', () => {
  it('escapes HTML special chars', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("a'b&c")).toBe('a&#39;b&amp;c');
  });
});

describe('email/templates - layout', () => {
  it('wraps content with brand header and footer', () => {
    const html = layout('Test', '<p>Body</p>', CTX);
    expect(html).toContain('Comunidad Albas');
    expect(html).toContain('https://comunidadalbas.com.mx');
    expect(html).toContain('<p>Body</p>');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('escapes the title', () => {
    const html = layout('<b>x</b>', '', CTX);
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('email/templates - contact confirmation', () => {
  const data = {
    name: 'Juan Pérez',
    folio: 'CA-2026-000123',
    category: 'maintenance',
    statusUrl: 'https://comunidadalbas.com.mx/solicitud',
  };

  it('renders subject, folio and CTA link', () => {
    const r = renderContactConfirmation(data, CTX);
    expect(r.subject).toContain('Recibimos tu solicitud');
    expect(r.html).toContain('Juan Pérez');
    expect(r.html).toContain('CA-2026-000123');
    expect(r.html).toContain('/solicitud');
    expect(r.text).toContain('CA-2026-000123');
  });

  it('maps category label', () => {
    const r = renderContactConfirmation(data, CTX);
    expect(r.html).toContain('Mantenimiento');
  });

  it('escapes user-controlled fields', () => {
    const r = renderContactConfirmation(
      { ...data, name: '<script>alert(1)</script>', folio: 'CA-<b>', category: 'general' },
      CTX,
    );
    expect(r.html).not.toContain('<script>');
    expect(r.html).toContain('&lt;script&gt;');
  });
});

describe('email/templates - admin notification', () => {
  const data = {
    name: 'Ana López',
    email: 'ana@example.com',
    phone: '5512345678',
    building: 'B02',
    apartment: 'D03',
    category: 'security',
    message: 'Candado de la caseta descompuesto',
    folio: 'CA-2026-000007',
  };

  it('includes requester details and message', () => {
    const r = renderContactAdminNotification(data, CTX);
    expect(r.subject).toContain('CA-2026-000007');
    expect(r.subject).toContain('Seguridad');
    expect(r.html).toContain('Ana López');
    expect(r.html).toContain('ana@example.com');
    expect(r.html).toContain('B02 / D03');
    expect(r.html).toContain('Candado de la caseta descompuesto');
    expect(r.text).toContain('5512345678');
  });

  it('handles missing optional fields', () => {
    const r = renderContactAdminNotification(
      { ...data, phone: null, building: null, apartment: null },
      CTX,
    );
    expect(r.html).toContain('No proporcionado');
    expect(r.html).toContain('No especificada');
  });

  it('escapes message to avoid HTML injection', () => {
    const r = renderContactAdminNotification(
      { ...data, message: '<img src=x onerror=alert(1)>' },
      CTX,
    );
    expect(r.html).not.toContain('<img');
    expect(r.html).toContain('&lt;img');
  });
});

describe('email/templates - solicitud status change', () => {
  const data = {
    name: 'Ana López',
    folio: 'CA-2026-000007',
    status: 'RESOLVED',
    category: 'administration',
    statusUrl: 'https://comunidadalbas.com.mx/solicitud',
  };

  it('shows new status label and folio', () => {
    const r = renderSolicitudStatusChange(data, CTX);
    expect(r.subject).toContain('CA-2026-000007');
    expect(r.html).toContain('Resuelta');
    expect(r.html).toContain('CA-2026-000007');
    expect(r.text).toContain('Resuelta');
  });

  it('falls back to raw status when label missing', () => {
    const r = renderSolicitudStatusChange({ ...data, status: 'UNKNOWN' }, CTX);
    expect(r.html).toContain('UNKNOWN');
  });
});

describe('email/templates - user welcome', () => {
  it('lists roles and login link', () => {
    const r = renderUserWelcome(
      { displayName: 'María', email: 'maria@example.com', roles: ['tesorero', 'vocal'], adminUrl: 'https://comunidadalbas.com.mx/login' },
      CTX,
    );
    expect(r.subject).toContain('Bienvenido');
    expect(r.html).toContain('María');
    expect(r.html).toContain('Tesorero');
    expect(r.html).toContain('Vocal');
    expect(r.html).toContain('/login');
  });

  it('escapes display name', () => {
    const r = renderUserWelcome(
      { displayName: '<b>x</b>', email: 'x@example.com', roles: ['resident'], adminUrl: 'https://comunidadalbas.com.mx/login' },
      CTX,
    );
    expect(r.html).not.toContain('<b>x</b>');
  });
});

describe('email/templates - labels', () => {
  it('has category labels', () => {
    expect(CATEGORY_LABEL.maintenance).toBe('Mantenimiento');
    expect(CATEGORY_LABEL.security).toBe('Seguridad');
  });

  it('has status labels', () => {
    expect(SOLICITUD_STATUS_LABEL.IN_REVIEW).toBe('En revisión');
    expect(SOLICITUD_STATUS_LABEL.RESOLVED).toBe('Resuelta');
  });
});
