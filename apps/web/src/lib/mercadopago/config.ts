export interface PaymentsConfig {
  enabled: boolean;
  environment: string;
  allowedEmails: string[];
  cuotaAmount: string;
  maxExtraordinaryAmount: string;
}

export function getPaymentsConfig(): PaymentsConfig {
  const env = process.env.MERCADOPAGO_ENV || 'test';
  const enabled = env === 'production' && process.env.PAYMENTS_ENABLED === 'true';
  const allowedEmails = (process.env.PAYMENTS_ALLOWED_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const cuotaAmount = process.env.PAYMENTS_CUOTA_AMOUNT || '100.00';
  const maxExtraordinaryAmount = process.env.PAYMENTS_MAX_EXTRAORDINARY || '10000.00';
  return { enabled, environment: env, allowedEmails, cuotaAmount, maxExtraordinaryAmount };
}

export function isEmailAllowed(email: string, config: PaymentsConfig): boolean {
  const normalized = email.trim().toLowerCase();
  if (config.allowedEmails.length === 0) return true;
  return config.allowedEmails.includes(normalized);
}
