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
    let path = '/vip';
    if (accountType === 'freelancer') path = '/freela';
    if (accountType === 'establishment') path = '/estab';
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

  const calculateTotalPlanPrice = (planObj: any) => {
    const rawPrice = planObj.prices[period];
    let basePrice = rawPrice;

    // Se o preço base não foi customizado para o período e há porcentagem de desconto do admin cadastrada:
    if (period === 'semestral' && (planObj.discountSemestralPercent ?? 0) > 0) {
      const monthlyPrice = planObj.prices.monthly || (rawPrice / 6);
      const totalWithoutDiscount = monthlyPrice * 6;
      basePrice = totalWithoutDiscount * (1 - planObj.discountSemestralPercent / 100);
    } else if (period === 'annual' && (planObj.discountAnnualPercent ?? 0) > 0) {
      const monthlyPrice = planObj.prices.monthly || (rawPrice / 12);
      const totalWithoutDiscount = monthlyPrice * 12;
      basePrice = totalWithoutDiscount * (1 - planObj.discountAnnualPercent / 100);
    }

    return appliedCoupon ? Math.round(basePrice * (1 - appliedCoupon.discountPercentage / 100) * 100) / 100 : Math.round(basePrice * 100) / 100;
  };

  const handleEstPlanClick = (plan: EstVipPlan) => {
    setConfirmEstTier(plan.tier);
  };

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    const planObj = type === 'freelancer' ? getPlan(tier as Tier, vipPlansList) : getEstPlan(tier as EstTier, estVipPlansList);
    const finalPrice = calculateTotalPlanPrice(planObj);
    const userBalance = currentUser?.walletBalance ?? 0;

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
        notify(`Plano ${getEstPlan(et, estVipPlansList).label} ativado com sucesso!`);
      }
      setConfirmTier(null);
      setConfirmEstTier(null);
    } else {
      try {
        const supabaseUrl = supabase.supabaseUrl;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || supabase.supabaseKey;

        const rawDocument = accountType === 'establishment' ? (currentUser?.cnpj || '') : (currentUser?.cpf || currentUser?.cpfCnpj || '');
        const cleanDocument = rawDocument.replace(/\D/g, '');

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
            customerCpfCnpj: cleanDocument || undefined,
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
          throw new Error(responseData?.error?.message || responseData?.error || 'Erro ao comunicar com o gateway de pagamento.');
        }

        if (billingType === 'PIX') {
          const qrCodeBase64 = responseData.pixQrCode || responseData.pix?.encodedImage;
          const payloadCopyPaste = responseData.pixCopyPaste || responseData.pix?.payload;

          if (!qrCodeBase64 && !payloadCopyPaste) {
            throw new Error('A API não retornou os dados do QR Code Pix.');
          }

          setPixData({
            qrCode: qrCodeBase64 ? (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`) : '',
            payload: payloadCopyPaste || ''
          });
          notify('Cobrança PIX gerada com sucesso! Escaneie o QR Code.');
        } else if (billingType === 'BOLETO' || billingType === 'CREDIT_CARD') {
          notify('Cobrança gerada com sucesso! Redirecionando...');
          const redirectUrl = responseData.invoiceUrl || responseData.payment?.bankSlipUrl || responseData.payment?.invoiceUrl;
          if (redirectUrl) {
            window.open(redirectUrl, '_blank');
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

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5 shadow-inner w-full sm:w-auto">
              {(['monthly', 'semestral', 'annual'] as Period[]).map((p) => {
                const discountTag = p === 'semestral' ? estVipPlansList[1]?.discountSemestralPercent : p === 'annual' ? estVipPlansList[1]?.discountAnnualPercent : 0;
                return (
                  <button 
                    key={p} 
                    onClick={() => setPeriod(p)} 
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition relative ${period === p ? 'bg-primary-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
                  >
                    {periodLabel(p)} 
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tag informativa de desconto ativo no período selecionado */}
        {period !== 'monthly' && (
          <div className="flex items-center gap-2 rounded-xl bg-primary-500/10 border border-primary-500/30 px-4 py-2 text-xs text-primary-300">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <span>Exibindo valores para o plano <strong>{periodLabel(period)}</strong> com descontos promocionais aplicados automaticamente.</span>
          </div>
        )}

        {accountType === 'freelancer' ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {vipPlansList.map((plan) => {
              const Icon = tierIcon[plan.tier]; 
              const active = currentTier === plan.tier; 
              const finalPlanPrice = calculateTotalPlanPrice(plan);
              const planDiscount = period === 'semestral' ? plan.discountSemestralPercent : period === 'annual' ? plan.discountAnnualPercent : 0;

              return (
                <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${tierTone[plan.tier]} ${active ? 'ring-2 ring-primary-500 bg-neutral-900/90' : 'hover:border-neutral-700'}`}>
                  {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
                  {period !== 'monthly' && (planDiscount ?? 0) > 0 && (
                    <div className="absolute -top-3.5 right-5">
                      <span className="inline-flex items-center rounded-full bg-success-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                        -{planDiscount}% OFF
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700">
                        <Icon className={`h-6 w-6 ${getTierColor(plan.tier)}`} />
                      </div>
                      <div>
                        <span className="font-display text-lg font-bold text-white">{plan.label}</span>
                        <p className="text-xs uppercase tracking-wider text-neutral-400">{plan.tier}</p>
                      </div>
                    </div>
                    <div className="my-5">
                      <span className="font-display text-4xl font-extrabold text-white">
                        {finalPlanPrice === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-2 text-base text-neutral-500 line-through">{formatCurrency(plan.prices[period])}</span>}{formatCurrency(finalPlanPrice)}</>}
                      </span>
                      {finalPlanPrice > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
                    </div>
                    <ul className="space-y-3 border-t border-neutral-800 pt-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-400" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-6">
                    {!active && (
                      <Button fullWidth size="lg" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => setConfirmTier(plan.tier)}>
                        {plan.tier === 'free' ? 'Voltar para Free' : 'Assinar Plano'}
                      </Button>
                    )}
                    {active && <p className="text-center text-sm font-bold text-primary-400 py-3">Você está neste plano</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary-950/50 p-4 border border-secondary-500/30 text-secondary-200">
              <Percent className="h-6 w-6 shrink-0 text-secondary-400" />
              <p className="text-sm">
                O seu plano empresarial define a <strong>taxa de intermediação</strong> cobrada em cada contrato. Quanto mais avançado o plano, menor é a taxa retida pela plataforma.
              </p>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              {estVipPlansList.map((plan) => {
                const active = currentEstTier === plan.tier; 
                const finalPlanPrice = calculateTotalPlanPrice(plan);
                const feeDisplay = plan.feePercent ?? (plan as any).intermediationFee ?? 15;
                const planDiscount = period === 'semestral' ? plan.discountSemestralPercent : period === 'annual' ? plan.discountAnnualPercent : 0;

                return (
                  <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${estTierTone[plan.tier]} ${active ? 'ring-2 ring-primary-500 bg-neutral-900/90' : 'hover:border-neutral-700'}`}>
                    {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
                    {period !== 'monthly' && (planDiscount ?? 0) > 0 && (
                      <div className="absolute -top-3.5 right-5">
                        <span className="inline-flex items-center rounded-full bg-success-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                          -{planDiscount}% OFF
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Store className={`h-5 w-5 ${getTierColor(plan.tier)}`} />
                          <span className="font-display text-base font-bold text-white">{plan.label}</span>
                        </div>
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${feeDisplay === 0 ? 'bg-success-500/20 text-success-300 border border-success-500/30' : 'bg-warning-500/20 text-warning-300 border border-warning-500/30'}`}>
                          {feeDisplay === 0 ? '0% taxa' : `${feeDisplay}% taxa`}
                        </span>
                      </div>

                      <div className="my-5">
                        <span className="font-display text-4xl font-extrabold text-white">
                          {finalPlanPrice === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-2 text-base text-neutral-500 line-through">{formatCurrency(plan.prices[period])}</span>}{formatCurrency(finalPlanPrice)}</>}
                        </span>
                        {finalPlanPrice > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
                      </div>

                      <ul className="space-y-3 border-t border-neutral-800 pt-5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-400" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      {!active && plan.tier !== 'trial' && (
                        <Button fullWidth size="lg" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => handleEstPlanClick(plan)}>
                          {plan.tier === 'free' ? 'Voltar para Free' : 'Assinar Plano'}
                        </Button>
                      )}
                      {active && <p className="text-center text-sm font-bold text-primary-400 py-3">Você está neste plano</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Modal open={!!confirmTier} onClose={() => setConfirmTier(null)} title="Confirmar assinatura" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmTier && handleProceedPayment(confirmTier, 'freelancer')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmTier && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10"><Crown className="h-8 w-8 text-warning-500" /><div><p className="font-bold text-neutral-900 dark:text-white">{getPlan(confirmTier, vipPlansList).label} — {periodLabel(period)}</p><p className="text-xs text-neutral-400">Total: {formatCurrency(calculateTotalPlanPrice(getPlan(confirmTier, vipPlansList)))}</p></div></div>
          <BillingTypeSelector billingType={billingType} setBillingType={setBillingType} paymentReady={paymentReady} providerLabel={providerInfo.label} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{billingType === 'WALLET' ? 'Ao confirmar, o valor será debitado da sua carteira e seu plano será ativado imediatamente.' : `Ao confirmar, você será direcionado ao pagamento via ${providerInfo.label}.`}</p></div>}
        </Modal>

        <Modal open={!!confirmEstTier} onClose={() => setConfirmEstTier(null)} title="Confirmar assinatura empresarial" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmEstTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmEstTier && handleProceedPayment(confirmEstTier, 'establishment')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmEstTier && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10"><Store className="h-8 w-8 text-warning-500" /><div><p className="font-bold text-neutral-900 dark:text-white">{getEstPlan(confirmEstTier, estVipPlansList).label} — {periodLabel(period)}</p><p className="text-xs text-neutral-400">Total: {formatCurrency(calculateTotalPlanPrice(getEstPlan(confirmEstTier, estVipPlansList)))} · Taxa: {getEstPlan(confirmEstTier, estVipPlansList).feePercent ?? (getEstPlan(confirmEstTier, estVipPlansList) as any).intermediationFee}%</p></div></div>
          <BillingTypeSelector billingType={billingType} setBillingType={setBillingType} paymentReady={paymentReady} providerLabel={providerInfo.label} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{billingType === 'WALLET' ? 'Ao confirmar, o valor será debitado da sua carteira e sua nova taxa de intermediação será aplicada nas próximas contratações.' : `Ao confirmar, você será direcionado ao pagamento via ${providerInfo.label}.`}</p></div>}
        </Modal>

        <Modal open={!!pixData} onClose={() => setPixData(null)} title="Pagamento via PIX" size="sm">
          {pixData && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Escaneie o QR Code abaixo com o aplicativo do seu banco para realizar o pagamento:</p>
              {pixData.qrCode && (
                <div className="flex justify-center">
                  <img src={pixData.qrCode} alt="QR Code PIX" className="h-48 w-48 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700" />
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-semibold text-neutral-500">Ou copie o código Pix Copia e Cola:</p>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
                  <input type="text" readOnly value={pixData.payload} className="w-full bg-transparent text-xs text-neutral-700 outline-none dark:text-neutral-300" />
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(pixData.payload);
                    notify('Chave PIX copiada para a área de transferência!');
                  }}>
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                </div>
              </div>
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

function BillingTypeSelector({ billingType, setBillingType, paymentReady, providerLabel }: { billingType: BillingType; setBillingType: (b: BillingType) => void; paymentReady: boolean; providerLabel: string }) {
  const finalOptions = paymentReady ? BILLING_OPTIONS : BILLING_OPTIONS.filter((o) => o.id === 'WALLET');
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-500">Forma de pagamento</label>
      <div className="grid grid-cols-2 gap-2">
        {finalOptions.map((opt) => {
          const Icon = opt.icon;
          const active = billingType === opt.id;
          return (
            <button key={opt.id} type="button" onClick={() => setBillingType(opt.id)} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${active ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300'}`}>
              <Icon className="h-4 w-4" /> {opt.label}
            </button>
          );
        })}
      </div>
      {!paymentReady && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning-50 p-2.5 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Pagamento via {providerLabel} não configurado. O admin precisa ativar em Painel Admin → Pagamentos. Por favor, utilize a carteira enquanto isso.</span>
        </div>
      )}
    </div>
  );
}
