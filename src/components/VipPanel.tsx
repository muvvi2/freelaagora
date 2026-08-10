import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy, ArrowLeft, Users, Building2, Upload, Trash2, ImageIcon } from 'lucide-react';
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
const SLOT_DIMENSIONS = [
  { width: 600, height: 900, label: "600x900 px" },
  { width: 600, height: 500, label: "600x500 px" },
  { width: 600, height: 200, label: "600x200 px" },
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
  const [isSaving, setIsSaving] = useState(false);

  const [activeFreelaTab, setActiveFreelaTab] = useState<number>(0);
  const [activeEstabTab, setActiveEstabTab] = useState<number>(0);

  const [selectedFreelancerSlots, setSelectedFreelancerSlots] = useState<number[]>(currentUser?.allowedFreelancerSlots ?? []);
  const [selectedEstablishmentSlots, setSelectedEstablishmentSlots] = useState<number[]>(currentUser?.allowedEstablishmentSlots ?? []);

  const currentTier: Tier = currentUser?.vipTier ?? 'free';
  const hasActiveVip = currentUser?.estVipTier && currentUser.estVipTier !== 'free' && currentUser.estVipTier !== 'trial';
  const isOnTrial = !hasActiveVip && (currentUser?.trialEndsAt ? new Date(currentUser.trialEndsAt) > new Date() : false);
  const currentEstTier: EstTier = isOnTrial ? 'trial' : (currentUser?.estVipTier ?? 'free');
  
  const vipPlansList = data?.vipPlans ?? [];
  const estVipPlansList = data?.estVipPlans ?? [];

  const maxAdsPerSlot = currentEstTier === 'vip6' ? 5 : currentEstTier === 'vip5' ? 3 : currentEstTier === 'vip4' ? 1 : 3;

  const [freelancerAdsBySlot, setFreelancerAdsBySlot] = useState<string[][]>(() => (currentUser?.freelancerAdsBySlot ?? [[], [], []]));
  const [establishmentAdsBySlot, setEstablishmentAdsBySlot] = useState<string[][]>(() => (currentUser?.establishmentAdsBySlot ?? [[], [], []]));
  const [freelancerLinksBySlot, setFreelancerLinksBySlot] = useState<string[][]>(() => (currentUser?.freelancerLinksBySlot ?? [[], [], []]));
  const [establishmentLinksBySlot, setEstablishmentLinksBySlot] = useState<string[][]>(() => (currentUser?.establishmentLinksBySlot ?? [[], [], []]));

  useEffect(() => {
    let path = '/vip';
    if (accountType === 'freelancer') path = '/freela';
    if (accountType === 'establishment') path = '/estab';
    window.history.replaceState(null, '', path);
  }, [accountType]);

  const handleFileChange = (slotIndex: number, adIndex: number, type: 'freelancers' | 'establishments') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      if (type === 'freelancers') {
        const updated = [...freelancerAdsBySlot];
        if (!updated[slotIndex]) updated[slotIndex] = [];
        updated[slotIndex][adIndex] = base64Image;
        setFreelancerAdsBySlot(updated);
      } else {
        const updated = [...establishmentAdsBySlot];
        if (!updated[slotIndex]) updated[slotIndex] = [];
        updated[slotIndex][adIndex] = base64Image;
        setEstablishmentAdsBySlot(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLinkChange = (slotIndex: number, adIndex: number, type: 'freelancers' | 'establishments', value: string) => {
    if (type === 'freelancers') {
      const updated = [...freelancerLinksBySlot];
      if (!updated[slotIndex]) updated[slotIndex] = [];
      updated[slotIndex][adIndex] = value;
      setFreelancerLinksBySlot(updated);
    } else {
      const updated = [...establishmentLinksBySlot];
      if (!updated[slotIndex]) updated[slotIndex] = [];
      updated[slotIndex][adIndex] = value;
      setEstablishmentLinksBySlot(updated);
    }
  };

  const handleRemoveAd = (slotIndex: number, adIndex: number, type: 'freelancers' | 'establishments') => {
    if (type === 'freelancers') {
      const updated = [...freelancerAdsBySlot];
      updated[slotIndex][adIndex] = '';
      setFreelancerAdsBySlot(updated);
    } else {
      const updated = [...establishmentAdsBySlot];
      updated[slotIndex][adIndex] = '';
      setEstablishmentAdsBySlot(updated);
    }
  };

  const renderCompactSlotManager = (adsBySlot: string[][], linksBySlot: string[][], type: 'freelancers' | 'establishments', activeTab: number, setActiveTab: (t: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="flex border-b border-neutral-800 gap-1 overflow-x-auto">
          {SLOT_NAMES.map((slotName, idx) => (
            <button key={idx} type="button" onClick={() => setActiveTab(idx)} className={`px-3 py-2 text-xs font-bold transition border-b-2 ${activeTab === idx ? 'border-amber-500 text-amber-400' : 'border-transparent text-neutral-400'}`}>
              {slotName}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {Array.from({ length: maxAdsPerSlot }).map((_, adIndex) => {
            const adImg = adsBySlot[activeTab]?.[adIndex] || '';
            return (
              <div key={adIndex} className="p-2 border border-neutral-800 rounded bg-neutral-900 flex items-center gap-2">
                <input type="file" onChange={handleFileChange(activeTab, adIndex, type)} className="text-[10px]" />
                <input type="text" value={linksBySlot[activeTab]?.[adIndex] || ''} onChange={(e) => handleLinkChange(activeTab, adIndex, type, e.target.value)} placeholder="Link" className="flex-1 bg-neutral-950 p-1 text-xs" />
                {adImg && <button onClick={() => handleRemoveAd(activeTab, adIndex, type)}><Trash2 className="h-4 w-4 text-red-500" /></button>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-neutral-950 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Painel VIP</h1>
      {/* ... o restante do JSX ... */}
      {accountType === 'establishment' && (
        <div className="mt-8 bg-neutral-900 p-6 rounded-xl border border-neutral-800">
           <div className="flex justify-between mb-4">
              <h2 className="text-white font-bold">Biblioteca de Imagens</h2>
              <Button onClick={async () => {
                 setIsSaving(true);
                 await updateUser(userId, {
                    allowedFreelancerSlots: selectedFreelancerSlots,
                    allowedEstablishmentSlots: selectedEstablishmentSlots,
                    freelancerAdsBySlot,
                    establishmentAdsBySlot,
                    freelancerLinksBySlot,
                    establishmentLinksBySlot,
                    freelancerAds: freelancerAdsBySlot.flat(),
                    establishmentAds: establishmentAdsBySlot.flat(),
                    freelancerLinks: freelancerLinksBySlot.flat(),
                    establishmentLinks: establishmentLinksBySlot.flat(),
                 });
                 setIsSaving(false);
                 notify('Salvo!');
              }}>{isSaving ? 'Salvando...' : 'Salvar alterações'}</Button>
           </div>
           {renderCompactSlotManager(freelancerAdsBySlot, freelancerLinksBySlot, 'freelancers', activeFreelaTab, setActiveFreelaTab)}
           {renderCompactSlotManager(establishmentAdsBySlot, establishmentLinksBySlot, 'establishments', activeEstabTab, setActiveEstabTab)}
        </div>
      )}
    </div>
  );
}
