import { useState, useMemo, Fragment } from 'react';
import { Search, SlidersHorizontal, Plus, Megaphone, Store, Users, FileText, Pencil, MapPin, Navigation, Crown, Globe, Calendar, Clock, Trash2, Pause, Play, CheckCircle2, Info, Briefcase, Filter } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Rating } from './ui/Rating';
import { FreelancerCard } from './FreelancerCard';
import { FreelancerDetailModal } from './FreelancerDetailModal';
import { JobCard } from './JobCard';
import { JobFormModal } from './JobFormModal';
import { EscrowFlowModal } from './EscrowFlowModal';
import { VipPanel } from './VipPanel';
import { EstablishmentEditModal } from './EstablishmentEditModal';
import { Modal } from './ui/Modal';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';
import { formatCurrency, formatDateBR, distanceBetween, isWithinRadius, isAvailableToday, isAvailableTomorrow, isFreelancerAvailableOn, isEstablishmentOnTrial, trialDaysLeft, contractStatusLabel, contractStatusTone, getIntermediationFeePercent, calculateFees } from '@/utils';
import type { User, Job, Contract } from '@/types';

type EstablishmentTab = 'professionals' | 'jobs' | 'contracts';

export function calculateDirectHireFee(
  hourlyRate: number,
  dailyRate: number,
  hours: number
): { freelancerFee: number; breakdown: { label: string; amount: number }[] } {
  const hRate = hourlyRate > 0 ? hourlyRate : (dailyRate > 0 ? dailyRate / 8 : 25);
  const dRate = dailyRate > 0 ? dailyRate : hRate * 8;

  if (hours === 8) {
    return {
      freelancerFee: dRate,
      breakdown: [{ label: 'Diária Padrão (8h)', amount: dRate }]
    };
  }

  if (hours < 8) {
    const firstHourPrice = Math.round(hRate * 1.4 * 100) / 100;
    const additionalHoursPrice = (hours - 1) * hRate;
    const totalCalculated = firstHourPrice + additionalHoursPrice;

    if (totalCalculated >= dRate) {
      return {
        freelancerFee: dRate,
        breakdown: [{ label: `Turno de ${hours}h (Teto da Diária)`, amount: dRate }]
      };
    }

    const breakdown = [
      { label: '1ª Hora com adicional (+40%)', amount: firstHourPrice }
    ];
    if (hours > 1) {
      breakdown.push({ label: `${hours - 1}h adicionais (${formatCurrency(hRate)}/h)`, amount: additionalHoursPrice });
    }

    return {
      freelancerFee: totalCalculated,
      breakdown
    };
  }

  const extraHours = hours - 8;
  const extraHourRate = Math.round(hRate * 1.25 * 100) / 100;
  const extraTotal = extraHours * extraHourRate;
  const freelancerFee = dRate + extraTotal;

  return {
    freelancerFee,
    breakdown: [
      { label: 'Diária Padrão (8h)', amount: dRate },
      { label: `${extraHours}h extras (+25% = ${formatCurrency(extraHourRate)}/h)`, amount: extraTotal }
    ]
  };
}

