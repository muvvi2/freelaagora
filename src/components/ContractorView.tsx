import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Plus, Megaphone, Store, Users, FileText, Pencil, MapPin, Navigation, Crown, Globe } from 'lucide-react';
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
import { VipSquareWidget } from './VipSquareWidget';
import { EstablishmentEditModal } from './EstablishmentEditModal';
import { CATEGORIES, MACRO_CATEGORIES } from '@/mockData';
import { formatCurrency, distanceBetween, isWithinRadius, isAvailableToday, isAvailableTomorrow, isFreelancerAvailableOn, isEstablishmentOnTrial, trialDaysLeft } from '@/utils';
import type { User, Job, Contract } from '@/types';

export function ContractorView() {
  const { currentUser, data, requestHire, categoryById } = useApp();
  const { notify } = useToast();

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
  const [viewVipPage, setViewVipPage] = useState(false);

  if (!currentUser) return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-sm text-neutral-400">Carregando...</p></div>;

  const me = currentUser;
  const myJobs = data.jobs.filter((j) => j.establishmentId === me.id);
  const myContracts = data.contracts.filter((c) => c.establishmentId === me.id);

  const handleGps = () => {
    if (useGps) { setUseGps(false); return; }
    if (!navigator.geolocation) { notify('Geolocalização não suportada.', 'warning'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setUseGps(true); },
      () => notify('Não foi possível obter localização.', 'warning'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const origin = useGps && gpsLat != null && gpsLng != null
    ? { cep: '', street: '', number: '', neighborhood: '', city: 'GPS', state: me.address?.state || 'SP', lat: gpsLat, lng: gpsLng }
    : (me.address || { cep: '', street: '', number: '', neighborhood: '', city: 'Pitangueiras', state: 'SP', lat: -21.01, lng: -48.22 });

  const filtered = useMemo(() => {
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
    return list.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'price') return (a.dailyRate ?? 9999) - (b.dailyRate ?? 9999);
      return distanceBetween(a.address, origin) - distanceBetween(b.address, origin);
    });
  }, [data.users, origin, radiusKm, isUnlimited, macroFilter, category, minRating, dateFilter, customDate, query, sortBy, categoryById]);

  const handleHire = (f: User) => {
    const contract = requestHire(me.id, f.id, null, 8, f.dailyRate ?? 0);
    setEscrowContract(contract);
  };

  if (viewVipPage) return <VipPanel userId={me.id} accountType="establishment" onBack={() => setViewVipPage(false)} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <Avatar src={me.photo} alt={me.name} size={60} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{me.name}</h1>
              <Badge tone="primary">{me.establishmentType}</Badge>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{me.address?.city || 'Pitangueiras'} · <Rating value={me.rating ?? 0} count={0} /></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditEstablishment(true)}><Pencil className="h-3.5 w-3.5" /> Editar Perfil</Button>
          <Button size="sm" className="bg-gradient-to-r from-warning-500 to-warning-600 text-white" onClick={() => setViewVipPage(true)}><Crown className="h-3.5 w-3.5" /> Plano VIP</Button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
        
        {/* ESQUERDA: Slot 1 (600x900) */}
        <aside className="hidden lg:block space-y-4">
          <div className="sticky top-6 w-full aspect-[600/900] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
             <VipSquareWidget pageType="establishments" slot={1} />
          </div>
        </aside>

        {/* CENTRO: Feed */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Profissionais na sua região</h2>
          <div className="space-y-3">
             <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome..." className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-primary-400 dark:border-neutral-700 dark:bg-neutral-800" />
                </div>
                <Button variant="outline" onClick={handleGps}><Navigation className="h-4 w-4" /></Button>
             </div>
             <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((f) => <FreelancerCard key={f.id} freelancer={f} onHire={handleHire} onView={setViewing} distanceKm={distanceBetween(f.address, origin)} />)}
             </div>
          </div>
        </div>

        {/* DIREITA: Vagas e Banners Intercalados */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
             <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 dark:text-white">Minhas vagas</h3>
                <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}><Plus className="h-4 w-4" /></Button>
             </div>
             {myJobs.length > 0 && <JobCard job={myJobs[0]} variant="manage" />}
          </div>

          {/* Slot 2 (600x500) */}
          <div className="w-full aspect-[6/5] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <VipSquareWidget pageType="establishments" slot={2} />
          </div>

          {myJobs.slice(1).map(j => <JobCard key={j.id} job={j} variant="manage" />)}

          {/* Slot 3 (600x200) */}
          <div className="w-full aspect-[3/1] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <VipSquareWidget pageType="establishments" slot={3} />
          </div>
        </aside>
      </div>

      {viewing && <FreelancerDetailModal freelancer={viewing} open={!!viewing} onClose={() => setViewing(null)} onHire={handleHire} />}
      {escrowContract && <EscrowFlowModal contract={escrowContract} open={!!escrowContract} onClose={() => setEscrowContract(null)} />}
      <JobFormModal open={jobForm.open} onClose={() => setJobForm({ open: false, editing: null })} editing={jobForm.editing} establishment={me} />
      <EstablishmentEditModal establishment={me} open={editEstablishment} onClose={() => setEditEstablishment(false)} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: any }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><p className="text-lg font-extrabold text-neutral-900 dark:text-white">{value}</p><p className="text-xs text-neutral-400">{label}</p></div>
    </div>
  );
}
