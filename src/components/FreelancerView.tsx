import { useState } from 'react';
import { User as UserIcon, MapPin, Tags, Calendar, Crown, Wallet, Briefcase, Fingerprint, ShieldCheck, MessageSquare, Save, Inbox, Megaphone, Upload, Check, X, Globe } from 'lucide-react';
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

import { formatCurrency, getPlan, countAvailableSlots, maskCEP, maskCPF, maskPhone, formatDateTime } from '@/utils';
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
  const openJobs = data.jobs.filter((j) => {
    if (j.status !== 'active') return false;
    if (me.acceptsInterstate || me.unlimitedKm) return true;
    return !j.city || j.city.toLowerCase() === (me.address?.city || '').toLowerCase();
  });
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

  if (tab === 'vip') {
    return (
      <VipPanel 
        userId={me.id} 
        accountType="freelancer" 
        onBack={() => setTab('opportunities')} 
      />
    );
  }

  const activeInvites = myContracts.filter((c) => c.status === 'requested' || c.status === 'confirmed');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6 shadow-sm">
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
              <span className="text-sm text-neutral-400">{me.unlimitedKm ? '🌐 KM Livre / Disponível para viagens' : `${me.address?.city}, ${me.address?.state}`}</span>
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
      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
        {tabs.map((t) => { const Icon = t.icon; const active = tab === t.id; return <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'}`}><Icon className="h-4 w-4" /> {t.label}</button>; })}
      </div>

      <div className="mt-6">
        {tab === 'opportunities' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Coluna 1: Convites Diretos (Só expande se houver convites) */}
            {activeInvites.length > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm h-fit">
                <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Inbox className="h-5 w-5 text-primary-500" /> Convites Diretos</h2>
                <div className="space-y-3">
                  {activeInvites.map((c) => (
                    <button key={c.id} onClick={() => setEscrowContract(c)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 p-3 text-left transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                      <Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={40} />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{c.establishmentName}</p><p className="text-xs text-neutral-400">{formatCurrency(c.freelancerFee)} · {c.category}</p></div>
                      <Badge tone={c.status === 'confirmed' ? 'success' : 'warning'}>{c.status === 'requested' ? 'Pendente' : 'Confirmado'}</Badge>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Coluna 2: Mural de Vagas */}
            <section className={`rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm ${activeInvites.length === 0 ? 'lg:col-span-2' : ''}`}>
              <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Megaphone className="h-5 w-5 text-secondary-500" /> Mural de Vagas</h2>
              {openJobs.length > 0 ? (
                <div className="space-y-3">
                  {openJobs.map((j) => <JobCard key={j.id} job={j} variant="apply" />)}
                </div>
              ) : (
                <div className="rounded-xl bg-neutral-50 p-8 text-center dark:bg-neutral-800/50">
                  <Megaphone className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                  <p className="text-sm text-neutral-400">Nenhuma vaga aberta na sua região no momento.</p>
                </div>
              )}
            </section>

            {/* Coluna 3: Anúncios / Widgets na Vitrine */}
            <aside className="space-y-4">
              <VipSquareWidget pageType="freelancers" />
              {myContracts.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
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
        )}

        {tab === 'personal' && <PersonalTab me={me} onSave={(patch) => { updateUser(me.id, patch); notify('Dados pessoais atualizados com sucesso!'); }} />}
        {tab === 'address' && <AddressTab me={me} onSave={(addrPatch) => { updateUser(me.id, addrPatch); notify('Endereço e preferências atualizados com sucesso!'); }} />}
        {tab === 'specialties' && <SpecialtiesTab me={me} onToggleCat={(catId: string) => { const res = toggleCategory(me.id, catId); if (!res.ok) notify(res.error ?? 'Erro', 'warning'); else notify('Categoria atualizada'); }} onSave={(patch) => { updateUser(me.id, patch); notify('Valores atualizados!'); }} />}
        
        {tab === 'agenda' && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Agenda interativa de disponibilidade</h2>
              <p className="text-sm text-neutral-400">Selecione o turno ativo e clique nos dias do calendário para marcar sua disponibilidade. As cores indicam: laranja = manhã, azul claro = tarde, roxo = noite.</p>
            </div>
            <AvailabilityCalendar dateAvailability={me.dateAvailability} editable onToggle={(dateKey: string, shift: ShiftSlot) => toggleDateShift(me.id, dateKey, shift)} />
          </section>
        )}

        {tab === 'wallet' && <WalletPanel userId={me.id} />}

        {tab === 'agenda' && reviewsAboutMe.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 font-display text-lg font-bold text-neutral-900 dark:text-white">Avaliações recebidas</h2>
            <div className="space-y-3">{reviewsAboutMe.map((r) => (
              <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
                <div className="flex items-center justify-between"><p className="font-semibold text-neutral-900 dark:text-white">{r.fromName}</p><Rating value={r.rating} /></div>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{r.comment}</p>
              </div>
            ))}</div>
          </section>
        )}
      </div>

      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      {reviewTarget && <ReviewModal open={!!reviewTarget} onClose={() => setReviewTarget(null)} contractId={reviewTarget.id} fromId={me.id} fromName={me.name} toId={reviewTarget.establishmentId} toName={reviewTarget.establishmentName} />}
    </div>
  );
}

// ABA DADOS PESSOAIS COM UPLOAD REAL DE FOTO
function PersonalTab({ me, onSave }: { me: any; onSave: (patch: any) => void }) {
  const [name, setName] = useState(me.name || '');
  const [nickname, setNickname] = useState(me.nickname || '');
  const [phone, setPhone] = useState(me.phone || '');
  const [whatsapp, setWhatsapp] = useState(me.whatsapp || '');
  const [cpf, setCpf] = useState(me.cpf || '');
  const [asaasWalletId, setAsaasWalletId] = useState(me.asaasWalletId || '');
  const [bio, setBio] = useState(me.bio || '');
  const [photo, setPhoto] = useState(me.photo || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white">
        <UserIcon className="h-5 w-5 text-primary-500" /> Dados Pessoais
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Apelido / Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />
        <Input label="CPF" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} />
        <Input label="ID da Conta Asaas" value={asaasWalletId} onChange={(e) => setAsaasWalletId(e.target.value)} />
        
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-xs font-semibold text-neutral-500">Foto de Perfil (Carregar Arquivo)</label>
          <div className="flex items-center gap-4">
            <Avatar src={photo} alt="Preview" size={64} />
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              <Upload className="h-4 w-4" /> Escolher imagem
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Biografia / Apresentação</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
        </div>
      </div>
      <Button onClick={() => onSave({ name, nickname, phone, whatsapp, cpf, asaasWalletId, bio, photo })}><Save className="h-4 w-4" /> Salvar alterações</Button>
    </section>
  );
}

// ABA ENDEREÇO COM OPÇÃO DE KM LIVRE / VIAGENS
function AddressTab({ me, onSave }: { me: any; onSave: (patch: any) => void }) {
  const [cep, setCep] = useState(me.address?.cep || '');
  const [street, setStreet] = useState(me.address?.street || '');
  const [number, setNumber] = useState(me.address?.number || '');
  const [complement, setComplement] = useState(me.address?.complement || '');
  const [neighborhood, setNeighborhood] = useState(me.address?.neighborhood || '');
  const [city, setCity] = useState(me.address?.city || '');
  const [state, setState] = useState(me.address?.state || 'SP');
  const [unlimitedKm, setUnlimitedKm] = useState(me.unlimitedKm || false);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 space-y-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900 dark:text-white">
        <MapPin className="h-5 w-5 text-primary-500" /> Endereço Residencial / Atuação
      </h2>

      <div className="flex items-center justify-between p-4 rounded-xl border border-primary-100 bg-primary-50/50 dark:border-primary-900/30 dark:bg-primary-900/10">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="font-semibold text-sm text-neutral-900 dark:text-white">KM Livre / Disponível para viagens</p>
            <p className="text-xs text-neutral-500">Permite receber propostas e vagas de qualquer região ou cidade, ideal para profissionais que viajam para prestar serviços.</p>
          </div>
        </div>
        <input type="checkbox" checked={unlimitedKm} onChange={(e) => setUnlimitedKm(e.target.checked)} className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="CEP" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} />
        <div className="sm:col-span-2"><Input label="Logradouro (Rua)" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
        <Input label="Número" value={number} onChange={(e) => setNumber(e.target.value)} />
        <Input label="Complemento" value={complement} onChange={(e) => setComplement(e.target.value)} />
        <Input label="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select label="Estado (UF)" value={state} onChange={(e) => setState(e.target.value)}>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <Button onClick={() => onSave({ address: { cep, street, number, complement, neighborhood, city, state }, unlimitedKm })}><Save className="h-4 w-4" /> Salvar endereço</Button>
    </section>
  );
}

// TAB ESPECIALIDADES COM VALORES
function SpecialtiesTab({ me, onToggleCat, onSave }: { me: any; onToggleCat: (catId: string) => void; onSave: (patch: any) => void }) {
  const [hourlyRate, setHourlyRate] = useState(String(me.hourlyRate ?? 0));
  const [dailyRate, setDailyRate] = useState(String(me.dailyRate ?? 0));
  const [selectedMacro, setSelectedMacro] = useState(MACRO_CATEGORIES[0].id);

  const filteredCategories = CATEGORIES.filter(cat => cat.macro === selectedMacro);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
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

function InfoBox({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-neutral-400">{label}</p><p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">{value}</p></div>; }
