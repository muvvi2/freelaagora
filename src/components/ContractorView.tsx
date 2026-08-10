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
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState(25);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [useGps, setUseGps] = useState(false);
  const [viewing, setViewing] = useState<User | null>(null);
  const [escrowContract, setEscrowContract] = useState<Contract | null>(null);
  const [jobForm, setJobForm] = useState<{ open: boolean; editing: Job | null }>({ open: false, editing: null });
  const [editEstablishment, setEditEstablishment] = useState(false);
  const [viewVipPage, setViewVipPage] = useState(false);

  if (!currentUser || !data) return null;

  const me = currentUser;
  const myJobs = data.jobs?.filter((j) => j.establishmentId === me.id) || [];
  const myContracts = data.contracts?.filter((c) => c.establishmentId === me.id) || [];

  const filtered = useMemo(() => {
    return data.users.filter((f) => {
      if (f.accountType !== 'freelancer' || f.isAdmin || f.banned) return false;
      return true;
    }).sort((a, b) => distanceBetween(a.address, me.address) - distanceBetween(b.address, me.address));
  }, [data.users, me.address]);

  return (
    // Reduzi o padding geral e o space-y
    <div className="mx-auto max-w-[1400px] px-4 py-4 space-y-3">
      
      {/* GRID COMPACTO NO TOPO */}
      <div className="grid grid-cols-[280px_1fr] gap-4 items-start">
        
        {/* Banner Esquerdo */}
        <div className="aspect-[600/900] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
           <VipSquareWidget pageType="establishments" slot={1} />
        </div>

        {/* Perfil e Stats (Compactados) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar src={me.photo} alt={me.name} size={48} />
              <div>
                <h1 className="font-bold text-base">{me.name}</h1>
                <Badge tone="primary">{me.establishmentType}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditEstablishment(true)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
              <Button size="sm" onClick={() => setViewVipPage(true)}><Crown className="h-3 w-3 mr-1" /> VIP</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
             <CompactStatCard icon={Megaphone} label="Vagas" value={String(myJobs.length)} />
             <CompactStatCard icon={Users} label="Candidatos" value={String(myJobs.reduce((acc, j) => acc + j.applicants.length, 0))} />
             <CompactStatCard icon={FileText} label="Contratos" value={String(myContracts.length)} />
             <CompactStatCard icon={MapPin} label="Próximos" value={String(filtered.length)} />
          </div>

          {/* COLUNA CENTRAL E LATERAL UNIDAS AQUI PARA ELIMINAR O ESPAÇO VAZIO */}
          <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
            
            {/* FEED DE PROFISSIONAIS */}
            <div className="space-y-3">
               <h2 className="font-bold text-sm">Profissionais na sua região</h2>
               <div className="grid grid-cols-3 gap-2">
                 <button onClick={() => setMacroFilter('all')} className={`p-2 text-[10px] font-semibold rounded-lg ${macroFilter === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}>Todas</button>
                 {MACRO_CATEGORIES.map(m => (
                   <button key={m.id} onClick={() => setMacroFilter(m.id)} className={`p-2 text-[10px] font-semibold rounded-lg ${macroFilter === m.id ? 'text-white' : 'bg-neutral-100'}`} style={macroFilter === m.id ? { backgroundColor: m.color } : {}}>{m.label}</button>
                 ))}
               </div>
               <div className="grid grid-cols-2 gap-3">
                 {filtered.map(f => <FreelancerCard key={f.id} freelancer={f} onHire={() => {}} onView={setViewing} distanceKm={distanceBetween(f.address, me.address)} />)}
               </div>
            </div>

            {/* MINHAS VAGAS (SIDEBAR) */}
            <aside className="space-y-3">
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm">Minhas vagas</h3>
                    <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}><Plus className="w-4 h-4" /></Button>
                 </div>
                 {myJobs.slice(0, 1).map(j => <JobCard key={j.id} job={j} variant="manage" />)}
                 <div className="mt-3 aspect-[6/5] overflow-hidden rounded-lg">
                   <VipSquareWidget pageType="establishments" slot={2} />
                 </div>
              </div>
            </aside>

          </div>
        </div>
      </div>

      {viewing && <FreelancerDetailModal freelancer={viewing} open={!!viewing} onClose={() => setViewing(null)} onHire={() => {}} />}
      <JobFormModal open={jobForm.open} onClose={() => setJobForm({ open: false, editing: null })} editing={jobForm.editing} establishment={me} />
      <EstablishmentEditModal establishment={me} open={editEstablishment} onClose={() => setEditEstablishment(false)} />
    </div>
  );
}

function CompactStatCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-neutral-200 bg-white shadow-sm">
      <Icon className="h-4 w-4 mb-1 text-primary-500" />
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[9px] text-neutral-400 uppercase">{label}</span>
    </div>
  );
}
