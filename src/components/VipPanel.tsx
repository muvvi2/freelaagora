import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy, ArrowLeft, Users, Building2 } from 'lucide-react';
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

const SLOT_NAMES = ["Topo da Página", "Centro do Feed", "Rodapé da Página"];

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
  const { currentUser, data, setVipTier, setEstVipTier, validateCoupon, applyCouponToPurchase, updateUser } = useApp();
  const { notify } = useToast();
  const [period, setPeriod] = useState<Period>('monthly');
  const [confirmTier, setConfirmTier] = useState<Tier | null>(null);
  const [confirmEstTier, setConfirmEstTier] = useState<EstTier | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('WALLET');
  const [pixData, setPixData] = useState<{ qrCode: string; payload: string } | null>(null);

  const [selectedFreelancerSlots, setSelectedFreelancerSlots] = useState<number[]>([]);
  const [selectedEstablishmentSlots, setSelectedEstablishmentSlots] = useState<number[]>([]);

  useEffect(() => {
    const path = accountType === 'freelancer' ? '/freela' : '/estab';
    window.history.replaceState(null, '', path);
  }, [accountType]);

  const paymentReady = isPaymentConfigured();
  const providerInfo = getActiveProviderInfo();

  if (!currentUser || !data) return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">Carregando...</div>;

  const applyCoupon = () => {
    if (!couponCode.trim()) { setCouponError('Digite um código.'); return; }
    const c = validateCoupon(couponCode);
    if (!c.coupon) { setCouponError(c.error || 'Cupom inválido.'); setAppliedCoupon(null); return; }
    setAppliedCoupon(c.coupon); setCouponError(''); notify(`Cupom aplicado: ${c.coupon.discountPercentage}% de desconto!`);
  };

  const currentTier: Tier = currentUser?.vipTier ?? 'free';
  const hasActiveVip = currentUser?.estVipTier && currentUser.estVipTier !== 'free' && currentUser.estVipTier !== 'trial';
  const isOnTrial = !hasActiveVip && (currentUser?.trialEndsAt ? new Date(currentUser.trialEndsAt) > new Date() : false);
  const currentEstTier: EstTier = isOnTrial ? 'trial' : (currentUser?.estVipTier ?? 'free');
  
  const vipPlansList = data?.vipPlans ?? [];
  const estVipPlansList = data?.estVipPlans ?? [];

  const currentPlan = getPlan(currentTier, vipPlansList);
  const currentEstPlan = getEstPlan(currentEstTier, estVipPlansList);

  const calculateTotalPlanPrice = (planObj: any) => {
    let basePrice = planObj.prices[period];
    if (accountType === 'establishment' && planObj.allowAds) {
      const slotPrices = [planObj.priceSlot1 ?? 30, planObj.priceSlot2 ?? 25, planObj.priceSlot3 ?? 20];
      const freelancerCost = selectedFreelancerSlots.reduce((sum, id) => sum + (slotPrices[id - 1] || 0), 0);
      const estCost = selectedEstablishmentSlots.reduce((sum, id) => sum + (slotPrices[id - 1] || 0), 0);
      
      let adsTotal = freelancerCost + estCost;
      const totalAdsCount = selectedFreelancerSlots.length + selectedEstablishmentSlots.length;
      const hasFreelancerAds = selectedFreelancerSlots.length > 0;
      const hasEstablishmentAds = selectedEstablishmentSlots.length > 0;

      if (totalAdsCount >= 3 || (hasFreelancerAds && hasEstablishmentAds)) {
        adsTotal *= 0.80;
      } else if (totalAdsCount === 2) {
        adsTotal *= 0.90;
      }

      basePrice += adsTotal;
    }

    return appliedCoupon ? Math.round(basePrice * (1 - appliedCoupon.discountPercentage / 100) * 100) / 100 : basePrice;
  };

  const handleEstPlanClick = (plan: EstVipPlan) => {
    // Se for o plano de teste, libera direto sem checagem de slots
    if (plan.tier === 'trial') {
      setConfirmEstTier(plan.tier);
      return;
    }
    
    // Se o plano permite anúncios, obriga a seleção de ao menos um slot
    if (plan.allowAds) {
      const totalSelected = selectedFreelancerSlots.length + selectedEstablishmentSlots.length;
      if (totalSelected === 0) {
        notify('Este plano inclui anúncios. Por favor, selecione ao menos uma posição (slot) acima antes de prosseguir.', 'error');
        return;
      }
      if (plan.maxAds && totalSelected > plan.maxAds) {
        notify(`O plano ${plan.label} permite no máximo ${plan.maxAds} anúncio(s). Você selecionou ${totalSelected}.`, 'error');
        return;
      }
    }
    setConfirmEstTier(plan.tier);
  };

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    const planObj = type === 'freelancer' ? getPlan(tier as Tier, vipPlansList) : getEstPlan(tier as EstTier, estVipPlansList);
    const finalPrice = calculateTotalPlanPrice(planObj);
    const userBalance = currentUser?.walletBalance ?? 0;

    const adPermissionsConfig = {
      includeHomeAd: false,
      includeFreelancerAd: selectedFreelancerSlots.length > 0,
      includeEstablishmentAd: selectedEstablishmentSlots.length > 0,
      allowedFreelancerSlots: selectedFreelancerSlots,
      allowedEstablishmentSlots: selectedEstablishmentSlots,
    };

    if (billingType === 'WALLET') {
      if (finalPrice > 0 && userBalance < finalPrice) {
        notify(`Saldo insuficiente na carteira! Necessário: ${formatCurrency(finalPrice)} (Disponível: ${formatCurrency(userBalance)})`, 'error');
        return;
      }

      if (type === 'freelancer') {
        const t = tier as Tier;
        if (appliedCoupon) {
          applyCouponToPurchase(userId, t, period, appliedCoupon, 'freelancer');
        } else {
          setVipTier(userId, t, period);
        }
        notify(`Plano ${getPlan(t, vipPlansList).label} ativado com sucesso!`);
      } else {
        const et = tier as EstTier;
        if (appliedCoupon) {
          applyCouponToPurchase(userId, et, period, appliedCoupon, 'establishment');
        } else {
          setEstVipTier(userId, et, period);
        }
        updateUser(userId, adPermissionsConfig);
        notify(`Plano ${getEstPlan(et, estVipPlansList).label} ativado com sucesso!`);
      }
      setConfirmTier(null);
      setConfirmEstTier(null);
    } else {
      // ... (manter lógica de gateway existente)
      try {
        const supabaseUrl = supabase.supabaseUrl;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || supabase.supabaseKey;

        const rawDocument = accountType === 'establishment' ? (currentUser?.cnpj || '') : (currentUser?.cpf || currentUser?.cpfCnpj || '');
        const cleanDocument = rawDocument.replace(/\D/g, '');
        const validCpfCnpj = (cleanDocument.length === 11 || cleanDocument.length === 14) ? cleanDocument : '47690623000';

        const res = await fetch(`${supabaseUrl}/functions/v1/asaas-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'payment',
            billingType: billingType,
            value: finalPrice,
            description: `Assinatura ${planObj.label} (${periodLabel(period)})`,
            customerName: currentUser?.name || 'Cliente',
            customerEmail: currentUser?.email || 'cliente@exemplo.com',
            customerCpfCnpj: validCpfCnpj,
            externalReference: userId
          })
        });

        const rawText = await res.text();
        let responseData;
        try {
          responseData = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`A Edge Function retornou resposta inválida (Status ${res.status}): ${rawText.substring(0, 100)}...`);
        }

        if (!res.ok || responseData.error) {
          throw new Error(responseData?.error || 'Erro ao comunicar com o gateway de pagamento.');
        }

        if (billingType === 'PIX') {
          if (!responseData.pixQrCode && !responseData.pixCopyPaste) {
            throw new Error('A API não retornou os dados do QR Code Pix.');
          }
          setPixData({
            qrCode: responseData.pixQrCode ? `data:image/png;base64,${responseData.pixQrCode}` : '',
            payload: responseData.pixCopyPaste || ''
          });
          notify('Cobrança PIX gerada com sucesso! Escaneie o QR Code.');
        } else if (billingType === 'BOLETO' || billingType === 'CREDIT_CARD') {
          notify('Cobrança gerada com sucesso! Redirecionando...');
          if (responseData.invoiceUrl) {
            window.open(responseData.invoiceUrl, '_blank');
          }
        }
      } catch (err: any) {
        console.error("Erro no pagamento:", err);
        notify(err.message || 'Erro ao processar pagamento.', 'error');
        return;
      }

      setConfirmTier(null);
      setConfirmEstTier(null);
    }

    setAppliedCoupon(null);
    setCouponCode('');
  };

  const toggleSlotSelection = (page: 'freelancers' | 'establishments', slotNumber: number) => {
    if (page === 'freelancers') {
      setSelectedFreelancerSlots(prev => 
        prev.includes(slotNumber) ? prev.filter(s => s !== slotNumber) : [...prev, slotNumber].sort()
      );
    } else {
      setSelectedEstablishmentSlots(prev => 
        prev.includes(slotNumber) ? prev.filter(s => s !== slotNumber) : [...prev, slotNumber].sort()
      );
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
                {isOnTrial ? ' (Em período de Teste Gratuito)' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-inner">
            {(['monthly', 'semestral', 'annual'] as Period[]).map((p) => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${period === p ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
              >
                {periodLabel(p)} {p !== 'monthly' && <span className="block text-[10px] text-success-400 font-bold uppercase tracking-wider">economize</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Seleção de anúncios SEMPRE visível para estabelecimentos */}
        {accountType === 'establishment' && (
          <div className="rounded-2xl border border-amber-500/30 bg-neutral-900 p-6 shadow-lg space-y-6">
            <div>
              <h3 className="font-display text-base font-bold text-white mb-1 flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" /> Seleção de Posicionamento e Banners Rotativos (600x900px)
              </h3>
              <p className="text-xs text-neutral-400">
                Os banners rotacionam automaticamente nas páginas a cada 4 segundos. Escolha em quais posições deseja aparecer. <span className="text-success-400 font-bold">Descontos: Ambas as páginas ou 3+ anúncios = 20% OFF | 2 anúncios na mesma página = 10% OFF!</span>
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-400" /> Página de Freelancers
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {[1, 2, 3].map((slotNum) => {
                    const isSelected = selectedFreelancerSlots.includes(slotNum);
                    const slotPrice = estVipPlansList[0]?.priceSlot1 ?? 30; // Preço base para referência visual
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        onClick={() => toggleSlotSelection('freelancers', slotNum)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-between ${isSelected ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        <span>{SLOT_NAMES[slotNum - 1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" /> Página de Estabelecimentos
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {[1, 2, 3].map((slotNum) => {
                    const isSelected = selectedEstablishmentSlots.includes(slotNum);
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        onClick={() => toggleSlotSelection('establishments', slotNum)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-between ${isSelected ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        <span>{SLOT_NAMES[slotNum - 1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resto do componente permanece igual... */}
        {/* Renderização dos planos de freelancer ou estabelecimento */}
        {/* (Mantém o código dos cards de planos original que você já tem no arquivo) */}
      </div>
    </div>
  );
}
