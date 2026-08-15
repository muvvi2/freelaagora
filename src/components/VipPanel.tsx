import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy, ArrowLeft } from 'lucide-react';
import { useApp } from '@/AppContext';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Field';
import { formatCurrency, periodLabel, getPlan, getEstPlan } from '@/utils';
import { isPaymentConfigured, getActiveProviderInfo } from '@/services/paymentService';
import type { Tier, EstTier, Period, Coupon, EstVipPlan } from '@/types';

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'WALLET';
const BILLING_OPTIONS: { id: BillingType; label: string; icon: typeof QrCode }[] = [
  { id: 'WALLET', label: 'Carteira', icon: Wallet },
  { id: 'PIX', label: 'PIX', icon: QrCode },
  { id: 'BOLETO', label: 'Boleto', icon: FileText },
  { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
];

const tierIcon: Record<Tier, typeof Crown> = { 
  free: Sparkles, vip1: Star, vip2: ShieldCheck, vip3: Diamond, vip4: Crown, vip5: Crown, vip6: Crown 
};

const tierTone: Record<Tier, string> = {
  free: 'border-neutral-200 dark:border-neutral-800',
  vip1: 'border-primary-300 dark:border-primary-500/40 shadow-sm',
  vip2: 'border-secondary-300 dark:border-secondary-500/40 shadow-sm',
  vip3: 'border-warning-300 dark:border-warning-500/40 shadow-sm',
  vip4: 'border-amber-400 dark:border-amber-500/60 shadow-md',
  vip5: 'border-purple-400 dark:border-purple-500/60 shadow-md',
  vip6: 'border-rose-400 dark:border-rose-500/60 shadow-md',
};

const estTierTone: Record<EstTier, string> = {
  free: 'border-neutral-200 dark:border-neutral-800',
  trial: 'border-accent-300 dark:border-accent-500/40 shadow-sm',
  vip1: 'border-primary-300 dark:border-primary-500/40 shadow-sm',
  vip2: 'border-secondary-300 dark:border-secondary-500/40 shadow-sm',
  vip3: 'border-warning-300 dark:border-warning-500/40 shadow-sm',
  vip4: 'border-amber-400 dark:border-amber-500/60 shadow-md',
  vip5: 'border-purple-400 dark:border-purple-500/60 shadow-md',
  vip6: 'border-rose-400 dark:border-rose-500/60 shadow-md',
};

const getTierColor = (tier: string) => {
  if (tier === 'vip6') return 'text-rose-500';
  if (tier === 'vip5') return 'text-purple-500';
  if (tier === 'vip4') return 'text-amber-500';
  if (tier === 'vip3') return 'text-warning-500';
  if (tier === 'vip2') return 'text-secondary-500';
  if (tier === 'vip1') return 'text-primary-500';
  return 'text-neutral-400';
};

export function VipPanel({ userId, accountType, onBack }: { userId: string; accountType: 'freelancer' | 'establishment'; onBack?: () => void }) {
  const { currentUser, data, setVipTier, setEstVipTier, validateCoupon, applyCouponToPurchase } = useApp();
  const { notify } = useToast();
  const [period, setPeriod] = useState<Period>('monthly');
  const [confirmTier, setConfirmTier] = useState<Tier | null>(null);
  const [confirmEstTier, setConfirmEstTier] = useState<EstTier | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('WALLET');
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);

  const currentTier: Tier = currentUser?.vipTier ?? 'free';
  const hasActiveVip = currentUser?.estVipTier && currentUser.estVipTier !== 'free' && currentUser.estVipTier !== 'trial';
  const isOnTrial = !hasActiveVip && (currentUser?.trialEndsAt ? new Date(currentUser.trialEndsAt) > new Date() : false);
  const currentEstTier: EstTier = isOnTrial ? 'trial' : (currentUser?.estVipTier ?? 'free');
  
  const vipPlansList = data?.vipPlans ?? [];
  const estVipPlansList = data?.estVipPlans ?? [];

  const currentPlan = getPlan(currentTier, vipPlansList);
  const currentEstPlan = getEstPlan(currentEstTier, estVipPlansList);

  useEffect(() => {
    window.history.replaceState(null, '', '/vip');
  }, []);

  const paymentReady = isPaymentConfigured();
  const providerInfo = getActiveProviderInfo();

  if (!currentUser || !data) return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">Carregando...</div>;

  const applyCoupon = () => {
    if (!couponCode.trim()) { setCouponError('Digite um código.'); return; }
    const c = validateCoupon(couponCode);
    if (!c.coupon) { setCouponError(c.error || 'Cupom inválido.'); setAppliedCoupon(null); return; }
    setAppliedCoupon(c.coupon); setCouponError(''); notify(`Cupom aplicado: ${c.coupon.discountPercentage}% de desconto!`);
  };

  const getPlanDetails = (planObj: any) => {
    const rawPrice = planObj.prices?.[period] ?? 0;
    
    let discountPercent = 0;
    if (period === 'monthly') discountPercent = planObj.discountMonthlyPercent ?? 0;
    else if (period === 'semestral') discountPercent = planObj.discountSemestralPercent ?? 0;
    else if (period === 'annual') discountPercent = planObj.discountAnnualPercent ?? 0;

    let originalPrice = rawPrice;
    let finalPrice = rawPrice;

    if (discountPercent > 0) {
      finalPrice = rawPrice * (1 - (discountPercent / 100));
    }

    if (appliedCoupon) {
      finalPrice = finalPrice * (1 - (appliedCoupon.discountPercentage / 100));
    }

    return {
      originalPrice: Math.round(originalPrice * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      discountPercent: discountPercent
    };
  };

  const handleEstPlanClick = (plan: EstVipPlan) => setConfirmEstTier(plan.tier);

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    const planObj = type === 'freelancer' ? getPlan(tier as Tier, vipPlansList) : getEstPlan(tier as EstTier, estVipPlansList);
    const details = getPlanDetails(planObj);
    const finalPrice = details.finalPrice;
    const userBalance = currentUser?.walletBalance ?? 0;

    if (billingType === 'WALLET') {
      if (finalPrice > 0 && userBalance < finalPrice) {
        notify(`Saldo insuficiente! Necessário: ${formatCurrency(finalPrice)}`, 'error');
        return;
      }
      if (type === 'freelancer') {
        if (appliedCoupon) applyCouponToPurchase(userId, tier as Tier, period, appliedCoupon, 'freelancer');
        else setVipTier(userId, tier as Tier, period);
      } else {
        if (appliedCoupon) applyCouponToPurchase(userId, tier as EstTier, period, appliedCoupon, 'establishment');
        else setEstVipTier(userId, tier as EstTier, period);
      }
      notify(`Plano ${planObj.label} ativado com sucesso!`);
      setConfirmTier(null);
      setConfirmEstTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button size="sm" variant="outline" onClick={onBack} className="gap-2 border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-400 to-warning-600 shadow-lg shadow-warning-500/20">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">Planos de Destaque e Assinaturas VIP</h1>
              <p className="text-sm text-neutral-400">
                {accountType === 'freelancer' ? `Plano atual: ${currentPlan.label}` : `Plano atual: ${currentEstPlan.label}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-inner w-full sm:w-auto">
              {(['monthly', 'semestral', 'annual'] as Period[]).map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition relative ${period === p ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
                >
                  {periodLabel(p)} 
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(accountType === 'freelancer' ? vipPlansList : estVipPlansList).map((plan) => {
            const details = getPlanDetails(plan);
            const active = (accountType === 'freelancer' ? currentTier : currentEstTier) === plan.tier;
            const feeDisplay = accountType === 'establishment' ? (plan.feePercent ?? (plan as any).intermediationFee ?? 15) : null;
            
            return (
              <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${active ? 'ring-2 ring-primary-500 border-primary-500' : 'border-neutral-800'}`}>
                {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
                
                {details.discountPercent > 0 && (
                  <div className="absolute -top-3.5 right-5">
                    <span className="inline-flex items-center rounded-full bg-success-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                      -{details.discountPercent}% OFF
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{plan.label}</h2>
                    {feeDisplay !== null && (
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${feeDisplay === 0 ? 'bg-success-500/20 text-success-300 border border-success-500/30' : 'bg-warning-500/20 text-warning-300 border border-warning-500/30'}`}>
                        {feeDisplay === 0 ? '0% taxa' : `${feeDisplay}% taxa`}
                      </span>
                    )}
                  </div>
                  
                  <div className="my-5">
                    {details.discountPercent > 0 && details.finalPrice !== details.originalPrice && (
                      <span className="line-through text-neutral-500 text-sm mr-2">{formatCurrency(details.originalPrice)}</span>
                    )}
                    <span className="text-3xl font-extrabold text-white">{formatCurrency(details.finalPrice)}</span>
                    {details.finalPrice > 0 && <span className="text-xs text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
                  </div>

                  <ul className="space-y-2.5 mt-4 border-t border-neutral-800 pt-4">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-300">
                        <Check className="h-4 w-4 shrink-0 text-success-500 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800">
                  {!active && plan.tier !== 'trial' ? (
                    <Button fullWidth variant="warning" onClick={() => accountType === 'freelancer' ? setConfirmTier(plan.tier as Tier) : handleEstPlanClick(plan as any)}>
                      {plan.tier === 'free' ? 'Voltar para Free' : 'Assinar'}
                    </Button>
                  ) : (
                    <p className="text-primary-500 font-bold text-center py-2">Você está neste plano</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Modal open={!!confirmTier} onClose={() => setConfirmTier(null)} title="Confirmar assinatura" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmTier && handleProceedPayment(confirmTier, 'freelancer')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmTier && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">Deseja confirmar a assinatura do <strong>{getPlan(confirmTier, vipPlansList).label}</strong> ({periodLabel(period)})?</p>
              <p className="text-xs text-neutral-400">O valor será debitado da sua carteira imediatamente.</p>
            </div>
          )}
        </Modal>

        <Modal open={!!confirmEstTier} onClose={() => setConfirmEstTier(null)} title="Confirmar assinatura empresarial" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmEstTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmEstTier && handleProceedPayment(confirmEstTier, 'establishment')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmEstTier && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">Deseja confirmar a assinatura do <strong>{getEstPlan(confirmEstTier, estVipPlansList).label}</strong> ({periodLabel(period)})?</p>
              <p className="text-xs text-neutral-400">Sua nova taxa de intermediação será aplicada nas próximas contratações.</p>
            </div>
          )}
        </Modal>

        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-lg">
          <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-400"><Ticket className="h-4 w-4 text-primary-400" /> Cupom de desconto</label>
          <div className="flex gap-2">
            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="BEMVINDO10" className="flex-1 bg-neutral-950 border-neutral-800 text-white" />
            <Button size="sm" variant="outline" onClick={applyCoupon} className="border-neutral-700 text-white hover:bg-neutral-800">Aplicar</Button>
          </div>
          {couponError && <p className="mt-2 text-xs text-error-400">{couponError}</p>}
          {appliedCoupon && <p className="mt-2 text-xs text-success-400 font-semibold">Cupom {appliedCoupon.code} aplicado: {appliedCoupon.discountPercentage}% OFF</p>}
        </div>
      </div>
    </div>
  );
}
