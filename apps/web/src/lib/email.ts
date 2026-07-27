export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailAdapter {
  send(payload: EmailPayload): Promise<{ success: boolean; error?: string }>;
}

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'contacto@comunidadalbas.com.mx',
};

export function createEmailAdapter(): EmailAdapter {
  if (!smtpConfig.user || !smtpConfig.pass) {
    return {
      async send(_payload: EmailPayload) {
        return { success: false, error: 'SMTP not configured' };
      },
    };
  }

  return {
    async send(payload: EmailPayload) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: { user: smtpConfig.user, pass: smtpConfig.pass },
        });
        await transporter.sendMail({
          from: smtpConfig.from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('SMTP send error:', message);
        return { success: false, error: message };
      }
    },
  };
}
