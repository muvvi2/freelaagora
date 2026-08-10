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

  if (!currentUser || !data) return <div className="p-8 text-center text-neutral-400">Carregando...</div>;

  const me = currentUser;
  const myJobs = data.jobs?.filter((j) => j.establishmentId === me.id) || [];
  const myContracts = data.contracts?.filter((c) => c.establishmentId === me.id) || [];

  const origin = useGps && gpsLat != null && gpsLng != null ? { city: 'GPS', state: 'SP', lat: gpsLat, lng: gpsLng } : (me.address || { city: 'Pitangueiras', state: 'SP', lat: -21.01, lng: -48.22 });

  const filtered = useMemo(() => {
    return data.users.filter((f) => {
      if (f.accountType !== 'freelancer' || f.isAdmin || f.banned) return false;
      if (!isUnlimited && !isWithinRadius(f, origin, radiusKm)) return false;
      if (macroFilter !== 'all' && !(f.categories ?? []).some((c) => CATEGORIES.find(cat => cat.id === c)?.macro === macroFilter)) return false;
      if (category !== 'all' && !(f.categories ?? []).includes(category)) return false;
      return true;
    }).sort((a, b) => distanceBetween(a.address, origin) - distanceBetween(b.address, origin));
  }, [data.users, origin, radiusKm, isUnlimited, macroFilter, category]);

  if (viewVipPage) return <VipPanel userId={me.id} accountType="establishment" onBack={() => setViewVipPage(false)} />;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-6">
      
      {/* 1. TOPO: Perfil e Anúncio Principal */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
        <div className="w-full aspect-[600/900] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800">
           <VipSquareWidget pageType="establishments" slot={1} />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <Avatar src={me.photo} alt={me.name} size={48} />
              <div>
                <h1 className="font-bold text-lg">{me.name}</h1>
                <Badge tone="primary">{me.establishmentType}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditEstablishment(true)}><Pencil className="h-4 w-4 mr-1" /> Editar</Button>
              <Button size="sm" onClick={() => setViewVipPage(true)}><Crown className="h-4 w-4 mr-1" /> VIP</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
             <CompactStatCard icon={Megaphone} label="Vagas" value={String(myJobs.length)} tone="primary" />
             <CompactStatCard icon={Users} label="Candidatos" value={String(myJobs.reduce((acc, j) => acc + j.applicants.length, 0))} tone="secondary" />
             <CompactStatCard icon={FileText} label="Contratos" value={String(myContracts.length)} tone="accent" />
             <CompactStatCard icon={MapPin} label="Próximos" value={String(filtered.length)} tone="neutral" />
          </div>
        </div>
      </div>

      {/* 2. FEED PRINCIPAL */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        
        {/* COLUNA ESQUERDA: Filtros e Profissionais */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Profissionais na sua região</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            <button onClick={() => { setMacroFilter('all'); setCategory('all'); }} className={`p-2 text-xs font-semibold rounded-lg ${macroFilter === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}>Todas</button>
            {MACRO_CATEGORIES.map(m => (
              <button key={m.id} onClick={() => setMacroFilter(m.id)} className={`p-2 text-xs font-semibold rounded-lg ${macroFilter === m.id ? 'text-white' : 'bg-neutral-100'}`} style={macroFilter === m.id ? { backgroundColor: m.color } : {}}>{m.label}</button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map(f => <FreelancerCard key={f.id} freelancer={f} onHire={() => {}} onView={setViewing} distanceKm={distanceBetween(f.address, origin)} />)}
          </div>
        </div>

        {/* COLUNA DIREITA: Minhas Vagas (Sticky) */}
        <aside className="sticky top-24 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Minhas vagas</h3>
                <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}><Plus className="h-4 w-4" /></Button>
             </div>
             {myJobs.length > 0 && <JobCard job={myJobs[0]} variant="manage" />}
             
             {/* SLOT 2 LOGO ABAIXO DA PRIMEIRA VAGA */}
             <div className="mt-4 w-full aspect-[6/5] overflow-hidden rounded-xl">
               <VipSquareWidget pageType="establishments" slot={2} />
             </div>

             {myJobs.slice(1).map(j => <JobCard key={j.id} job={j} variant="manage" />)}
          </div>
        </aside>
      </div>

      {/* Modais */}
      {viewing && <FreelancerDetailModal freelancer={viewing} open={!!viewing} onClose={() => setViewing(null)} onHire={() => {}} />}
      <JobFormModal open={jobForm.open} onClose={() => setJobForm({ open: false, editing: null })} editing={jobForm.editing} establishment={me} />
    </div>
  );
}

function CompactStatCard({ icon: Icon, label, value, tone }: { icon: any, label: string, value: string, tone: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
      <Icon className="h-5 w-5 mb-1 text-primary-500" />
      <span className="text-xl font-bold">{value}</span>
      <span className="text-[10px] text-neutral-400 uppercase">{label}</span>
    </div>
  );
}
