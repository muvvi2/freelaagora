import { useState } from 'react';
import { User as UserIcon, MapPin, Tags, Calendar, Crown, Wallet, Briefcase, Fingerprint, ShieldCheck, MessageSquare, Save, Inbox, Megaphone, Upload, Check } from 'lucide-react'; // Adicionei o Check aqui
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
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData'; // Adicionado MACRO_CATEGORIES

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
          {tab === 'vip' && <VipPanel userId={me.id} accountType="freelancer" />}
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

        <aside className="space-y-4">
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

// ============================================================
// TAB 3: Especialidades e Valores (Versão 2 Colunas)
// ============================================================
function SpecialtiesTab({ me, onToggleCat, onSave }: { me: import('@/types').User; onToggleCat: (catId: string) => void; onSave: (patch: Partial<import('@/types').User>) => void }) {
  const { data } = useApp();
  const plan = getPlan(me.vipTier ?? 'free', data.vipPlans);
  const [hourlyRate, setHourlyRate] = useState(String(me.hourlyRate ?? 0));
  const [dailyRate, setDailyRate] = useState(String(me.dailyRate ?? 0));
  const [serviceRadius, setServiceRadius] = useState(String(me.serviceRadiusKm ?? 25));
  const [interstate, setInterstate] = useState(me.acceptsInterstate ?? false);
  
  // Estado para a coluna da esquerda (Macros)
  const [selectedMacro, setSelectedMacro] = useState(MACRO_CATEGORIES[0].id);

  // Filtra categorias pela macro selecionada
  const filteredCategories = CATEGORIES.filter(cat => cat.macro === selectedMacro);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Tags className="h-5 w-5 text-primary-500" /> Especialidades e Valores</h2>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Categorias profissionais</label>
        
        {/* Layout Duas Colunas */}
        <div className="flex border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden h-[400px]">
          {/* Esquerda: Macros */}
          <div className="w-1/3 bg-neutral-50 dark:bg-neutral-800 overflow-y-auto border-r border-neutral-200 dark:border-neutral-700">
            {MACRO_CATEGORIES.map(macro => (
              <button
                key={macro.id}
                onClick={() => setSelectedMacro(macro.id)}
                className={`w-full p-4 text-left text-sm font-medium border-b border-neutral-200 dark:border-neutral-700 transition ${
                  selectedMacro === macro.id 
                  ? 'bg-white dark:bg-neutral-900 border-l-4 border-l-primary-500 text-primary-600' 
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                {macro.label}
              </button>
            ))}
          </div>

          {/* Direita: Especialidades */}
          <div className="w-2/3 overflow-y-auto p-4 space-y-1">
            {filteredCategories.map(cat => {
              const isSelected = (me.categories || []).includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => onToggleCat(cat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition ${
                    isSelected ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-neutral-50 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {cat.label}
                  {isSelected && <Check className="h-4 w-4 text-primary-600" />}
                </button>
              );
            })}
          </div>
        </div>
        
        {(me.categories ?? []).length >= plan.maxCategories && (
          <p className="mt-3 text-xs text-amber-600">Limite do plano {plan.label} atingido.</p>
        )}
      </div>

      {/* Outros campos (valores, etc) */}
      <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300"><MapPin className="h-4 w-4 text-primary-500" /> Área de Atendimento</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Raio de atendimento (km)</label>
            <input type="number" min={1} max={500} value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input type="checkbox" checked={interstate} onChange={(e) => setInterstate(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500/20" />
              Aceito contratos interestaduais
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Valor da Hora Comercial (R$/h)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="45" />
        <Input label="Valor da Diária Fechada (R$)" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="320" />
      </div>
      <Button className="mt-4" onClick={() => onSave({ hourlyRate: Number(hourlyRate) || 0, dailyRate: Number(dailyRate) || 0, serviceRadiusKm: Number(serviceRadius) || 25, acceptsInterstate: interstate })}><Save className="h-4 w-4" /> Salvar valores</Button>
    </section>
  );
}

function PersonalTab({ me, onSave }: { me: import('@/types').User; onSave: (patch: Partial<import('@/types').User>) => void }) {
  const [name, setName] = useState(me.name);
  const [nickname, setNickname] = useState(me.nickname ?? '');
  const [email, setEmail] = useState(me.email);
  const [bio, setBio] = useState(me.bio ?? '');
  const [photo, setPhoto] = useState(me.photo);
  const [verified, setVerified] = useState(me.documentVerified ?? false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><UserIcon className="h-5 w-5 text-primary-500" /> Dados Pessoais e Documentação</h2>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-2 mb-2">
          <label className="text-xs font-semibold text-neutral-500">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            <img 
              src={photo || "https://via.placeholder.com/150"} 
              alt="Preview" 
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 shadow-sm"
            />
            <label className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Carregar nova foto</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </label>
          </div>
        </div>

        <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Apelido / Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ex: Tigrão" />
        <div className="sm:col-span-2"><Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">CPF (mascarado)</label>
          <div className="flex items-center gap-2">
            <input readOnly value={me.cpf ? maskDocumentDisplay(me.cpf) : '—'} className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400" />
            {me.documentVerified ? <Badge tone="success"><ShieldCheck className="h-3 w-3" /> Verificado</Badge> : <Badge tone="neutral">Não verificado</Badge>}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Biografia</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" placeholder="Conte sobre sua experiência..." />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer sm:col-span-2">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 dark:border-neutral-600 dark:bg-neutral-800" />
          <span className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300"><Fingerprint className="h-4 w-4 text-secondary-500" /> Perfil Verificado por Documento</span>
        </label>
      </div>
      <Button className="mt-4" onClick={() => onSave({ name, nickname: nickname || undefined, email, bio, photo, documentVerified: verified })}><Save className="h-4 w-4" /> Salvar alterações</Button>
    </section>
  );
}

function AddressTab({ me, onSave }: { me: import('@/types').User; onSave: (addr: Address) => void }) {
  const [addr, setAddr] = useState<Address>(me.address);
  const { notify } = useToast();

  const handleCepChange = async (value: string) => {
    const masked = maskCEP(value);
    const cleanCep = masked.replace(/\D/g, '');
    
    setAddr((prev) => ({ ...prev, cep: masked }));

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setAddr((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          notify('Endereço encontrado e preenchido!', 'success');
        } else {
          notify('CEP não encontrado.', 'warning');
        }
      } catch (error) {
        notify('Erro ao buscar CEP.', 'error');
      }
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><MapPin className="h-5 w-5 text-primary-500" /> Endereço Completo</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="CEP" value={addr.cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" />
        <div className="sm:col-span-2"><Input label="Logradouro (Rua)" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} /></div>
        <Input label="Número" value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} />
        <Input label="Complemento" value={addr.complement ?? ''} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} />
        <Input label="Bairro" value={addr.neighborhood} onChange={(e) => setAddr({ ...addr, neighborhood: e.target.value })} />
        <Input label="Cidade" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
        <Select label="Estado (UF)" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })}>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <Button className="mt-4" onClick={() => onSave(addr)}><Save className="h-4 w-4" /> Salvar endereço</Button>
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-neutral-400">{label}</p><p className="mt-0.5 font-semibold text-neutral-900 dark:text-white">{value}</p></div>;
}
