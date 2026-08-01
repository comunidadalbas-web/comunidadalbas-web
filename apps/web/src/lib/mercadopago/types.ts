export interface MercadoPagoCreateOrderParams {
  externalReference: string;
  totalAmount: string;
  payerEmail: string;
  payerName: string;
  isPilot?: boolean;
}

export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  payment_method: {
    id: string;
    type: string;
    ticket_url?: string;
    reference?: string;
  };
}

export interface MercadoPagoOrderResponse {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  total_amount: string;
  date_created?: string;
  date_expiration?: string;
  transactions: {
    payments: MercadoPagoPayment[];
  };
}

export interface CreateSpeiOrderResult {
  success: boolean;
  idempotencyKey?: string;
  orderId?: string;
  status?: string;
  statusDetail?: string;
  paymentId?: string;
  reference?: string;
  ticketUrl?: string;
  expiresAt?: string;
  error?: string;
}

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  external_reference: string;
  date_expiration?: string;
}

export interface CreateCheckoutPreferenceParams {
  externalReference: string;
  totalAmount: string;
  payerEmail: string;
  payerName: string;
  itemTitle: string;
  backUrlSuccess: string;
  backUrlFailure: string;
  backUrlPending: string;
  isPilot?: boolean;
}

export interface CreateCheckoutPreferenceResult {
  success: boolean;
  idempotencyKey?: string;
  preferenceId?: string;
  initPoint?: string;
  externalReference?: string;
  error?: string;
}

export interface MercadoPagoPaymentStatusResponse {
  id: number;
  status: string;
  status_detail: string;
  external_reference?: string;
  date_approved?: string;
  date_created?: string;
  transaction_amount?: number;
}

export interface GetPaymentStatusResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  externalReference?: string;
  error?: string;
}
