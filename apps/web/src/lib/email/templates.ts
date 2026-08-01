const DEFAULT_SITE_NAME = 'Comunidad Albas';
const DEFAULT_SITE_URL = 'https://comunidadalbas.com.mx';

export interface TemplateContext {
  siteName: string;
  siteUrl: string;
}

export function defaultTemplateContext(): TemplateContext {
  return {
    siteName: process.env.SITE_NAME || DEFAULT_SITE_NAME,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
  };
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const CATEGORY_LABEL: Record<string, string> = {
  general: 'Consulta general',
  administration: 'Administración',
  maintenance: 'Mantenimiento',
  security: 'Seguridad',
  suggestion: 'Sugerencia',
  other: 'Otro',
};

export const SOLICITUD_STATUS_LABEL: Record<string, string> = {
  NEW: 'Recibida',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resuelta',
  ARCHIVED: 'Archivada',
};

export function layout(title: string, bodyHtml: string, ctx: TemplateContext): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background-color:#1a4a7a;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.02em;">${escapeHtml(ctx.siteName)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">
                  ${escapeHtml(ctx.siteName)} — ${escapeHtml(ctx.siteUrl)}<br />
                  Este es un correo automático, por favor no respondas a este mensaje.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function textWrap(bodyText: string, ctx: TemplateContext): string {
  return [
    ctx.siteName,
    '--------------------------------',
    bodyText,
    '--------------------------------',
    ctx.siteUrl,
  ].join('\n');
}

export interface ContactConfirmationData {
  name: string;
  folio: string;
  category: string;
  statusUrl: string;
}

export function renderContactConfirmation(
  data: ContactConfirmationData,
  ctx: TemplateContext = defaultTemplateContext(),
): { subject: string; html: string; text: string } {
  const category = CATEGORY_LABEL[data.category] || data.category;
  const subject = 'Recibimos tu solicitud — Comunidad Albas';
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;font-size:18px;">Hola, ${escapeHtml(data.name)}</h2>
     <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
       Hemos recibido correctamente tu solicitud de tipo <strong>${escapeHtml(category)}</strong>.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f3f7fb;border-radius:6px;padding:16px 20px;margin:0 0 16px;">
       <tr>
         <td style="font-size:12px;color:#6b7280;padding-right:16px;">Tu folio de seguimiento:</td>
         <td style="font-size:16px;font-weight:bold;color:#1a4a7a;letter-spacing:0.04em;">${escapeHtml(data.folio)}</td>
       </tr>
     </table>
     <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
       Guárdalo. Puedes consultar el estado de tu solicitud en cualquier momento:
     </p>
     <p style="margin:0;">
       <a href="${escapeHtml(data.statusUrl)}" style="display:inline-block;background-color:#1a4a7a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;">Consultar estado</a>
     </p>`,
    ctx,
  );
  return {
    subject,
    html,
    text: textWrap(
      [
        `Hola, ${data.name}`,
        '',
        `Recibimos tu solicitud de tipo ${category}.`,
        `Tu folio de seguimiento es: ${data.folio}`,
        '',
        `Puedes consultar el estado en: ${data.statusUrl}`,
      ].join('\n'),
      ctx,
    ),
  };
}

export interface ContactAdminNotificationData {
  name: string;
  email: string;
  phone: string | null;
  building: string | null;
  apartment: string | null;
  category: string;
  message: string;
  folio: string | null;
}

export function renderContactAdminNotification(
  data: ContactAdminNotificationData,
  ctx: TemplateContext = defaultTemplateContext(),
): { subject: string; html: string; text: string } {
  const category = CATEGORY_LABEL[data.category] || data.category;
  const subject = `Nueva solicitud ${data.folio ? data.folio + ' ' : ''}— ${category}`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;font-size:18px;">Nueva solicitud de contacto</h2>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;">
       <tr>
         <td style="padding:6px 0;color:#6b7280;width:140px;">Nombre</td>
         <td style="padding:6px 0;"><strong>${escapeHtml(data.name)}</strong></td>
       </tr>
       <tr>
         <td style="padding:6px 0;color:#6b7280;">Correo</td>
         <td style="padding:6px 0;">${escapeHtml(data.email)}</td>
       </tr>
       <tr>
         <td style="padding:6px 0;color:#6b7280;">Teléfono</td>
         <td style="padding:6px 0;">${escapeHtml(data.phone || 'No proporcionado')}</td>
       </tr>
       <tr>
         <td style="padding:6px 0;color:#6b7280;">Unidad</td>
         <td style="padding:6px 0;">${escapeHtml([data.building, data.apartment].filter(Boolean).join(' / ') || 'No especificada')}</td>
       </tr>
       <tr>
         <td style="padding:6px 0;color:#6b7280;">Categoría</td>
         <td style="padding:6px 0;">${escapeHtml(category)}</td>
       </tr>
       <tr>
         <td style="padding:6px 0;color:#6b7280;">Folio</td>
         <td style="padding:6px 0;"><strong>${escapeHtml(data.folio || '—')}</strong></td>
       </tr>
     </table>
     <p style="margin:16px 0 8px;font-size:12px;color:#6b7280;">Mensaje:</p>
     <p style="margin:0;padding:12px 16px;background-color:#f9fafb;border-radius:6px;font-size:14px;line-height:1.6;">${escapeHtml(data.message)}</p>`,
    ctx,
  );
  return {
    subject,
    html,
    text: textWrap(
      [
        `Nueva solicitud de ${data.name} <${data.email}>`,
        `Folio: ${data.folio || '—'}`,
        `Teléfono: ${data.phone || 'No proporcionado'}`,
        `Unidad: ${[data.building, data.apartment].filter(Boolean).join(' / ') || 'No especificada'}`,
        `Categoría: ${category}`,
        '',
        'Mensaje:',
        data.message,
      ].join('\n'),
      ctx,
    ),
  };
}