export function ContractorView() {
  const { currentUser, data, requestHire, categoryById, deleteJob, pauseJob } = useApp();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<EstablishmentTab>('professionals');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');
  const [useGps, setUseGps] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [dateFilter, setDateFilter] = useState<'any' | 'today' | 'tomorrow' | 'custom'>('any');
  const [customDate, setCustomDate] = useState('');
  const [viewing, setViewing] = useState<User | null>(null);
  const [directHireTarget, setDirectHireTarget] = useState<User | null>(null);
  const [directHours, setDirectHours] = useState<number>(8);
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [jobForm, setJobForm] = useState<{ open: boolean; editing: Job | null }>({ open: false, editing: null });
  const [editEstablishment, setEditEstablishment] = useState(false);
  const [viewVipPage, setViewVipPage] = useState(false);

  if (!currentUser || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-neutral-400">Carregando painel do estabelecimento...</p>
      </div>
    );
  }

  const me = currentUser;
  const myJobs = data.jobs?.filter((j) => j.establishmentId === me.id) || [];
  const myContracts = data.contracts?.filter((c) => c.establishmentId === me.id) || [];
  const totalApplicants = myJobs.reduce((acc, j) => acc + (j.applicants?.length || 0), 0);

  const handleGps = () => {
    if (useGps) { setUseGps(false); return; }
    if (!navigator.geolocation) { notify('Geolocalização não suportada neste navegador.', 'warning'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setUseGps(true); notify('Localização GPS detectada com sucesso!'); },
      () => { notify('Não foi possível obter sua localização GPS.', 'warning'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const establishmentCity = me.address?.city || 'Pitangueiras';
  const establishmentState = me.address?.state || 'SP';

  const origin = useGps && gpsLat != null && gpsLng != null
    ? { cep: '', street: '', number: '', neighborhood: '', city: 'GPS Atual', state: establishmentState, lat: gpsLat, lng: gpsLng }
    : (me.address || { cep: '', street: '', number: '', neighborhood: '', city: establishmentCity, state: establishmentState, lat: -21.01, lng: -48.22 });

  const filtered = useMemo(() => {
    if (!data.users) return [];
    let list = data.users.filter((f) => {
      if (f.accountType !== 'freelancer' || f.isAdmin || f.banned) return false;
      if (!isUnlimited && !isWithinRadius(f, origin, radiusKm)) return false;

      if (macroFilter !== 'all') {
        const macroCats = CATEGORIES.filter((c) => c.macro === macroFilter).map((c) => c.id);
        if (!(f.categories ?? []).some((c) => macroCats.includes(c))) return false;
      }
      if (category !== 'all' && !(f.categories ?? []).includes(category)) return false;
      if ((f.rating ?? 0) < minRating) return false;
      if (dateFilter === 'today' && !isAvailableToday(f)) return false;
      if (dateFilter === 'tomorrow' && !isAvailableTomorrow(f)) return false;
      if (dateFilter === 'custom' && customDate && !isFreelancerAvailableOn(f, customDate)) return false;
      if (query) {
        const q = query.toLowerCase();
        const catLabels = (f.categories ?? []).map((c) => categoryById(c)?.label.toLowerCase() ?? '').join(' ');
        if (!f.name.toLowerCase().includes(q) && !catLabels.includes(q) && !(f.bio ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const tierRank: Record<string, number> = { vip3: 0, vip2: 1, vip1: 2, free: 3 };
    list = [...list].sort((a, b) => {
      const tierDiff = (tierRank[a.vipTier ?? 'free'] ?? 3) - (tierRank[b.vipTier ?? 'free'] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'price') return (a.dailyRate ?? 9999) - (b.dailyRate ?? 9999);
      return distanceBetween(a.address, origin) - distanceBetween(b.address, origin);
    });
    return list;
  }, [data.users, origin, radiusKm, isUnlimited, macroFilter, category, minRating, dateFilter, customDate, query, sortBy, categoryById]);

  const openDirectHireModal = (f: User) => {
    setDirectHireTarget(f);
    setDirectHours(8);
  };

  const confirmDirectHire = () => {
    if (!directHireTarget) return;
    const { freelancerFee } = calculateDirectHireFee(
      directHireTarget.hourlyRate ?? 0,
      directHireTarget.dailyRate ?? 0,
      directHours
    );
    const feePercent = getIntermediationFeePercent(me, data.estVipPlans);
    const contract = requestHire(me.id, directHireTarget.id, null, directHours, freelancerFee);
    setDirectHireTarget(null);
    setEscrowContract(contract);
    notify('Solicitação de contratação enviada! Aguarde a confirmação do freelancer.');
  };

  if (viewVipPage) {
    return (
      <VipPanel 
        userId={me.id} 
        accountType="establishment" 
        onBack={() => setViewVipPage(false)} 
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 space-y-8 text-neutral-900 dark:text-white">
      
      {/* HEADER DO ESTABELECIMENTO */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar src={me.photo} alt={me.name} size={72} ring="vip" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">{me.name}</h1>
                <Badge tone="primary">{me.establishmentType}</Badge>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-neutral-400" /> {establishmentCity} - {establishmentState} 
                <span className="text-neutral-300 dark:text-neutral-700">·</span> 
                <Rating value={me.rating ?? 0} count={me.reviewsCount ?? 0} />
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setEditEstablishment(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Editar Perfil
            </Button>
            <Button className="bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-md hover:from-warning-600 hover:to-warning-700" onClick={() => setViewVipPage(true)}>
              <Crown className="h-4 w-4 mr-2" /> Plano VIP
            </Button>
          </div>
        </div>

        {isEstablishmentOnTrial(me) && (
          <div className="mt-6 flex items-center gap-3.5 rounded-xl border border-success-200 bg-success-50/70 p-4 dark:border-success-500/30 dark:bg-success-500/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-500 text-white shadow-sm">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-success-800 dark:text-success-300">
                Período de teste gratuito ativo — {trialDaysLeft(me)} dias restantes
              </p>
              <p className="text-xs text-success-700 dark:text-success-400 mt-0.5">Você possui isenção completa nas taxas de intermediação durante os 15 primeiros dias.</p>
            </div>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard 
            icon={Megaphone} 
            label="Vagas Publicadas" 
            value={String(myJobs.length)} 
            tone="primary" 
            onClick={() => setActiveTab('jobs')}
          />
          <StatCard 
            icon={Users} 
            label="Candidaturas Recebidas" 
            value={String(totalApplicants)} 
            tone="secondary" 
            onClick={() => setActiveTab('jobs')}
          />
          <StatCard 
            icon={FileText} 
            label="Contratações Realizadas" 
            value={String(myContracts.length)} 
            tone="accent" 
            onClick={() => setActiveTab('contracts')}
          />
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS (TABS) */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('professionals')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === 'professionals' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <Users className="h-4 w-4" /> Buscar Profissionais
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === 'jobs' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <Briefcase className="h-4 w-4" /> Minhas Vagas ({myJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${activeTab === 'contracts' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <FileText className="h-4 w-4" /> Contratos e Escrow ({myContracts.length})
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA: BUSCAR PROFISSIONAIS */}
      {activeTab === 'professionals' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Pesquisar por nome, especialidade ou descrição..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900 transition" 
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={handleGps} className={`flex-1 md:flex-initial ${useGps ? 'border-secondary-400 text-secondary-600 bg-secondary-50' : ''}`}>
                  <Navigation className={`h-4 w-4 mr-2 ${useGps ? 'fill-current' : ''}`} /> GPS
                </Button>
                <Button variant="outline" onClick={() => setShowFilters((s) => !s)} className={`flex-1 md:flex-initial ${showFilters ? 'border-primary-400 text-primary-600' : ''}`}>
                  <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
                </Button>
              </div>
            </div>

            {/* MACRO CATEGORIAS */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Filtrar por Área:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setMacroFilter('all'); setCategory('all'); }}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${macroFilter === 'all' ? 'bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'}`}
                >
                  Todas as Áreas
                </button>
                {MACRO_CATEGORIES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMacroFilter(m.id); setCategory('all'); }}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${macroFilter === m.id ? 'text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'}`}
                    style={macroFilter === m.id ? { backgroundColor: m.color } : undefined}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTROLE DE RAIO */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <MapPin className="h-4 w-4 shrink-0 text-primary-500" />
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Raio de Distância</span>
                <input 
                  type="range" 
                  min={1} 
                  max={100} 
                  disabled={isUnlimited} 
                  value={radiusKm} 
                  onChange={(e) => setRadiusKm(Number(e.target.value))} 
                  className={`flex-1 accent-primary-500 cursor-pointer ${isUnlimited ? 'opacity-40' : ''}`} 
                />
                <span className="w-20 text-right text-xs font-bold text-neutral-800 dark:text-neutral-200">{isUnlimited ? 'Nacional' : `${radiusKm} km`}</span>
              </div>
              <Button size="sm" variant={isUnlimited ? 'warning' : 'outline'} onClick={() => setIsUnlimited(!isUnlimited)}>
                <Globe className="h-4 w-4 mr-1.5" /> {isUnlimited ? 'Km Livre Ativo' : 'Ativar Km Livre'}
              </Button>
            </div>
          </div>

          {/* GRID DE PROFISSIONAIS */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => (
              <FreelancerCard key={f.id} freelancer={f} onHire={openDirectHireModal} onView={setViewing} distanceKm={distanceBetween(f.address, origin)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
              <Users className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">Nenhum profissional encontrado</p>
              <p className="text-xs text-neutral-400 mt-1">Tente expandir o raio de busca ou remover os filtros ativos.</p>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA: MINHAS VAGAS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div>
              <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Gerenciamento de Vagas</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Publique oportunidades para atrair candidatos qualificados na plataforma.</p>
            </div>
            <Button onClick={() => setJobForm({ open: true, editing: null })}>
              <Plus className="h-4 w-4 mr-2" /> Publicar Nova Vaga
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myJobs.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
                <Briefcase className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">Nenhuma vaga publicada</p>
                <p className="text-xs text-neutral-400 mt-1">Crie sua primeira vaga para começar a receber candidaturas.</p>
                <div className="mt-4">
                  <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}>Publicar Vaga Agora</Button>
                </div>
              </div>
            )}
            {myJobs.map((j) => <JobCard key={j.id} job={j} variant="manage" />)}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: CONTRATOS E ESCROW */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Histórico de Contratações e Custódia (Escrow)</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Acompanhe o status dos pagamentos retidos em garantia e liberações de valores.</p>
          </div>

          <div className="space-y-3">
            {myContracts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
                <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">Nenhuma contratação realizada</p>
                <p className="text-xs text-neutral-400 mt-1">Quando você contratar um profissional, o fluxo de escrow aparecerá aqui.</p>
              </div>
            ) : (
              myContracts.map((contract) => (
                <div key={contract.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-4">
                    <Avatar src={contract.freelancerPhoto} alt={contract.freelancerName} size={48} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base text-neutral-900 dark:text-white">{contract.freelancerName}</p>
                        <Badge tone={contractStatusTone(contract.status)}>{contractStatusLabel(contract.status)}</Badge>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Turno: {contract.hours}h · Total em Garantia: <strong className="text-neutral-700 dark:text-neutral-200">{formatCurrency(contract.total)}</strong>
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEscrowContract(contract)}>
                    Ver Detalhes do Escrow
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONTRATAÇÃO DIRETA */}
      {directHireTarget && (
        <Modal open={!!directHireTarget} onClose={() => setDirectHireTarget(null)} title={`Contratar ${directHireTarget.name}`} size="md">
          {(() => {
            const feeInfo = calculateDirectHireFee(
              directHireTarget.hourlyRate ?? 0,
              directHireTarget.dailyRate ?? 0,
              directHours
            );
            const feePercent = getIntermediationFeePercent(me, data.estVipPlans);
            const { fee, total } = calculateFees(feeInfo.freelancerFee, feePercent);

            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <Avatar src={directHireTarget.photo} alt={directHireTarget.name} size={52} />
                  <div>
                    <p className="font-bold text-base text-neutral-900 dark:text-white">{directHireTarget.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Hora Padrão: {formatCurrency(directHireTarget.hourlyRate ?? 25)}/h · Diária (8h): {formatCurrency(directHireTarget.dailyRate ?? 180)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-600 dark:text-neutral-300">Duração do Turno de Trabalho:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">{directHours} hora{directHours > 1 ? 's' : ''}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={directHours}
                    onChange={(e) => setDirectHours(Number(e.target.value))}
                    className="w-full accent-primary-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>1h (Mínimo)</span>
                    <span>8h (Diária)</span>
                    <span>24h</span>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 space-y-2.5 text-xs">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 border-b pb-2 dark:border-neutral-800 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-primary-500" /> Detalhamento de Custos
                  </p>
                  
                  {feeInfo.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>{item.label}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between font-semibold text-neutral-900 dark:text-white pt-2 border-t dark:border-neutral-800">
                    <span>Subtotal do Profissional</span>
                    <span>{formatCurrency(feeInfo.freelancerFee)}</span>
                  </div>

                  <div className="flex justify-between text-neutral-500">
                    <span>Taxa da Plataforma ({feePercent}%)</span>
                    <span>{fee === 0 ? 'Isento (VIP)' : formatCurrency(fee)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-extrabold text-primary-600 dark:text-primary-400 pt-2 border-t border-dashed dark:border-neutral-800">
                    <span>Total no Escrow</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button fullWidth size="lg" onClick={confirmDirectHire}>
                  Confirmar Contratação ({formatCurrency(total)})
                </Button>
              </div>
            );
          })()}
        </Modal>
      )}

      {viewing && <FreelancerDetailModal freelancer={viewing} open={!!viewing} onClose={() => setViewing(null)} onHire={openDirectHireModal} />}
      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      <JobFormModal open={jobForm.open} onClose={() => setJobForm({ open: false, editing: null })} editing={jobForm.editing} establishment={me} />
      <EstablishmentEditModal establishment={me} open={editEstablishment} onClose={() => setEditEstablishment(false)} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, onClick }: { icon: typeof Store; label: string; value: string; tone: 'primary' | 'secondary' | 'accent' | 'neutral'; onClick?: () => void }) {
  const toneClass = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400',
    accent: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  }[tone];
  return (
    <div onClick={onClick} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm cursor-pointer transition hover:border-primary-300 hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-6 w-6" /></div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold leading-none text-neutral-900 dark:text-white">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-neutral-400">{label}</p>
      </div>
    </div>
  );
}
