import { useState } from 'react';
import { User as UserIcon, MapPin, Tags, Calendar, Crown, Wallet, Briefcase, Fingerprint, ShieldCheck, MessageSquare, Save, Inbox, Megaphone, Upload, Check, X } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { Rating } from './ui/Rating';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { VipPanel } from './VipPanel';
import { WalletPanel } from './WalletPanel';
import { JobCard } from './JobCard';
import { EscrowFlowModal } from './EscrowFlowModal';
import { ReviewModal } from './ReviewModal';

import { formatCurrency, getPlan, countAvailableSlots, maskCEP, maskDocumentDisplay, formatDateTime } from '@/utils';
import type { Contract, ShiftSlot, Address } from '@/types';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function FreelancerView() {
  const { currentUser, data, toggleDateShift, toggleCategory, reviewsFor, updateUser } = useApp();
  const { notify } = useToast();
  const me = currentUser!;
  const plan = getPlan(me.vipTier ?? 'free', data.vipPlans);

  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Contract | null>(null);
  const [tab, setTab] = useState<'opportunities' | 'personal' | 'address' | 'specialties' | 'agenda' | 'vip' | 'wallet'>('opportunities');

  const myContracts = data.contracts.filter((c) => c.freelancerId === me.id);
  const openJobs = data.jobs.filter((j) => j.status === 'active');
  const reviewsAboutMe = reviewsFor(me.id);

  const tabs = [
    { id: 'opportunities' as const, label: 'Oportunidades e Propostas', icon: Megaphone },
    { id: 'personal' as const, label: 'Dados Pessoais', icon: UserIcon },
    { id: 'address' as const, label: 'Endereço', icon: MapPin },
    { id: 'specialties' as const, label: 'Especialidades', icon: Tags },
    { id: 'agenda' as const, label: 'Agenda', icon: Calendar },
    { id: 'vip' as const, label: 'Plano VIP', icon: Crown },
    { id: 'wallet' as const, label: 'Carteira', icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* ... (O restante do header do perfil se mantém igual) */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        {me.vipTier && me.vipTier !== 'free' && <div className="absolute right-4 top-4"><Badge tone="vip"><Crown className="h-3 w-3" /> {plan.label}</Badge></div>}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={me.photo} alt={me.name} size={96} ring={me.vipTier && me.vipTier !== 'free' ? 'vip' : 'primary'} vipBadge={me.vipTier === 'vip2' || me.vipTier === 'vip3'} />
          <div className="flex-1">
             <h1 className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{me.name}</h1>
             <p className="text-sm text-neutral-400">{me.address.city}, {me.address.state}</p>
          </div>
        </div>
      </div>

      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {tabs.map((t) => { const Icon = t.icon; const active = tab === t.id; return <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'}`}><Icon className="h-4 w-4" /> {t.label}</button>; })}
      </div>

      <div className="mt-6">
        {tab === 'specialties' && <SpecialtiesTab me={me} onToggleCat={(catId: string) => { const res = toggleCategory(me.id, catId); if (!res.ok) notify(res.error ?? 'Erro', 'warning'); else notify('Categoria atualizada'); }} onSave={(patch) => { updateUser(me.id, patch); notify('Valores atualizados!'); }} />}
        {/* ... (Restante das outras tabs) */}
      </div>
    </div>
  );
}

// ============================================================
// TAB ESPECIALIDADES (Layout Profissional 2 Colunas)
// ============================================================
function SpecialtiesTab({ me, onToggleCat, onSave }: { me: any; onToggleCat: (catId: string) => void; onSave: (patch: any) => void }) {
  const { data } = useApp();
  const [selectedMacro, setSelectedMacro] = useState(MACRO_CATEGORIES[0].id);
  const [hourlyRate, setHourlyRate] = useState(String(me.hourlyRate ?? 0));
  const [dailyRate, setDailyRate] = useState(String(me.dailyRate ?? 0));

  const filteredCategories = CATEGORIES.filter(cat => cat.macro === selectedMacro);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white">
        <Tags className="h-5 w-5 text-primary-500" /> Especialidades e Valores
      </h2>

      {/* Tags Selecionadas (Topo) */}
      <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
        <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">Minhas especialidades selecionadas</p>
        <div className="flex flex-wrap gap-2">
          {me.categories?.length > 0 ? (
            me.categories.map((id: string) => {
              const cat = CATEGORIES.find(c => c.id === id);
              const macro = MACRO_CATEGORIES.find(m => m.id === cat?.macro);
              return cat ? (
                <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: macro?.color }}>
                  {cat.label}
                  <button onClick={() => onToggleCat(id)} className="hover:bg-black/20 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </span>
              ) : null;
            })
          ) : (
            <p className="text-sm text-neutral-400 italic">Nenhuma especialidade selecionada.</p>
          )}
        </div>
      </div>

      {/* Grid 2 Colunas */}
      <div className="flex h-[400px] border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden mb-6">
        {/* Esquerda: Macros */}
        <div className="w-1/3 bg-neutral-50 dark:bg-neutral-800 overflow-y-auto border-r border-neutral-200 dark:border-neutral-700">
          {MACRO_CATEGORIES.map(macro => (
            <button
              key={macro.id}
              onClick={() => setSelectedMacro(macro.id)}
              className={`w-full p-4 text-left text-sm font-medium border-b border-neutral-200 dark:border-neutral-700 transition flex items-center gap-3 ${
                selectedMacro === macro.id 
                ? 'bg-white dark:bg-neutral-900 border-l-4 border-l-primary-500 text-primary-600' 
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: macro.color }} />
              {macro.label}
            </button>
          ))}
        </div>

        {/* Direita: Especialidades */}
        <div className="w-2/3 overflow-y-auto p-2">
          {filteredCategories.map(cat => {
            const isSelected = (me.categories || []).includes(cat.id);
            const macro = MACRO_CATEGORIES.find(m => m.id === cat.macro);
            return (
              <button
                key={cat.id}
                onClick={() => onToggleCat(cat.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition text-left ${
                  isSelected 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold' 
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {cat.label}
                {isSelected && <Check className="h-4 w-4 text-primary-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Valor da Hora Comercial (R$/h)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
        <Input label="Valor da Diária Fechada (R$)" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
      </div>
      <Button className="mt-4" onClick={() => onSave({ hourlyRate: Number(hourlyRate), dailyRate: Number(dailyRate) })}><Save className="h-4 w-4" /> Salvar valores</Button>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-neutral-400">{label}</p><p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">{value}</p></div>;
}
