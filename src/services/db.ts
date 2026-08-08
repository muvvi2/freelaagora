import { supabase } from '@/lib/supabase';
import { CATEGORIES, VIP_PLANS, EST_VIP_PLANS } from '@/mockData';
import { emptyAvailability, fullAvailability } from '@/mockData';
import type {
  User, Job, Contract, WalletTx, AppNotification, Review,
  AppData, WeekAvailability, DateAvailability, DayKey, Tier, EstTier,
  PaymentSettings, PaymentProviderId, PaymentProviderConfig, VipPlan, EstVipPlan,
} from '@/types';

// Mapeamento fixo para alinhar com os IDs do SEU Supabase
const FL_TIER_ID_MAP: Record<string, number> = { free: 1, vip1: 2, vip2: 3, vip3: 4, vip4: 5, vip5: 6, vip6: 7 };
const ES_TIER_ID_MAP: Record<string, number> = { free: 4, trial: 11, vip1: 5, vip2: 6, vip3: 7, vip4: 8, vip5: 9, vip6: 10 };

// Função para converter tier do App para ID do Banco (para salvar/deletar)
function tierToId(tier: string, isEst: boolean): number {
  return isEst ? (ES_TIER_ID_MAP[tier] ?? 4) : (FL_TIER_ID_MAP[tier] ?? 1);
}

// Função inversa para converter ID do Banco para Tier do App (para carregar)
function idToTier(id: number, isEst: boolean): string {
  if (isEst) {
    const map: Record<number, string> = { 4: 'free', 11: 'trial', 5: 'vip1', 6: 'vip2', 7: 'vip3', 8: 'vip4', 9: 'vip5', 10: 'vip6' };
    return map[id] || 'free';
  } else {
    const map: Record<number, string> = { 1: 'free', 2: 'vip1', 3: 'vip2', 4: 'vip3', 5: 'vip4', 6: 'vip5', 7: 'vip6' };
    return map[id] || 'free';
  }
}

// ... (Mantenha as interfaces DbUser, DbFreelancerProfile, etc., iguais) ...

// [COLE AQUI TODAS AS SUAS INTERFACES DbUser, DbFreelancerProfile, etc., e funções map... do seu arquivo original]

// ============================================================
// VIP PLANS DB OPERATIONS (CORRIGIDO)
// ============================================================
export async function dbUpsertVipPlan(plan: VipPlan): Promise<void> {
  const planId = tierToId(plan.tier, false);
  const { error } = await supabase.from('vip_plans_freelancer').upsert({
    id: planId,
    name: plan.label,
    max_categories: plan.maxCategories,
    monthly_price: plan.prices.monthly,
    semestral_price: plan.prices.semestral,
    annual_price: plan.prices.annual,
  } as never, { onConflict: 'id' });
  if (error) console.error('Erro ao salvar plano freelancer:', error.message);
}

export async function dbDeleteVipPlan(tier: Tier): Promise<void> {
  const planId = tierToId(tier, false);
  await supabase.from('vip_plans_freelancer').delete().eq('id', planId);
}

export async function dbUpsertEstVipPlan(plan: EstVipPlan): Promise<void> {
  const planId = tierToId(plan.tier, true);
  const { error } = await supabase.from('vip_plans_establishment').upsert({
    id: planId,
    name: plan.label,
    intermediation_fee_percentage: plan.intermediationFee,
    monthly_price: plan.prices.monthly,
    semestral_price: plan.prices.semestral,
    annual_price: plan.prices.annual,
  } as never, { onConflict: 'id' });
  if (error) console.error('Erro ao salvar plano de estabelecimento:', error.message);
}

export async function dbDeleteEstVipPlan(tier: EstTier): Promise<void> {
  const planId = tierToId(tier, true);
  await supabase.from('vip_plans_establishment').delete().eq('id', planId);
}

// ============================================================
// LOAD ALL DATA (CORRIGIDO PARA LER DO BANCO)
// ============================================================
export async function loadAllData(): Promise<AppData> {
  const [
    usersRes, flProfilesRes, esProfilesRes, flCategoriesRes, flAvailRes,
    contractsRes, eventsRes, contractReviewsRes, walletRes, notifRes,
    jobsRes, applicantsRes, couponsRes, auditRes, configRes, paymentRes,
    vipFlRes, vipEsRes,
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('freelancer_profiles').select('*'),
    supabase.from('establishment_profiles').select('*'),
    supabase.from('freelancer_categories').select('*'),
    supabase.from('freelancer_availability').select('*'),
    supabase.from('contracts').select('*'),
    supabase.from('contract_events').select('*'),
    supabase.from('contract_reviews').select('*'),
    supabase.from('wallet_transactions').select('*'),
    supabase.from('notifications').select('*'),
    supabase.from('jobs').select('*'),
    supabase.from('job_applicants').select('*'),
    supabase.from('discount_coupons').select('*'),
    supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('platform_config').select('*').limit(1).maybeSingle(),
    supabase.from('payment_settings').select('*').limit(1).maybeSingle(),
    supabase.from('vip_plans_freelancer').select('*'),
    supabase.from('vip_plans_establishment').select('*'),
  ]);

  // ... (mantenha todo o mapeamento de users, contracts, jobs, etc., igual ao seu original) ...
  // [COLE AQUI A LÓGICA DE MAPEAMENTO DE DADOS QUE JÁ ESTAVA NO SEU ARQUIVO]

  // Carregamento dos Planos VIP (A MÁGICA ACONTECE AQUI)
  const vipPlans: VipPlan[] = (vipFlRes.data || []).map((p: any) => ({
    tier: idToTier(p.id, false) as Tier,
    label: p.name,
    maxCategories: p.max_categories || 5,
    prices: { monthly: p.monthly_price, semestral: p.semestral_price, annual: p.annual_price },
    features: ['Plano carregado do banco']
  }));

  const estVipPlans: EstVipPlan[] = (vipEsRes.data || []).map((p: any) => ({
    tier: idToTier(p.id, true) as EstTier,
    label: p.name,
    intermediationFee: p.intermediation_fee_percentage,
    maxActiveJobs: 999,
    allowAds: true,
    prices: { monthly: p.monthly_price, semestral: p.semestral_price, annual: p.annual_price },
    features: ['Plano carregado do banco']
  }));

  return {
    users, jobs, contracts, walletTxs, notifications, reviews, coupons, adminAuditLogs,
    config: { defaultFeePercent: configRes.data?.default_fee_percent || 15 },
    paymentSettings,
    currentUserId: null,
    vipPlans: vipPlans.length > 0 ? vipPlans : VIP_PLANS, // Fallback se o banco estiver vazio
    estVipPlans: estVipPlans.length > 0 ? estVipPlans : EST_VIP_PLANS,
  };
}

// ... [COLE O RESTANTE DAS FUNÇÕES DE OPERAÇÃO DE USUÁRIO/JOB/ETC]
