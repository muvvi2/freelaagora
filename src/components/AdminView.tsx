import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users, Store, Briefcase, Percent, TrendingUp, Shield,
  RotateCcw, Trash2, Pencil, Megaphone, Wallet, Ban, CheckCircle2, Crown, AlertCircle,
  User as UserIcon, MapPin, Tags, Calendar, Save, Ticket, Terminal, RotateCcw as RefundIcon, Plus,
  Search, Star, UserPlus, Eye, EyeOff, UserCog, Camera, Lock, DollarSign, MoreVertical, Image as ImageIcon,
  Check, X
} from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Rating } from './ui/Rating';
import { Modal } from './ui/Modal';
import { Input, Select } from './ui/Field';
import { EscrowFlowModal } from './EscrowFlowModal';
import { formatCurrency, formatDate, formatDateTime, contractStatusLabel, getPlan, getEstPlan, maskDocumentDisplay } from '@/utils';
import type { Contract, User, Tier, EstTier, ContractStatus, VipPlan, EstVipPlan } from '@/types';

type Tab = 'overview' | 'freelancers' | 'establishments' | 'contracts' | 'jobs' | 'reviews' | 'coupons' | 'audit' | 'wallet' | 'vip' | 'admins';

const getPlanTierColor = (tier: string) => {
  if (tier === 'vip6') return 'text-rose-500';
  if (tier === 'vip5') return 'text-purple-500';
  if (tier === 'vip4') return 'text-amber-500';
  if (tier === 'vip3') return 'text-warning-500';
  if (tier === 'vip2') return 'text-secondary-500';
  if (tier === 'vip1') return 'text-primary-500';
  if (tier === 'trial') return 'text-accent-500';
  return 'text-neutral-400';
};

export function AdminView() {
  const { data, currentUser, isSuperAdmin, adminTab: tab } = useApp();
  // ... (o restante da lógica do seu AdminView permanece igual, apenas substitua o VipPlansTab abaixo)
  // Certifique-se de que o resto do arquivo AdminView original está preservado conforme seu arquivo atual.
  
  return (
    // ... (Mantendo a estrutura do AdminView que você já tinha)
    // Quando chegar no render do tab === 'vip', utilize o VipPlansTab abaixo:
    <>
      {tab === 'vip' && (
        <VipPlansTab
          vipPlans={data.vipPlans}
          estVipPlans={data.estVipPlans}
          onUpdateVipPlan={useApp().updateVipPlan}
          onAddVipPlan={useApp().addVipPlan}
          onRemoveVipPlan={useApp().removeVipPlan}
          onUpdateEstVipPlan={useApp().updateEstVipPlan}
          onAddEstVipPlan={useApp().addEstVipPlan}
          onRemoveEstVipPlan={useApp().removeEstVipPlan}
        />
      )}
    </>
  );
}

function VipPlanEditor({ plan, onUpdate, onRemove, isEst }: {
  plan: VipPlan | EstVipPlan;
  onUpdate: (patch: Partial<VipPlan> | Partial<EstVipPlan>) => void;
  onRemove: () => void;
  isEst: boolean;
}) {
  const { notify } = useToast();
  const [expanded, setExpanded] = useState(false);
  const canDelete = plan.tier !== 'free' && plan.tier !== 'trial';
  const estPlan = isEst ? (plan as EstVipPlan) : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-left">
          <Crown className={`h-4 w-4 ${getPlanTierColor(plan.tier)}`} />
          <span className="font-semibold text-neutral-900 dark:text-white">{plan.label}</span>
          <Badge tone={plan.tier === 'free' ? 'neutral' : 'vip'}>{plan.tier.toUpperCase()}</Badge>
        </button>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}><Pencil className="h-3.5 w-3.5" /></Button>
          {canDelete && <Button size="sm" variant="ghost" className="text-error-500" onClick={() => onRemove()}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <Input label="Nome do plano" value={plan.label} onChange={(e) => onUpdate({ label: e.target.value })} />
          
          {isEst && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:bg-amber-500/10 space-y-4">
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">Permitir Anúncios (600x900px)</p>
                </div>
                <input type="checkbox" checked={estPlan?.allowAds ?? false} onChange={(e) => onUpdate({ allowAds: e.target.checked } as Partial<EstVipPlan>)} className="h-5 w-5 rounded border-neutral-300 text-amber-500" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Preço: Topo da Página (R$)" type="number" value={String((estPlan as any)?.priceSlot1 ?? 30)} onChange={(e) => onUpdate({ priceSlot1: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
                <Input label="Preço: Centro do Feed (R$)" type="number" value={String((estPlan as any)?.priceSlot2 ?? 25)} onChange={(e) => onUpdate({ priceSlot2: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
                <Input label="Preço: Rodapé da Página (R$)" type="number" value={String((estPlan as any)?.priceSlot3 ?? 20)} onChange={(e) => onUpdate({ priceSlot3: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Preço mensal (R$)" type="number" value={String(plan.prices.monthly)} onChange={(e) => onUpdate({ prices: { ...plan.prices, monthly: Number(e.target.value) || 0 } })} />
            <Input label="Preço semestral (R$)" type="number" value={String(plan.prices.semestral)} onChange={(e) => onUpdate({ prices: { ...plan.prices, semestral: Number(e.target.value) || 0 } })} />
            <Input label="Preço anual (R$)" type="number" value={String(plan.prices.annual)} onChange={(e) => onUpdate({ prices: { ...plan.prices, annual: Number(e.target.value) || 0 } })} />
          </div>
        </div>
      )}
    </div>
  );
}
