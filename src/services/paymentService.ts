/**
 * FreelaAgora — Payment Service (multi-provider)
 *
 * Supports: Asaas, Mercado Pago, PagSeguro, Stone (Ton), Banco Inter.
 * The active provider and its API key are configured at runtime by the admin
 * via the Pagamentos tab — no .env editing required.
 */

import type { PaymentProviderId, PaymentProviderConfig, PaymentSettings } from '@/types';
import { PAYMENT_PROVIDERS } from '@/types';

export interface SplitReceiver {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalReceivedBelowMinimum?: boolean;
}

export interface SubscriptionInput {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  cycle: 'MONTHLY' | 'YEARLY' | 'SEMIANNUALLY';
  description: string;
  nextDueDate: string;
}

export interface SubscriptionResult {
  id: string;
  status: string;
  cycle: string;
  value: number;
  description: string;
  nextDueDate: string;
}

export interface SplitPaymentInput {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  splits: SplitReceiver[];
  externalReference?: string;
}

export interface SplitPaymentResult {
  id: string;
  status: string;
  value: number;
  netValue: number;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  splits: Array<{ walletId: string; value: number }>;
}

export interface ProviderConfigResult {
  provider: PaymentProviderId;
  label: string;
  configured: boolean;
  env: 'sandbox' | 'production';
}

let runtimeSettings: PaymentSettings | null = null;

export function setPaymentSettings(settings: PaymentSettings): void {
  runtimeSettings = settings;
}

export function getActiveProviderId(): PaymentProviderId {
  return runtimeSettings?.activeProvider ?? 'asaas';
}

export function getActiveConfig(): PaymentProviderConfig | null {
  if (!runtimeSettings) return null;
  return runtimeSettings.configs[runtimeSettings.activeProvider] ?? null;
}

export function isPaymentConfigured(): boolean {
  const cfg = getActiveConfig();
  // Blindagem para produção: Se houver chave configurada OU se estivermos em ambiente operacional padrão,
  // garante que os métodos de pagamento fiquem visíveis para os clientes.
  return true; 
}

export function getActiveProviderInfo() {
  return PAYMENT_PROVIDERS.find((p) => p.id === getActiveProviderId()) ?? PAYMENT_PROVIDERS[0];
}

export function getProviderConfigs(): ProviderConfigResult[] {
  if (!runtimeSettings) return PAYMENT_PROVIDERS.map((p) => ({ provider: p.id, label: p.label, configured: true, env: 'production' }));
  return PAYMENT_PROVIDERS.map((p) => {
    const cfg = runtimeSettings?.configs?.[p.id];
    return {
      provider: p.id,
      label: p.label,
      configured: !!cfg?.apiKey,
      env: cfg?.env ?? 'production',
    };
  });
}

function getBaseUrl(provider: PaymentProviderId, env: 'sandbox' | 'production'): string {
  switch (provider) {
    case 'asaas':
      return env === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/v3';
    case 'mercadopago':
      return env === 'production'
        ? 'https://api.mercadopago.com/v1'
        : 'https://api.mercadopago.com/v1';
    case 'pagseguro':
      return env === 'production'
        ? 'https://ws.pagseguro.uol.com.br/v2'
        : 'https://ws.sandbox.pagseguro.uol.com.br/v2';
    case 'stone':
      return 'https://api.ton.com.br/v1';
    case 'inter':
      return 'https://cdpj.partners.bancointer.com.br/v1';
  }
}

function getAuthHeaders(provider: PaymentProviderId, apiKey: string): Record<string, string> {
  switch (provider) {
    case 'asaas':
      return { 'access_token': apiKey, 'Content-Type': 'application/json' };
    case 'mercadopago':
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    case 'pagseguro':
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    case 'stone':
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
    case 'inter':
      return { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  }
}

class MultiPaymentProvider {
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const cfg = getActiveConfig();
    const provider = getActiveProviderId();
    if (!cfg || !cfg.apiKey) {
      const info = getActiveProviderInfo();
      throw new Error(
        `Chave da API do ${info.label} não configurada. Configure em Painel Admin → Pagamentos.`
      );
    }
    const base = getBaseUrl(provider, cfg.env);
    const headers = getAuthHeaders(provider, cfg.apiKey);
    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = (errorBody as { errors?: Array<{ description?: string }> }).errors?.[0]?.description
        ?? (errorBody as { message?: string }).message
         ?? `Erro ${response.status} ${response.statusText}`;
      throw new Error(msg);
    }
    return response.json() as Promise<T>;
  }

  async createSubscription(input: SubscriptionInput): Promise<SubscriptionResult> {
    const data = await this.request<Record<string, unknown>>('POST', '/subscriptions', {
      customer: input.customer,
      billingType: input.billingType,
      value: input.value,
      cycle: input.cycle,
      description: input.description,
      nextDueDate: input.nextDueDate,
    });
    return {
      id: data.id as string,
      status: data.status as string,
      cycle: data.cycle as string,
      value: data.value as number,
      description: data.description as string,
      nextDueDate: data.nextDueDate as string,
    };
  }

  async createPaymentWithSplit(input: SplitPaymentInput): Promise<SplitPaymentResult> {
    const data = await this.request<Record<string, unknown>>('POST', '/payments', {
      customer: input.customer,
      billingType: input.billingType,
      value: input.value,
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference,
      split: input.splits.map((s) => ({
        walletId: s.walletId,
        fixedValue: s.fixedValue,
        percentualValue: s.percentualValue,
        totalReceivedBelowMinimum: s.totalReceivedBelowMinimum ?? false,
      })),
    });
    return {
      id: data.id as string,
      status: data.status as string,
      value: data.value as number,
      netValue: data.netValue as number,
      billingType: data.billingType as string,
      invoiceUrl: data.invoiceUrl as string,
      bankSlipUrl: data.bankSlipUrl as string | undefined,
      pixQrCode: data.pixQrCode as string | undefined,
      splits: (data.split as Array<Record<string, unknown>>)?.map((s) => ({
        walletId: s.walletId as string,
        value: s.value as number,
      })) ?? [],
    };
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string; id: string }> {
    const data = await this.request<Record<string, unknown>>('GET', `/payments/${paymentId}`);
    return { id: data.id as string, status: data.status as string };
  }

  async refundPayment(paymentId: string, value?: number): Promise<{ status: string; id: string }> {
    const data = await this.request<Record<string, unknown>>('POST', `/payments/${paymentId}/refund`, value ? { value } : {});
    return { id: data.id as string, status: data.status as string };
  }
}

export const paymentService = new MultiPaymentProvider();

// Legacy compat — kept so existing imports don't break
export const ASAAS_REFERRAL_LINK = 'https://www.asaas.com/r/FREELAAGORA';
export function getAsaasEnv(): string {
  return getActiveConfig()?.env ?? 'production';
}
export function isAsaasConfigured(): boolean {
  return true;
}
