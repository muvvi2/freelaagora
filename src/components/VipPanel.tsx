import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, ShieldCheck, Diamond, Star, Store, Percent, Ticket, QrCode, CreditCard, FileText, Wallet, AlertCircle, Copy, ArrowLeft, Users, Building2, Upload, Trash2, ImageIcon, Link as LinkIcon } from 'lucide-react';
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

// ... (Mantenha todas as constantes e definições de tipo como estavam anteriormente) ...
// (BILLING_OPTIONS, SLOT_NAMES, SLOT_DIMENSIONS, tierIcon, tierTone, estTierTone, getTierColor)

export function VipPanel({ userId, accountType, onBack }: { userId: string; accountType: 'freelancer' | 'establishment'; onBack?: () => void }) {
  const { currentUser, data, setVipTier, setEstVipTier, validateCoupon, applyCouponToPurchase, updateUser } = useApp();
  const { notify } = useToast();
  
  // Estados locais protegidos
  const [isSaving, setIsSaving] = useState(false);
  const [activeFreelaTab, setActiveFreelaTab] = useState<number>(0);
  const [activeEstabTab, setActiveEstabTab] = useState<number>(0);

  // Inicialização segura dos estados
  const [selectedFreelancerSlots, setSelectedFreelancerSlots] = useState<number[]>(currentUser?.allowedFreelancerSlots ?? []);
  const [selectedEstablishmentSlots, setSelectedEstablishmentSlots] = useState<number[]>(currentUser?.allowedEstablishmentSlots ?? []);
  
  const currentEstTier = currentUser?.estVipTier ?? 'free';
  const maxAdsPerSlot = currentEstTier === 'vip6' ? 5 : currentEstTier === 'vip5' ? 3 : currentEstTier === 'vip4' ? 1 : 3;

  const [freelancerAdsBySlot, setFreelancerAdsBySlot] = useState<string[][]>(() => (currentUser?.freelancerAdsBySlot ?? [[], [], []]));
  const [establishmentAdsBySlot, setEstablishmentAdsBySlot] = useState<string[][]>(() => (currentUser?.establishmentAdsBySlot ?? [[], [], []]));
  const [freelancerLinksBySlot, setFreelancerLinksBySlot] = useState<string[][]>(() => (currentUser?.freelancerLinksBySlot ?? [[], [], []]));
  const [establishmentLinksBySlot, setEstablishmentLinksBySlot] = useState<string[][]>(() => (currentUser?.establishmentLinksBySlot ?? [[], [], []]));

  // Função de salvamento blindada
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
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
      notify('Dados salvos com sucesso!');
    } catch (e) {
      notify('Erro ao salvar. Verifique sua conexão.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ... (Mantenha as funções handleFileChange, handleLinkChange, handleRemoveAd e renderCompactSlotManager IGUAIS) ...
  // ... (Mantenha o renderTabbedSlotManager IGUAL) ...

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      {/* ... (Header e Estrutura VIP - Mantenha igual) ... */}

      {/* Biblioteca corrigida */}
      {accountType === 'establishment' && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">Biblioteca de Imagens</h3>
            <Button 
              variant="warning" 
              onClick={handleSaveData} 
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ... (Conteúdo das abas) ... */}
          </div>
        </div>
      )}
      {/* ... (Restante do componente) ... */}
    </div>
  );
}
