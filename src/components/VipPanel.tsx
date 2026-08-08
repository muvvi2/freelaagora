import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy, Upload, ArrowLeft } from 'lucide-react';
import { useApp } from '@/AppContext';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Field';
import { formatCurrency, periodLabel, getPlan, getEstPlan } from '@/utils';
import { isPaymentConfigured, getActiveProviderInfo } from '@/services/paymentService';
import type { Tier, EstTier, Period, Coupon } from '@/types';

type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'WALLET';
const BILLING_OPTIONS: { id: BillingType; label: string; icon: typeof QrCode }[] = [
  { id: 'WALLET', label: 'Carteira', icon: Wallet },
  { id: 'PIX', label: 'PIX', icon: QrCode },
  { id: 'BOLETO', label: 'Boleto', icon: FileText },
  { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
];

const tierIcon: Record<Tier, typeof Crown> = { 
  free: Sparkles, 
  vip1: Star, 
  vip2: ShieldCheck, 
  vip3: Diamond, 
  vip4: Crown, 
  vip5: Crown, 
  vip6: Crown 
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

  const paymentReady = isPaymentConfigured();
  const providerInfo = getActiveProviderInfo();

  const applyCoupon = () => {
    if (!couponCode.trim()) { setCouponError('Digite um código.'); return; }
    const c = validateCoupon(couponCode);
    if (!c.coupon) { setCouponError(c.error || 'Cupom inválido ou expirado.'); setAppliedCoupon(null); return; }
    setAppliedCoupon(c.coupon); setCouponError(''); notify(`Cupom ${c.coupon.code} aplicado: ${c.coupon.discountPercentage}% de desconto!`);
  };

  const priceFor = (price: number) => appliedCoupon ? Math.round(price * (1 - appliedCoupon.discountPercentage / 100) * 100) / 100 : price;

  const currentTier: Tier = currentUser?.vipTier ?? 'free';
  const isOnTrial = currentUser?.trialEndsAt ? new Date(currentUser.trialEndsAt) > new Date() : false;
  const currentEstTier: EstTier = isOnTrial ? 'trial' : (currentUser?.estVipTier ?? 'free');
  
  const currentPlan = getPlan(currentTier, data.vipPlans);
  const currentEstPlan = getEstPlan(currentEstTier, data.estVipPlans);

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    if (billingType === 'WALLET') {
      const planObj = type === 'freelancer' ? getPlan(tier as Tier, data.vipPlans) : getEstPlan(tier as EstTier, data.estVipPlans);
      const finalPrice = priceFor(planObj.prices[period]);
      const userBalance = currentUser?.walletBalance ?? 0;

      // Validação estrita de saldo na carteira
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
        notify(`Plano ${getPlan(t, data.vipPlans).label} ativado com sucesso!`);
      } else {
        const et = tier as EstTier;
        if (appliedCoupon) {
          applyCouponToPurchase(userId, et, period, appliedCoupon, 'establishment');
        } else {
          setEstVipTier(userId, et, period);
        }
        notify(`Plano ${getEstPlan(et, data.estVipPlans).label} ativado com sucesso!`);
      }
      setConfirmTier(null);
      setConfirmEstTier(null);
    } else {
      try {
        const planObj = type === 'freelancer' ? getPlan(tier as Tier, data.vipPlans) : getEstPlan(tier as EstTier, data.estVipPlans);
        const finalPrice = priceFor(planObj.prices[period]);

        const supabaseUrl = supabase.supabaseUrl;
        const { data: sessionData } = await supabase.auth.getSession();
        
        const token = sessionData?.session?.access_token || supabase.supabaseKey;

        const rawDocument = accountType === 'establishment' 
          ? (currentUser?.cnpj || '') 
          : (currentUser?.cpf || currentUser?.cpfCnpj || '');

        const cleanDocument = rawDocument.replace(/\D/g, '');
        const validCpfCnpj = (cleanDocument.length === 11 || cleanDocument.length === 14) 
          ? cleanDocument 
          : '47690623000';

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
            customerName: currentUser?.name || 'Rafael Ricardo Pereira',
            customerEmail: currentUser?.email || 'csdjrrp@gmail.com',
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

        if (!res.ok || !responseData.success) {
          throw new Error(responseData?.error || 'Erro ao comunicar com o gateway de pagamento.');
        }

        if (billingType === 'PIX') {
          if (!responseData.encodedImage && !responseData.payload) {
            throw new Error('A API não retornou os dados do QR Code Pix.');
          }
          setPixData({
            qrCode: responseData.encodedImage ? `data:image/png;base64,${responseData.encodedImage}` : '',
            payload: responseData.payload || ''
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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Cabeçalho da Página Inteira */}
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

          {/* Seletor de Período em Destaque */}
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

        {/* Grade de Planos Ampla, Confortável e Sem Espremer */}
        {accountType === 'freelancer' ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {data.vipPlans.map((plan) => {
              const Icon = tierIcon[plan.tier]; 
              const active = currentTier === plan.tier; 
              const price = plan.prices[period];
              return (
                <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${tierTone[plan.tier]} ${active ? 'ring-2 ring-primary-500 bg-neutral-900/90' : 'hover:border-neutral-700'}`}>
                  {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
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
                        {price === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-2 text-base text-neutral-500 line-through">{formatCurrency(price)}</span>}{formatCurrency(priceFor(price))}</>}
                      </span>
                      {price > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
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
              {data.estVipPlans.map((plan) => {
                const active = currentEstTier === plan.tier; 
                const price = plan.prices[period];
                return (
                  <div key={plan.tier} className={`relative flex flex-col justify-between rounded-2xl border-2 bg-neutral-900 p-6 transition shadow-xl ${estTierTone[plan.tier]} ${active ? 'ring-2 ring-primary-500 bg-neutral-900/90' : 'hover:border-neutral-700'}`}>
                    {active && <div className="absolute -top-3.5 left-5"><Badge tone="primary">Plano Ativo</Badge></div>}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Store className={`h-5 w-5 ${getTierColor(plan.tier)}`} />
                          <span className="font-display text-base font-bold text-white">{plan.label}</span>
                        </div>
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${plan.intermediationFee === 0 ? 'bg-success-500/20 text-success-300 border border-success-500/30' : 'bg-warning-500/20 text-warning-300 border border-warning-500/30'}`}>
                          {plan.intermediationFee === 0 ? '0% taxa' : `${plan.intermediationFee}% taxa`}
                        </span>
                      </div>

                      <div className="my-5">
                        <span className="font-display text-4xl font-extrabold text-white">
                          {price === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-2 text-base text-neutral-500 line-through">{formatCurrency(price)}</span>}{formatCurrency(priceFor(price))}</>}
                        </span>
                        {price > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}
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
                        <Button fullWidth size="lg" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => setConfirmEstTier(plan.tier)}>
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

        {/* Painel de Gerenciamento de Anúncios Dinâmico (Página Inteira) */}
        {accountType === 'establishment' && (
          (() => {
            const activeEstPlan = data.estVipPlans.find(p => p.tier === (currentUser?.estVipTier ?? 'free'));
            const canAdvertise = activeEstPlan?.allowAds ?? false;
            const maxAllowedAds = activeEstPlan?.maxAds ?? 0;

            if (!canAdvertise) return null;

            return (
              <div className="mt-10 rounded-2xl border border-amber-500/30 bg-neutral-900 p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Crown className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">Gerenciamento de Anúncios e Vitrine Promocional</h2>
                      <p className="text-xs sm:text-sm text-neutral-400">Plano Ativo: <strong>{activeEstPlan?.label ?? currentUser?.estVipTier?.toUpperCase()}</strong></p>
                    </div>
                  </div>
                  <Badge tone="vip" className="px-3 py-1 text-xs font-bold">
                    Limite: {maxAllowedAds} anúncio(s)
                  </Badge>
                </div>

                <p className="text-sm text-neutral-300 mb-6">
                  Seu plano atual permite publicar até {maxAllowedAds} imagem(ns) de propaganda em nossa rede de exibições (carrossel da página inicial e widgets).
                </p>

                <div className="mb-6 rounded-xl bg-amber-500/10 p-4 border border-amber-500/20 text-xs sm:text-sm text-amber-200 space-y-1.5">
                  <p className="font-bold">📐 Recomendações Técnicas de Tamanho:</p>
                  <p>• <strong>Banner Paisagem (Carrossel Home):</strong> Exatamente 1200 x 600 pixels (Proporção 2:1).</p>
                  <p>• <strong>Banner Quadrado (Widgets Laterais):</strong> Exatamente 800 x 800 pixels (Proporção 1:1).</p>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {Array.from({ length: maxAllowedAds }).map((_, index) => {
                    const currentImages = currentUser?.adImages || [];
                    const imageUrl = currentImages[index] || '';

                    return (
                      <div key={index} className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-5 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Anúncio Promocional #{index + 1}</span>
                          {imageUrl && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const newImages = [...currentImages];
                                newImages[index] = '';
                                updateUser(userId, { adImages: newImages });
                                notify('Imagem removida com sucesso', 'info');
                              }}
                              className="text-xs text-error-400 hover:underline font-medium"
                            >
                              Remover imagem
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="h-24 w-36 shrink-0 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            {imageUrl ? (
                              <img src={imageUrl} alt={`Anúncio ${index + 1}`} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs text-neutral-500">Sem imagem</span>
                            )}
                          </div>

                          <div className="flex-1 w-full space-y-3">
                            <input 
                              type="text" 
                              placeholder="Cole o link (URL) da imagem..."
                              value={imageUrl.startsWith('data:') ? '[Arquivo carregado do dispositivo]' : imageUrl}
                              disabled={imageUrl.startsWith('data:')}
                              onChange={(e) => {
                                const newImages = [...currentImages];
                                newImages[index] = e.target.value;
                                updateUser(userId, { adImages: newImages });
                              }}
                              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-60"
                            />

                            <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition shadow-md">
                              <Upload className="h-4 w-4" />
                              <span>Carregar Arquivo do Computador</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newImages = [...currentImages];
                                    newImages[index] = reader.result as string;
                                    updateUser(userId, { adImages: newImages });
                                    notify(`Anúncio #${index + 1} carregado com sucesso!`);
                                  };
                                  reader.readAsDataURL(file);
                                }} 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}

        {/* Modais de Confirmação e Pagamento */}
        <Modal open={!!confirmTier} onClose={() => setConfirmTier(null)} title="Confirmar assinatura" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmTier && handleProceedPayment(confirmTier, 'freelancer')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmTier && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10"><Crown className="h-8 w-8 text-warning-500" /><div><p className="font-bold text-neutral-900 dark:text-white">{getPlan(confirmTier, data.vipPlans).label} — {periodLabel(period)}</p><p className="text-xs text-neutral-400">{appliedCoupon ? <><span className="line-through">{formatCurrency(getPlan(confirmTier, data.vipPlans).prices[period])}</span> → {formatCurrency(priceFor(getPlan(confirmTier, data.vipPlans).prices[period]))}</> : formatCurrency(getPlan(confirmTier, data.vipPlans).prices[period])}</p></div></div>
          <BillingTypeSelector billingType={billingType} setBillingType={setBillingType} paymentReady={paymentReady} providerLabel={providerInfo.label} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{billingType === 'WALLET' ? 'Ao confirmar, o valor será debitado da sua carteira e seu plano será ativado imediatamente.' : `Ao confirmar, você será direcionado ao pagamento via ${providerInfo.label}.`}</p></div>}
        </Modal>

        <Modal open={!!confirmEstTier} onClose={() => setConfirmEstTier(null)} title="Confirmar assinatura empresarial" size="sm"
          footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmEstTier(null)}>Cancelar</Button><Button variant="warning" fullWidth onClick={() => confirmEstTier && handleProceedPayment(confirmEstTier, 'establishment')}><Check className="h-4 w-4" /> Confirmar</Button></div>}>
          {confirmEstTier && <div className="space-y-3"><div className="flex items-center gap-3 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10"><Store className="h-8 w-8 text-warning-500" /><div><p className="font-bold text-neutral-900 dark:text-white">{getEstPlan(confirmEstTier, data.estVipPlans).label} — {periodLabel(period)}</p><p className="text-xs text-neutral-400">{appliedCoupon ? <><span className="line-through">{formatCurrency(getEstPlan(confirmEstTier, data.estVipPlans).prices[period])}</span> → {formatCurrency(priceFor(getEstPlan(confirmEstTier, data.estVipPlans).prices[period]))}</> : formatCurrency(getEstPlan(confirmEstTier, data.estVipPlans).prices[period])} · Taxa: {getEstPlan(confirmEstTier, data.estVipPlans).intermediationFee}%</p></div></div>
          <BillingTypeSelector billingType={billingType} setBillingType={setBillingType} paymentReady={paymentReady} providerLabel={providerInfo.label} />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{billingType === 'WALLET' ? 'Ao confirmar, o valor será debitado da sua carteira e sua nova taxa de intermediação será aplicada nas próximas contratações.' : `Ao confirmar, você será direcionado ao pagamento via ${providerInfo.label}.`}</p></div>}
        </Modal>

        <Modal open={!!pixData} onClose={() => setPixData(null)} title="Pagamento via PIX" size="sm">
          {pixData && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">Escaneie o QR Code abaixo com o aplicativo do seu banco para realizar o pagamento:</p>
              <div className="flex justify-center">
                <img src={pixData.qrCode} alt="QR Code PIX" className="h-48 w-48 rounded-xl border border-neutral-200 p-2 dark:border-neutral-700" />
              </div>
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

        {/* Input de Cupom */}
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
