export interface MercadoPagoCreateOrderParams {
  externalReference: string;
  totalAmount: string;
  payerEmail: string;
  payerName: string;
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
  transactions: {
    payments: MercadoPagoPayment[];
  };
}

export interface CreateSpeiOrderResult {
  success: boolean;
  orderId?: string;
  status?: string;
  statusDetail?: string;
  paymentId?: string;
  reference?: string;
  ticketUrl?: string;
  error?: string;
}
