import { useState } from 'react';
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

// ... (Mantenha os constantes BILLING_OPTIONS, tierIcon, tierTone, estTierTone, getTierColor iguais)
// (Cole as constantes aqui para manter o arquivo completo)

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

  // ... (funções applyCoupon e priceFor mantidas)

  const handleProceedPayment = async (tier: Tier | EstTier, type: 'freelancer' | 'establishment') => {
    const planObj = type === 'freelancer' ? getPlan(tier as Tier, data.vipPlans) : getEstPlan(tier as EstTier, data.estVipPlans);
    const finalPrice = priceFor(planObj.prices[period]);
    const userBalance = currentUser?.walletBalance ?? 0;

    if (billingType === 'WALLET') {
      if (finalPrice > 0 && userBalance < finalPrice) {
        notify(`Saldo insuficiente na carteira! Necessário: ${formatCurrency(finalPrice)}`, 'error');
        return;
      }
      // ... (lógica Wallet mantida)
      setConfirmTier(null);
      setConfirmEstTier(null);
    } else {
      try {
        const supabaseUrl = supabase.supabaseUrl;
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || supabase.supabaseKey;

        const rawDocument = (accountType === 'establishment' ? currentUser?.cnpj : currentUser?.cpf) || '';
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
            customerEmail: currentUser?.email || 'contato@cliente.com',
            customerCpfCnpj: cleanDocument || '00000000000',
            externalReference: userId
          })
        });

        const rawText = await res.text();
        let responseData;
        
        try {
          responseData = JSON.parse(rawText);
        } catch {
          throw new Error(`Resposta inválida do servidor: ${rawText}`);
        }

        if (!res.ok) {
          // Captura a mensagem de erro específica vinda da Edge Function
          throw new Error(responseData?.error || `Erro ${res.status}: ${res.statusText}`);
        }

        if (billingType === 'PIX') {
           // ... (lógica PIX)
        } else {
           // ... (lógica Boleto/Cartão)
        }
      } catch (err: any) {
        console.error("Erro completo:", err);
        notify(err.message || 'Erro ao processar pagamento.', 'error');
      }
    }
  };
  
  // ... (resto do retorno JSX)
}
