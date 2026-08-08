import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, Megaphone, Store, Users, FileText, Pencil, MapPin, Download, Navigation, Calendar, Star, DollarSign, Crown, Globe } from 'lucide-react';
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
import { Modal } from './ui/Modal';
import { EstablishmentEditModal } from './EstablishmentEditModal';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';
import { formatCurrency, downloadTaxReceipt, distanceBetween, isWithinRadius, isAvailableToday, isAvailableTomorrow, isFreelancerAvailableOn, isEstablishmentOnTrial, trialDaysLeft, formatDateBR } from '@/utils';
import type { User, Job, Contract } from '@/types';

export function ContractorView() {
  const { currentUser, data, requestHire, categoryById } = useApp();
  const { notify } = useToast();
  const me = currentUser!;

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
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [jobForm, setJobForm] = useState<{ open: boolean; editing: Job | null }>({ open: false, editing: null });
  const [editEstablishment, setEditEstablishment] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);

  const myJobs = data.jobs.filter((j) => j.establishmentId === me.id);
  const myContracts = data.contracts.filter((c) => c.establishmentId === me.id);

  const handleGps = () => {
    if (useGps) { setUseGps(false); return; }
    if (!navigator.geolocation) { notify('Geolocalização não suportada neste navegador.', 'warning'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setUseGps(true); notify('Localização GPS detectada com sucesso!'); },
      () => { notify('Não foi possível obter sua localização GPS.', 'warning'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const origin = useGps && gpsLat != null && gpsLng != null
    ? { cep: '', street: '', number: '', neighborhood: '', city: 'GPS Atual', state: me.address?.state || 'SP', lat: gpsLat, lng: gpsLng }
    : (me.address || { cep: '', street: '', number: '', neighborhood: '', city: 'São Paulo', state: 'SP', lat: -23.56, lng: -46.65 });

  const establishmentCity = origin.city;
  const establishmentState = origin.state;

  const filtered = useMemo(() => {
    let list = data.users.filter((f) => {
      if (f.accountType !== 'freelancer' || f.isAdmin || f.banned) return false;
      
      // Filtro Geográfico Real por Raio em KM (se Km Livre não estiver ativo)
      if (!isUnlimited && !isWithinRadius(f, origin, radiusKm)) return false;

      // Macro category filter
      if (macroFilter !== 'all') {
        const macroCats = CATEGORIES.filter((c) => c.macro === macroFilter).map((c) => c.id);
        if (!(f.categories ?? []).some((c) => macroCats.includes(c))) return false;
      }
      // Specific category filter
      if (category !== 'all' && !(f.categories ?? []).includes(category)) return false;
      // Rating filter
      if ((f.rating ?? 0) < minRating) return false;
      // Date availability filter
      if (dateFilter === 'today' && !isAvailableToday(f)) return false;
      if (dateFilter === 'tomorrow' && !isAvailableTomorrow(f)) return false;
      if (dateFilter === 'custom' && customDate && !isFreelancerAvailableOn(f, customDate)) return false;
      // Text search
      if (query) {
        const q = query.toLowerCase();
        const catLabels = (f.categories ?? []).map((c) => categoryById(c)?.label.toLowerCase() ?? '').join(' ');
        if (!f.name.toLowerCase().includes(q) && !catLabels.includes(q) && !(f.bio ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });

    // 3-tier sort: VIP tier → chosen sort → distance
    const tierRank: Record<string, number> = { vip3: 0, vip2: 1, vip1: 2, free: 3 };
    list = [...list].sort((a, b) => {
      const tierDiff = (tierRank[a.vipTier ?? 'free'] ?? 3) - (tierRank[b.vipTier ?? 'free'] ?? 3);
      if (tierDiff !== 0) return tierDiff;
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'price') return (a.dailyRate ?? 9999) - (b.dailyRate ?? 9999);
      // distance sort (default)
      return distanceBetween(a.address, origin) - distanceBetween(b.address, origin);
    });
    return list;
  }, [data.users, origin, radiusKm, isUnlimited, macroFilter, category, minRating, dateFilter, customDate, query, sortBy, categoryById]);

  // Lista dinâmica de cidades presentes no raio filtrado
  const matchingCities = useMemo(() => {
    if (isUnlimited) return ['Todas as cidades (Km Livre / Nacional)'];
    const citiesSet = new Set<string>();
    filtered.forEach((f) => {
      if (f.address?.city) {
        citiesSet.add(f.address.city);
      }
    });
    const arr = Array.from(citiesSet);
    return arr.length > 0 ? arr : [establishmentCity];
  }, [filtered, isUnlimited, establishmentCity]);

  const handleHire = (f: User) => {
    const hours = 8;
    const fee = f.dailyRate ?? 0;
    if (fee <= 0) { notify('Este freelancer não definiu um valor de diária ainda.', 'warning'); return; }
    const contract = requestHire(me.id, f.id, null, hours, fee);
    setEscrowContract(contract);
    notify('Solicitação de contratação enviada! Aguarde a confirmação do freelancer.');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Establishment banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <img src={me.photo} alt={me.name} className="h-32 w-full object-cover sm:h-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent" />
        <div className="absolute bottom-0 left-0 flex w-full items-end justify-between gap-3 p-4">
          <div className="flex items-end gap-3">
            <div className="rounded-xl border-2 border-white bg-white p-1 shadow-lg dark:border-neutral-900"><Avatar src={me.photo} alt={me.name} size={52} /></div>
            <div className="text-white">
              <h1 className="font-display text-xl font-extrabold drop-shadow sm:text-2xl">{me.name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
                <Rating value={me.rating ?? 0} count={me.reviewsCount ?? 0} />
                <span className="text-white/80">{me.establishmentType} · {establishmentCity} - {establishmentState}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20" onClick={() => setEditEstablishment(true)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
            <Button size="sm" className="bg-gradient-to-r from-warning-500 to-warning-600 text-white shadow-lg hover:from-warning-600 hover:to-warning-700" onClick={() => setVipOpen(true)}><Crown className="h-3.5 w-3.5" /> Plano VIP</Button>
          </div>
        </div>
      </div>

      {isEstablishmentOnTrial(me) && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-success-200 bg-success-50 p-4 dark:border-success-500/30 dark:bg-success-500/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-500 text-white">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-success-800 dark:text-success-300">
              Período de teste gratuito — {trialDaysLeft(me)} dias restantes {me.trialEndsAt ? `(Expira em ${formatDateBR(me.trialEndsAt)})` : ''}
            </p>
            <p className="text-xs text-success-700 dark:text-success-400">Você não paga nenhuma taxa de intermediação durante os 15 primeiros dias. Após esse período, as taxas do seu plano serão aplicadas automaticamente.</p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Megaphone} label="Vagas publicadas" value={String(myJobs.length)} tone="primary" />
        <StatCard icon={Users} label="Candidaturas" value={String(myJobs.reduce((acc, j) => acc + j.applicants.length, 0))} tone="secondary" />
        <StatCard icon={FileText} label="Contratações" value={String(myContracts.length)} tone="accent" />
        <StatCard icon={MapPin} label="Profissionais próximos" value={String(filtered.length)} tone="neutral" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Freelancer feed */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Profissionais na sua região</h2>
              <p className="text-xs text-neutral-400">
                {isUnlimited 
                  ? 'Filtrando por: Km Livre (Atendimento Nacional / Sem Limite de Raio)' 
                  : `Filtrando a até ${radiusKm} km de ${establishmentCity} - ${establishmentState}. Cidades no raio: ${matchingCities.join(', ')}`}
              </p>
            </div>
          </div>

          {/* Search + filters */}
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome, categoria ou descrição..."
                  className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
              </div>
              <Button variant="outline" onClick={handleGps} className={useGps ? 'border-secondary-400 text-secondary-600 bg-secondary-50' : ''} title="Usar minha localização GPS"><Navigation className={`h-4 w-4 ${useGps ? 'fill-current' : ''}`} /></Button>
              <Button variant="outline" onClick={() => setShowFilters((s) => !s)} className={showFilters ? 'border-primary-400 text-primary-600' : ''}><SlidersHorizontal className="h-4 w-4" /></Button>
            </div>

            {/* Macro category chips em Grid (4 colunas por linha) */}
            <div>
              <p className="mb-2 text-xs font-semibold text-neutral-500">Categorias:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => { setMacroFilter('all'); setCategory('all'); }}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition text-center truncate ${
                    macroFilter === 'all'
                      ? 'bg-neutral-900 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  Todas
                </button>
                {MACRO_CATEGORIES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMacroFilter(m.id); setCategory('all'); }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition text-center truncate ${
                      macroFilter === m.id ? 'text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                    style={macroFilter === m.id ? { backgroundColor: m.color } : undefined}
                    title={m.label}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance slider / Km Livre */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-500">Distância Máxima</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  disabled={isUnlimited}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className={`flex-1 accent-primary-500 ${isUnlimited ? 'opacity-40' : ''}`}
                />
                <span className="w-16 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {isUnlimited ? 'Ilimitado' : `${radiusKm}km`}
                </span>
              </div>
              <Button
                size="sm"
                variant={isUnlimited ? 'warning' : 'outline'}
                onClick={() => setIsUnlimited(!isUnlimited)}
              >
                <Globe className="h-4 w-4" /> {isUnlimited ? 'Km Livre Ativo' : 'Ativar Km Livre'}
              </Button>
            </div>

            {showFilters && (
              <div className="animate-slide-down grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-500">Subcategoria</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                    <option value="all">Todas</option>
                    {CATEGORIES.filter((c) => macroFilter === 'all' || c.macro === macroFilter).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-500">Avaliação mínima</label>
                  <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                    <option value={0}>Qualquer</option>
                    <option value={4.5}>4.5+</option>
                    <option value={4.7}>4.7+</option>
                    <option value={4.9}>4.9+</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-neutral-500"><Calendar className="h-3 w-3" /> Disponibilidade</label>
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as 'any' | 'today' | 'tomorrow' | 'custom')} className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                    <option value="any">Qualquer dia</option>
                    <option value="today">Disponível hoje</option>
                    <option value="tomorrow">Disponível amanhã</option>
                    <option value="custom">Data específica</option>
                  </select>
                </div>
                {dateFilter === 'custom' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-neutral-500">Data</label>
                    <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-neutral-500">Ordenar por</label>
                  <div className="flex gap-2">
                    <SortChip active={sortBy === 'distance'} onClick={() => setSortBy('distance')} icon={Navigation} label="Mais próximos" />
                    <SortChip active={sortBy === 'rating'} onClick={() => setSortBy('rating')} icon={Star} label="Melhor avaliação" />
                    <SortChip active={sortBy === 'price'} onClick={() => setSortBy('price')} icon={DollarSign} label="Menor diária" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {useGps && <p className="mb-2 flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-400"><Navigation className="h-3 w-3 fill-current" /> Usando sua localização GPS atual</p>}
          <p className="mb-3 text-xs text-neutral-400"><strong className="text-neutral-600 dark:text-neutral-300">{filtered.length}</strong> profissionais encontrados dentro dos critérios de distância configurados</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((f) => <FreelancerCard key={f.id} freelancer={f} onHire={handleHire} onView={setViewing} distanceKm={distanceBetween(f.address, origin)} />)}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700">
              <p className="text-neutral-400">Nenhum profissional encontrado com esses filtros. Tente aumentar o raio, ativar o Km Livre ou limpar os filtros.</p>
            </div>
          )}
        </div>

        {/* Sidebar: my jobs + active contracts */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-bold text-neutral-900 dark:text-white">Minhas vagas</h3>
              <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}><Plus className="h-4 w-4" /> Publicar</Button>
            </div>
            <div className="space-y-3">
              {myJobs.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">Nenhuma vaga publicada.</p>}
              {myJobs.map((j) => <JobCard key={j.id} job={j} variant="manage" />)}
            </div>
          </div>

          {myContracts.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 font-display font-bold text-neutral-900 dark:text-white">Contratações em andamento</h3>
              <div className="space-y-2">
                {myContracts.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex w-full items-center gap-2 rounded-lg border border-neutral-100 p-2 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                    <button onClick={() => setEscrowContract(c)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">{c.freelancerName}</p>
                        <p className="text-xs text-neutral-400">{formatCurrency(c.total)} · {c.platformFeePercentage}% taxa</p>
                      </div>
                    </button>
                    <Badge tone={c.status === 'completed' ? 'success' : c.status === 'paid' ? 'warning' : 'primary'}>{c.status}</Badge>
                    {c.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => downloadTaxReceipt(c)}>
                        <Download className="h-3.5 w-3.5" /> Baixar Comprovante
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      {viewing && <FreelancerDetailModal freelancer={viewing} open={!!viewing} onClose={() => setViewing(null)} onHire={handleHire} />}
      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      <JobFormModal open={jobForm.open} onClose={() => setJobForm({ open: false, editing: null })} editing={jobForm.editing} establishment={me} />
      <EstablishmentEditModal establishment={me} open={editEstablishment} onClose={() => setEditEstablishment(false)} />
      <Modal open={vipOpen} onClose={() => setVipOpen(false)} title="Plano de Destaque" size="lg">
        <VipPanel userId={me.id} accountType="establishment" />
      </Modal>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Store; label: string; value: string; tone: 'primary' | 'secondary' | 'accent' | 'neutral' }) {
  const toneClass = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400',
    accent: 'bg-accent-100 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><p className="font-display text-lg font-extrabold leading-none text-neutral-900 dark:text-white">{value}</p><p className="mt-0.5 truncate text-xs text-neutral-400">{label}</p></div>
    </div>
  );
}

function SortChip({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Star; label: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? 'bg-primary-500 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
