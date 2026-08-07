import { useState } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy } from 'lucide-react';
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

const tierIcon: Record<Tier, typeof Crown> = { free: Sparkles, vip1: Star, vip2: ShieldCheck, vip3: Diamond, vip4: Diamond, vip5: Diamond, vip6: Diamond };
const tierTone: Record<Tier, string> = {
  free: 'border-neutral-200 dark:border-neutral-700',
  vip1: 'border-primary-300 dark:border-primary-500/40 shadow-glow',
  vip2: 'border-secondary-300 dark:border-secondary-500/40 shadow-glow',
  vip3: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
  vip4: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
  vip5: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
  vip6: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
};
const estTierTone: Record<EstTier, string> = {
  free: 'border-neutral-200 dark:border-neutral-700',
  vip1: 'border-primary-300 dark:border-primary-500/40 shadow-glow',
  vip2: 'border-secondary-300 dark:border-secondary-500/40 shadow-glow',
  vip3: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
  vip4: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
  vip5: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
  vip6: 'border-warning-300 dark:border-warning-500/40 shadow-glow-vip',
};

export function VipPanel({ userId, accountType }: { userId: string; accountType: 'freelancer' | 'establishment' }) {
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

  const paymentReady = isPaymentConfigured();
  const providerInfo = getActiveProviderInfo();

  const applyCoupon = () => {
    if (!couponCode.trim()) { setCouponError('Digite um código.'); return; }
    const c = validateCoupon(couponCode);
    if (!c) { setCouponError('Cupom inválido ou expirado.'); setAppliedCoupon(null); return; }
    setAppliedCoupon(c); setCouponError(''); notify(`Cupom ${c.code} aplicado: ${c.discountPercentage}% de desconto!`);
  };

  const priceFor = (price: number) => appliedCoupon ? Math.round(price * (1 - appliedCoupon.discountPercentage / 100) * 100) / 100 : price;

  const currentTier: Tier = currentUser?.vipTier ?? 'free';
  const currentEstTier: EstTier = currentUser?.estVipTier ?? 'free';
  const currentPlan = getPlan(currentTier, data.vipPlans);
  const currentEstPlan = getEstPlan(currentEstTier, data.estVipPlans);

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    if (billingType === 'WALLET') {
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
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        // CPF de testes oficial do Asaas Sandbox
        const validTestCpf = '47690623000';

        const res = await fetch(`${supabaseUrl}/functions/v1/asaas-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Garante o envio correto do token da sessão do usuário
          },
          body: JSON.stringify({
            type: 'payment',
            billingType: billingType,
            value: finalPrice,
            description: `Assinatura ${planObj.label} (${periodLabel(period)})`,
            customerName: currentUser?.name || 'Rafael Ricardo Pereira',
            customerEmail: currentUser?.email || 'csdjrrp@gmail.com',
            customerCpfCnpj: validTestCpf,
            externalReference: userId
          })
        });

        // LE O TEXTO PURO ANTES DE TENTAR CONVERTER PARA JSON
        const rawText = await res.text();
        console.log("STATUS HTTP:", res.status);
        console.log("TEXTO BRUTO RETORNADO PELA EDGE FUNCTION:", rawText);

        let responseData;
        try {
          responseData = JSON.parse(rawText);
        } catch (e) {
          throw new Error(`A Edge Function retornou HTML/Texto inválido (Status ${res.status}): ${rawText.substring(0, 100)}...`);
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-warning-600"><Crown className="h-5 w-5 text-white" /></div>
        <div>
          <h3 className="font-display font-bold text-neutral-900 dark:text-white">Plano de Destaque</h3>
          <p className="text-xs text-neutral-400">{accountType === 'freelancer' ? `Plano atual: ${currentPlan.label}` : `Plano atual: ${currentEstPlan.label}`}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-800">
        {(['monthly', 'semestral', 'annual'] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${period === p ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-700 dark:text-primary-400' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}>
            {periodLabel(p)}{p !== 'monthly' && <span className="block text-[9px] text-success-500">economize</span>}
          </button>
        ))}
      </div>

      {accountType === 'freelancer' ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
          {data.vipPlans.map((plan) => {
            const Icon = tierIcon[plan.tier]; const active = currentTier === plan.tier; const price = plan.prices[period];
            return (
              <div key={plan.tier} className={`relative rounded-xl border-2 p-4 transition ${tierTone[plan.tier]} ${active ? 'ring-2 ring-primary-400/40' : ''}`}>
                {active && <div className="absolute -top-2 left-3"><Badge tone="primary">Atual</Badge></div>}
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${plan.tier === 'vip3' ? 'text-warning-500' : plan.tier === 'vip2' ? 'text-secondary-500' : plan.tier === 'vip1' ? 'text-primary-500' : 'text-neutral-400'}`} />
                  <span className="font-display font-bold text-neutral-900 dark:text-white">{plan.label}</span>
                  {plan.badge === 'verified' && <ShieldCheck className="h-4 w-4 text-secondary-500" />}
                  {plan.badge === 'diamond' && <Diamond className="h-4 w-4 text-warning-500" />}
                </div>
                <p className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{price === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-1 text-sm text-neutral-400 line-through">{formatCurrency(price)}</span>}{formatCurrency(priceFor(price))}</>}{price > 0 && <span className="text-xs font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}</p>
                <ul className="mt-3 space-y-1.5">{plan.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" /> {f}</li>)}</ul>
                {!active && <Button size="sm" fullWidth className="mt-3" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => setConfirmTier(plan.tier)}>{plan.tier === 'free' ? 'Voltar para Free' : 'Assinar'}</Button>}
                {active && <p className="mt-3 text-center text-xs font-semibold text-neutral-400">Plano ativo</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-secondary-50 p-3 dark:bg-secondary-500/10">
            <Percent className="h-5 w-5 text-secondary-500" />
            <p className="text-sm text-secondary-700 dark:text-secondary-300">Seu plano define a <strong>taxa de intermediação</strong> cobrada em cada contratação. Quanto maior o plano, menor a taxa.</p>
          </div>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
            {data.estVipPlans.map((plan) => {
              const active = currentEstTier === plan.tier; const price = plan.prices[period];
              return (
                <div key={plan.tier} className={`relative rounded-xl border-2 p-4 transition ${estTierTone[plan.tier]} ${active ? 'ring-2 ring-primary-400/40' : ''}`}>
                  {active && <div className="absolute -top-2 left-3"><Badge tone="primary">Atual</Badge></div>}
                  <div className="mb-2 flex items-center gap-1.5">
                    <Store className={`h-4 w-4 ${plan.tier === 'vip3' ? 'text-warning-500' : plan.tier === 'vip2' ? 'text-secondary-500' : plan.tier === 'vip1' ? 'text-primary-500' : 'text-neutral-400'}`} />
                    <span className="font-display text-sm font-bold text-neutral-900 dark:text-white">{plan.label}</span>
                  </div>
                  <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{price === 0 ? 'Grátis' : <>{appliedCoupon && <span className="mr-1 text-xs text-neutral-400 line-through">{formatCurrency(price)}</span>}{formatCurrency(priceFor(price))}</>}{price > 0 && <span className="text-[10px] font-medium text-neutral-400">/{periodLabel(period).toLowerCase()}</span>}</p>
                  <div className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${plan.intermediationFee === 0 ? 'bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400' : plan.intermediationFee >= 10 ? 'bg-error-100 text-error-600 dark:bg-error-500/15 dark:text-error-400' : 'bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400'}`}>
                    <Percent className="h-3 w-3" /> {plan.intermediationFee === 0 ? '0% taxa' : `${plan.intermediationFee}% taxa`}
                  </div>
                  <ul className="mt-3 space-y-1.5">{plan.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" /> {f}</li>)}</ul>
                  {!active && <Button size="sm" fullWidth className="mt-3" variant={plan.tier === 'free' ? 'outline' : 'warning'} onClick={() => setConfirmEstTier(plan.tier)}>{plan.tier === 'free' ? 'Voltar para Free' : 'Assinar'}</Button>}
                  {active && <p className="mt-3 text-center text-xs font-semibold text-neutral-400">Plano ativo</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Coupon input */}
      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><Ticket className="h-3.5 w-3.5" /> Cupom de desconto</label>
        <div className="flex gap-2">
          <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="BEMVINDO10" className="flex-1" />
          <Button size="sm" variant="outline" onClick={applyCoupon}>Aplicar</Button>
        </div>
        {couponError && <p className="mt-1 text-xs text-error-500">{couponError}</p>}
        {appliedCoupon && <p className="mt-1 text-xs text-success-500">Cupom {appliedCoupon.code} aplicado: {appliedCoupon.discountPercentage}% OFF</p>}
      </div>
    </div>
  );
}

function BillingTypeSelector({ billingType, setBillingType, paymentReady, providerLabel }: { billingType: BillingType; setBillingType: (b: BillingType) => void; paymentReady: boolean; providerLabel: string }) {
  const options = paymentReady ? BILLING_OPTIONS : BILLING_OPTIONS.filter((o) => o.id === 'WALLET');
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-neutral-500">Forma de pagamento</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
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
