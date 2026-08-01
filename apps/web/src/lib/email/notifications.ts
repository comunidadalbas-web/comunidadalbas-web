import { createEmailAdapter } from '@/lib/email';
import {
  renderContactConfirmation,
  renderContactAdminNotification,
  renderSolicitudStatusChange,
  renderUserWelcome,
} from '@/lib/email/templates';

function statusUrl(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comunidadalbas.com.mx'}/solicitud`;
}

function adminUrl(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://comunidadalbas.com.mx'}/login`;
}

export async function sendContactConfirmation(params: {
  to: string;
  name: string;
  folio: string;
  category: string;
}): Promise<{ success: boolean; error?: string }> {
  const email = createEmailAdapter();
  const rendered = renderContactConfirmation({
    name: params.name,
    folio: params.folio,
    category: params.category,
    statusUrl: statusUrl(),
  });
  return email.send({
    to: params.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}

export async function sendContactAdminNotification(params: {
  to: string;
  name: string;
  email: string;
  phone: string | null;
  building: string | null;
  apartment: string | null;
  category: string;
  message: string;
  folio: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const email = createEmailAdapter();
  const rendered = renderContactAdminNotification(params);
  return email.send({
    to: params.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}

export async function sendSolicitudStatusChange(params: {
  to: string;
  name: string;
  folio: string;
  status: string;
  category: string;
}): Promise<{ success: boolean; error?: string }> {
  const email = createEmailAdapter();
  const rendered = renderSolicitudStatusChange({
    name: params.name,
    folio: params.folio,
    status: params.status,
    category: params.category,
    statusUrl: statusUrl(),
  });
  return email.send({
    to: params.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}

export async function sendUserWelcome(params: {
  to: string;
  displayName: string;
  roles: string[];
}): Promise<{ success: boolean; error?: string }> {
  const email = createEmailAdapter();
  const rendered = renderUserWelcome({
    displayName: params.displayName,
    email: params.to,
    roles: params.roles,
    adminUrl: adminUrl(),
  });
  return email.send({
    to: params.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}
