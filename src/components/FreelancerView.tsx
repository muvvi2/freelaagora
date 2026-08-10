import { useState } from 'react';
import { User as UserIcon, MapPin, Tags, Calendar, Crown, Wallet, Briefcase, Fingerprint, ShieldCheck, MessageSquare, Save, Inbox, Megaphone, Upload, Check, X, Globe, Sliders } from 'lucide-react';
// ... (mantenha os imports anteriores e adicione Sliders)

export function FreelancerView() {
  const { currentUser, data, toggleDateShift, toggleCategory, reviewsFor, updateUser } = useApp();
  const { notify } = useToast();
  const me = currentUser!;
  const plan = getPlan(me.vipTier ?? 'free', data.vipPlans);
  
  // Estados de Filtro
  const [radiusKm, setRadiusKm] = useState<number>(50);

  // ... (seus estados de modal e abas)
  const myContracts = data.contracts.filter((c) => c.freelancerId === me.id);
  const openJobs = data.jobs.filter((j) => {
    if (j.status !== 'active') return false;
    if (me.unlimitedKm) return true;
    // Logica simples de filtro por cidade ou raio (simulado)
    return !j.city || j.city.toLowerCase() === (me.address?.city || '').toLowerCase();
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header, Tabs, etc... (Pode manter igual) */}
      
      {tab === 'opportunities' && (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr_340px]">
          
          {/* COLUNA 1: Convites (FIXA) */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm h-fit">
            <h2 className="mb-4 flex items-center gap-2 font-display font-bold text-neutral-900 dark:text-white"><Inbox className="h-5 w-5 text-primary-500" /> Convites Diretos</h2>
            {myContracts.filter(c => c.status === 'requested' || c.status === 'confirmed').length > 0 ? (
               <div className="space-y-3">
                 {/* Map de convites */}
               </div>
            ) : (
               <div className="text-center py-6 text-sm text-neutral-400">Nenhum convite.</div>
            )}
          </section>

          {/* COLUNA 2: Vagas + Filtro KM */}
          <section className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 font-bold"><Sliders className="h-4 w-4" /> Filtros</div>
                <div className="flex items-center gap-4">
                   <select className="text-sm bg-neutral-50 rounded-lg p-2" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
                      <option value={10}>Até 10km</option>
                      <option value={50}>Até 50km</option>
                      <option value={100}>Até 100km</option>
                   </select>
                   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={me.unlimitedKm} onChange={(e) => updateUser(me.id, { unlimitedKm: e.target.checked })} /> KM Livre</label>
                </div>
             </div>
             {openJobs.map((j) => <JobCard key={j.id} job={j} variant="apply" />)}
          </section>

          {/* COLUNA 3: Anúncios */}
          <aside className="space-y-4">
             <VipSquareWidget pageType="freelancers" slot={1} />
          </aside>
        </div>
      )}
      
      {/* ... (Restante das tabs) */}
    </div>
  );
}

// ABA ESPECIALIDADES (VALOR INDIVIDUAL)
function SpecialtiesTab({ me, onToggleCat, onSave }: { me: any; onToggleCat: (catId: string) => void; onSave: (patch: any) => void }) {
    // Adicione um state local para as tarifas por categoria
    const [categoryRates, setCategoryRates] = useState(me.categoryRates || {});
    
    // Na hora de salvar, envie esse objeto de rates
    // ...
    // Dentro do render das categorias selecionadas:
    // <Input label="Valor/h" value={categoryRates[cat.id]?.hourly} onChange={(e) => setCategoryRates({...categoryRates, [cat.id]: {...categoryRates[cat.id], hourly: e.target.value}})} />
}
