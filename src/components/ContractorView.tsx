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

  // Segurança extra: se data ou currentUser não existirem, retorna loading
  if (!currentUser || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-neutral-400">Carregando painel...</p>
      </div>
    );
  }

  const me = currentUser;
  const myJobs = data.jobs?.filter((j) => j.establishmentId === me.id) || [];
  const myContracts = data.contracts?.filter((c) => c.establishmentId === me.id) || [];

  const handleGps = () => {
    if (useGps) { setUseGps(false); return; }
    if (!navigator.geolocation) { notify('Geolocalização não suportada.', 'warning'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsLat(pos.coords.latitude); setGpsLng(pos.coords.longitude); setUseGps(true); notify('GPS detectado!'); },
      () => { notify('Erro ao obter GPS.', 'warning'); },
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

  const handleHire = (f: User) => {
    const hours = 8;
    const fee = f.dailyRate ?? 0;
    if (fee <= 0) { notify('Freelancer sem valor de diária definido.', 'warning'); return; }
    const contract = requestHire(me.id, f.id, null, hours, fee);
    setEscrowContract(contract);
    notify('Solicitação enviada!');
  };

  if (viewVipPage) return <VipPanel userId={me.id} accountType="establishment" onBack={() => setViewVipPage(false)} />;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 space-y-6">
      {/* Conteúdo conforme seu layout de 3 colunas */}
      {/* ... (todo o HTML aqui) ... */}
    </div>
  );
}

function CompactStatCard({ icon: Icon, label, value, tone }: { icon: any, label: string, value: string, tone: 'primary' | 'secondary' | 'accent' | 'neutral' }) {
    // ... (função igual)
}
