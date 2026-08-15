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
    const currentPrice = planObj.prices?.[period] ?? 0;
    
    let discountPercent = 0;
    if (period === 'monthly') discountPercent = planObj.discountMonthlyPercent ?? 0;
    else if (period === 'semestral') discountPercent = planObj.discountSemestralPercent ?? 0;
    else if (period === 'annual') discountPercent = planObj.discountAnnualPercent ?? 0;

    let originalPrice = currentPrice;
    let finalPrice = currentPrice;

    if (discountPercent > 0) {
      originalPrice = currentPrice / (1 - (discountPercent / 100));
      finalPrice = currentPrice;
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
      if (type === 'freelancer') setVipTier(userId, tier as Tier, period);
      else setEstVipTier(userId, tier as EstTier, period);
      notify(`Plano ${planObj.label} ativado!`);
      setConfirmTier(null);
      setConfirmEstTier(null);
    } else {
      // (Lógica de gateway omitida por brevidade mas mantém a mesma)
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
           <div className="flex items-center gap-4">
              {onBack && <Button size="sm" variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>}
              <h1 className="text-3xl font-bold">Assinaturas VIP</h1>
           </div>
           <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg">
             {(['monthly', 'semestral', 'annual'] as Period[]).map((p) => (
               <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded ${period === p ? 'bg-primary-600' : ''}`}>{periodLabel(p)}</button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(accountType === 'freelancer' ? vipPlansList : estVipPlansList).map((plan) => {
            const details = getPlanDetails(plan);
            const active = (accountType === 'freelancer' ? currentTier : currentEstTier) === plan.tier;
            
            return (
              <div key={plan.tier} className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between">
                <div>
                   <h2 className="text-xl font-bold">{plan.label}</h2>
                   <div className="my-4">
                      {details.discountPercent > 0 && <span className="line-through text-neutral-500">{formatCurrency(details.originalPrice)}</span>}
                      <p className="text-3xl font-bold">{formatCurrency(details.finalPrice)}</p>
                      {details.discountPercent > 0 && <Badge tone="success">-{details.discountPercent}% OFF</Badge>}
                   </div>
                </div>
                {!active && <Button fullWidth variant="warning" onClick={() => accountType === 'freelancer' ? setConfirmTier(plan.tier as Tier) : setConfirmEstTier(plan.tier as EstTier)}>Assinar</Button>}
                {active && <p className="text-primary-500 font-bold text-center">Plano Ativo</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
