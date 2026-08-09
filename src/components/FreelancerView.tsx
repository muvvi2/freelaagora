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
import { VipSquareWidget } from './VipSquareWidget';
import { EscrowFlowModal } from './EscrowFlowModal';
import { ReviewModal } from './ReviewModal';

import { formatCurrency, getPlan, countAvailableSlots, maskCEP, maskDocumentDisplay, formatDateTime, filterAdsByRadius } from '@/utils';
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

  // Filtra os anúncios VIP aplicando a regra de até 60km para o Brasil inteiro
  const nearbyAds = filterAdsByRadius(data.users, me);

  const tabs = [
    { id: 'opportunities' as const, label: 'Oportunidades e Propostas', icon: Megaphone },
    { id: 'personal' as const, label: 'Dados Pessoais', icon: UserIcon },
    { id: 'address' as const, label: 'Endereço', icon: MapPin },
    { id: 'specialties' as const, label: 'Especialidades', icon: Tags },
    { id: 'agenda' as const, label: 'Agenda', icon: Calendar },
    { id: 'vip' as const, label: 'Plano VIP', icon: Crown },
    { id: 'wallet' as const, label: 'Carteira', icon: Wallet },
  ];

  // Se a aba selecionada for 'vip', renderiza a página inteira dedicada ao Plano VIP
  if (tab === 'vip') {
    return (
      <VipPanel 
        userId={me.id} 
        accountType="freelancer" 
        onBack={() => setTab('opportunities')} 
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        {me.vipTier && me.vipTier !== 'free' && <div className="absolute right-4 top-4"><Badge tone="vip"><Crown className="h-3 w-3" /> {plan.label}</Badge></div>}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={me.photo} alt={me.name} size={96} ring={me.vipTier && me.vipTier !== 'free' ? 'vip' : 'primary'} vipBadge={me.vipTier === 'vip2' || me.vipTier === 'vip3'} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold text-neutral-900 dark:text-white">{me.name}</h1>
              {me.documentVerified && <ShieldCheck className="h-5 w-5 text-secondary-500" />}
            </div>
            {me.nickname && <p className="text-sm text-neutral-400">"{me.nickname}"</p>}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Rating value={me.rating ?? 0} count={me.reviewsCount ?? 0} />
              <span className="inline-flex items-center gap-1 text-sm text-neutral-400"><Briefcase className="h-4 w-4" /> {me.completedShifts ?? 0} turnos</span>
              <span className="text-sm text-neutral-400">{me.address.city}, {me.address.state}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{me.bio ?? 'Sem biografia. Edite seu perfil para adicionar uma descrição.'}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:grid-cols-4">
          <InfoBox label="Diária fechada" value={formatCurrency(me.dailyRate ?? 0)} />
          <InfoBox label="Hora comercial" value={formatCurrency(me.hourlyRate ?? 0)} />
          <InfoBox label="Disponibilidade" value={`${countAvailableSlots(me.availability)} turnos`} />
          <InfoBox label="Plano" value={plan.label} />
        </div>
      </div>

      {/* Audit log card */}
      {me.termsAcceptance && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
          <Fingerprint className="h-4 w-4 shrink-0 text-neutral-400" />
          <p className="text-xs text-neutral-500">
            Aceite dos termos registrado em <strong>{formatDateTime(me.termsAcceptance.timestamp)}</strong> · IP: <span className="font-mono">{me.termsAcceptance.ip}</span> · Versão: {me.termsAcceptance.legalVersion}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {tabs.map((t) => { const Icon = t.icon; const active = tab === t.id; return <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'}`}><Icon className="h-4 w-4" /> {t.label}</button>; })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {tab === 'opportunities' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Inbox className="h-5 w-5 text-primary-500" /> Convites Diretos</h2>
                {myContracts.filter((c) => c.status === 'requested' || c.status === 'confirmed').length > 0 ? (
                  <div className="space-y-3">
                    {myContracts.filter((c) => c.status === 'requested' || c.status === 'confirmed').map((c) => (
                      <button key={c.id} onClick={() => setEscrowContract(c)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 p-3 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                        <Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={40} />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{c.establishmentName}</p><p className="text-xs text-neutral-400">{formatCurrency(c.freelancerFee)} · {c.category}</p></div>
                        <Badge tone={c.status === 'confirmed' ? 'success' : 'warning'}>{c.status === 'requested' ? 'Pendente' : 'Confirmado'}</Badge>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-50 p-6 text-center dark:bg-neutral-800/50">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    <p className="text-sm text-neutral-400">Nenhum convite direto no momento.</p>
                  </div>
                )}
              </section>
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Megaphone className="h-5 w-5 text-secondary-500" /> Mural de Vagas</h2>
                {openJobs.length > 0 ? (
                  <div className="space-y-3">
                    {openJobs.map((j) => <JobCard key={j.id} job={j} variant="apply" />)}
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-50 p-6 text-center dark:bg-neutral-800/50">
                    <Megaphone className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    <p className="text-sm text-neutral-400">Nenhuma vaga aberta no momento.</p>
                  </div>
                )}
              </section>
            </div>
          )}
          {tab === 'personal' && <PersonalTab me={me} onSave={(patch) => { updateUser(me.id, patch); notify('Dados pessoais atualizados!'); }} />}
          {tab === 'address' && <AddressTab me={me} onSave={(addr: Address) => { updateUser(me.id, { address: addr }); notify('Endereço atualizado!'); }} />}
          {tab === 'specialties' && <SpecialtiesTab me={me} onToggleCat={(catId: string) => { const res = toggleCategory(me.id, catId); if (!res.ok) notify(res.error ?? 'Erro', 'warning'); else notify('Categoria atualizada'); }} onSave={(patch) => { updateUser(me.id, patch); notify('Valores atualizados!'); }} />}
          {tab === 'agenda' && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-1 font-display font-bold text-neutral-900 dark:text-white">Agenda interativa de disponibilidade</h2>
              <p className="mb-4 text-sm text-neutral-400">Selecione o turno ativo e clique nos dias do calendário para marcar sua disponibilidade. As cores indicam: laranja = manhã, azul claro = tarde, roxo = noite. Dias com múltiplos turnos ficam com cores divididas.</p>
              <AvailabilityCalendar dateAvailability={me.dateAvailability} editable onToggle={(dateKey: string, shift: ShiftSlot) => toggleDateShift(me.id, dateKey, shift)} />
            </section>
          )}
          {tab === 'wallet' && <WalletPanel userId={me.id} />}

          {tab === 'agenda' && reviewsAboutMe.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 font-display text-lg font-bold text-neutral-900 dark:text-white">Avaliações recebidas</h2>
              <div className="space-y-3">{reviewsAboutMe.map((r) => (
                <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center justify-between"><p className="font-semibold text-neutral-900 dark:text-white">{r.fromName}</p><Rating value={r.rating} /></div>
                  <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{r.comment}</p>
                </div>
              ))}</div>
            </section>
          )}
        </div>

        {/* Sidebar: Widget VIP (passando os anúncios filtrados a 60km) + Contracts */}
        <aside className="space-y-4">
          <VipSquareWidget ads={nearbyAds} />

          {myContracts.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 font-display font-bold text-neutral-900 dark:text-white">Suas contratações</h3>
              <div className="space-y-2.5">
                {myContracts.slice(0, 8).map((c) => (
                  <div key={c.id}>
                    <button onClick={() => setEscrowContract(c)} className="flex w-full items-center gap-2 rounded-xl border border-neutral-100 p-3 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                      <Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={36} />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{c.establishmentName}</p><p className="text-xs text-neutral-400">{formatCurrency(c.freelancerFee)}</p></div>
                      <Badge tone={c.status === 'completed' ? 'success' : c.status === 'paid' || c.status === 'checked_in' ? 'warning' : c.status === 'cancelled' ? 'error' : 'primary'}>
                        {c.status === 'requested' ? 'Pendente' : c.status === 'confirmed' ? 'Confirmado' : c.status === 'paid' ? 'Pago' : c.status === 'checked_in' ? 'Em serviço' : c.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </Badge>
                    </button>
                    {c.status === 'completed' && !c.reviewFromFreelancer && (
                      <button onClick={() => setReviewTarget(c)} className="mt-1 w-full text-center text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"><MessageSquare className="mr-1 inline h-3 w-3" /> Avaliar estabelecimento</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      {reviewTarget && <ReviewModal open={!!reviewTarget} onClose={() => setReviewTarget(null)} contractId={reviewTarget.id} fromId={me.id} fromName={me.name} toId={reviewTarget.establishmentId} toName={reviewTarget.establishmentName} />}
    </div>
  );
}

// TAB ESPECIALIDADES (Layout Profissional 2 Colunas)
function SpecialtiesTab({ me, onToggleCat, onSave }: { me: any; onToggleCat: (catId: string) => void; onSave: (patch: any) => void }) {
  const { data } = useApp();
  const plan = getPlan(me.vipTier ?? 'free', data.vipPlans);
  const [hourlyRate, setHourlyRate] = useState(String(me.hourlyRate ?? 0));
  const [dailyRate, setDailyRate] = useState(String(me.dailyRate ?? 0));
  const [serviceRadius, setServiceRadius] = useState(String(me.serviceRadiusKm ?? 25));
  const [interstate, setInterstate] = useState(me.acceptsInterstate ?? false);
  const [selectedMacro, setSelectedMacro] = useState(MACRO_CATEGORIES[0].id);

  const filteredCategories = CATEGORIES.filter(cat => cat.macro === selectedMacro);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white">
        <Tags className="h-5 w-5 text-primary-500" /> Especialidades e Valores
      </h2>

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

      <div className="flex h-[400px] border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden mb-6">
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

function PersonalTab({ me, onSave }: { me: any; onSave: (patch: any) => void }) { /* ... mantido igual ... */ }
function AddressTab({ me, onSave }: { me: any; onSave: (addr: any) => void }) { /* ... mantido igual ... */ }
function InfoBox({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-neutral-400">{label}</p><p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">{value}</p></div>; }
