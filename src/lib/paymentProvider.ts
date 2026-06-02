import { Charge, ChargeFormData, ProviderKind } from '@/types';

export interface PaymentProviderResult {
  provider: ProviderKind;
  providerChargeId?: string;
  paymentLink?: string;
  barcode?: string;
  pixCode?: string;
  message: string;
}

export interface PaymentProvider {
  kind: ProviderKind;
  createCharge(charge: ChargeFormData): Promise<PaymentProviderResult>;
  cancelCharge?(charge: Charge): Promise<PaymentProviderResult>;
}

const manualProvider: PaymentProvider = {
  kind: 'manual',
  async createCharge() {
    return {
      provider: 'manual',
      message: 'Cobrança manual registrada sem integração externa.',
    };
  },
};

const mockProvider: PaymentProvider = {
  kind: 'mock',
  async createCharge(charge) {
    const id = `mock_${Date.now()}`;
    return {
      provider: 'mock',
      providerChargeId: id,
      paymentLink: `https://pay.local/charges/${id}`,
      pixCode: charge.method === 'pix' ? `PIX-MOCK-${id}` : undefined,
      barcode: charge.method === 'boleto' ? `BOLETO-MOCK-${id}` : undefined,
      message: 'Cobrança mock gerada para homologação interna.',
    };
  },
};

function unavailableProvider(kind: ProviderKind): PaymentProvider {
  return {
    kind,
    async createCharge() {
      throw new Error(`Provider ${kind} ainda não configurado. Informe credenciais e implemente o adapter real.`);
    },
  };
}

export function getPaymentProvider(kind: ProviderKind): PaymentProvider {
  if (kind === 'manual') return manualProvider;
  if (kind === 'mock') return mockProvider;
  return unavailableProvider(kind);
}