export interface UserWelcomeData {
  displayName: string;
  email: string;
  roles: string[];
  adminUrl: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  director: 'Director',
  tesorero: 'Tesorero',
  secretario: 'Secretario',
  vocal: 'Vocal',
  resident: 'Residente',
};

export function renderUserWelcome(
  data: UserWelcomeData,
  ctx: TemplateContext = defaultTemplateContext(),
): { subject: string; html: string; text: string } {
  const subject = 'Bienvenido al portal — Comunidad Albas';
  const roleLabels = data.roles.map((r) => ROLE_LABEL[r] || r).join(', ');
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;font-size:18px;">Hola, ${escapeHtml(data.displayName)}</h2>
     <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
       Te damos la bienvenida al portal de administración de ${escapeHtml(ctx.siteName)}.
       Se ha creado una cuenta para ti con el correo <strong>${escapeHtml(data.email)}</strong>.
     </p>
     <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
       Tus roles asignados: <strong>${escapeHtml(roleLabels)}</strong>.
     </p>
     <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
       Tu contraseña la define la administración. Si no la conoces, solicítala al administrador.
     </p>
     <p style="margin:0;">
       <a href="${escapeHtml(data.adminUrl)}" style="display:inline-block;background-color:#1a4a7a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;">Entrar al portal</a>
     </p>`,
    ctx,
  );
  return {
    subject,
    html,
    text: textWrap(
      [
        `Hola, ${data.displayName}`,
        '',
        `Te damos la bienvenida al portal de administración de ${ctx.siteName}.`,
        `Cuenta creada con el correo: ${data.email}`,
        `Roles asignados: ${roleLabels}`,
        '',
        `Tu contraseña la define la administración.`,
        `Portal: ${data.adminUrl}`,
      ].join('\n'),
      ctx,
    ),
  };
}

export interface SolicitudStatusData {
  name: string;
  folio: string;
  status: string;
  category: string;
  statusUrl: string;
}

export function renderSolicitudStatusChange(
  data: SolicitudStatusData,
  ctx: TemplateContext = defaultTemplateContext(),
): { subject: string; html: string; text: string } {
  const statusLabel = SOLICITUD_STATUS_LABEL[data.status] || data.status;
  const category = CATEGORY_LABEL[data.category] || data.category;
  const subject = `Actualización de tu solicitud ${data.folio} — Comunidad Albas`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;font-size:18px;">Hola, ${escapeHtml(data.name)}</h2>
     <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
       Tu solicitud <strong>${escapeHtml(data.folio)}</strong> (${escapeHtml(category)}) cambió de estado:
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f3f7fb;border-radius:6px;padding:16px 20px;margin:0 0 20px;">
       <tr>
         <td style="font-size:12px;color:#6b7280;padding-right:16px;">Estado actual:</td>
         <td style="font-size:16px;font-weight:bold;color:#1a4a7a;">${escapeHtml(statusLabel)}</td>
       </tr>
     </table>
     <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">
       Consulta los detalles de tu solicitud en cualquier momento:
     </p>
     <p style="margin:0;">
       <a href="${escapeHtml(data.statusUrl)}" style="display:inline-block;background-color:#1a4a7a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;">Ver mi solicitud</a>
     </p>`,
    ctx,
  );
  return {
    subject,
    html,
    text: textWrap(
      [
        `Hola, ${data.name}`,
        '',
        `Tu solicitud ${data.folio} (${category}) ahora está: ${statusLabel}`,
        '',
        `Consulta los detalles en: ${data.statusUrl}`,
      ].join('\n'),
      ctx,
    ),
  };
}
