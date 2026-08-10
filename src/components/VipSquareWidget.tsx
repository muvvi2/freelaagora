import { useState, useEffect } from 'react';
import { Crown, ExternalLink } from 'lucide-react';
import { useApp } from '@/AppContext';

export function VipSquareWidget({ 
  pageType = 'freelancers', 
  slot = 1 
}: { 
  pageType?: 'freelancers' | 'establishments'; 
  slot: 1 | 2 | 3; // 1 = Topo (Vertical 600x900), 2 = Centro (Quadrado 600x500), 3 = Rodapé (Faixa 600x200)
}) {
  const { data } = useApp();
  const slotIndex = slot - 1; // Converte 1,2,3 para índices do array: 0, 1, 2
  const activeAds: { establishmentName: string; imageUrl: string; linkUrl: string; city: string; state: string }[] = [];
  
  data.users.forEach((u) => {
    if (u.accountType === 'establishment' && u.estVipTier && u.estVipTier !== 'free') {
      const isOnTrial = u.trialEndsAt ? new Date(u.trialEndsAt) > new Date() : false;
      const currentTier = isOnTrial ? 'trial' : u.estVipTier;
      const plan = data.estVipPlans.find((p) => p.tier === currentTier);

      if (plan?.allowAds || ['vip4', 'vip5', 'vip6', 'trial'].includes(currentTier)) {
        const adsBySlot = pageType === 'freelancers' 
          ? (u.freelancerAdsBySlot || [[], [], []]) 
          : (u.establishmentAdsBySlot || [[], [], []]);

        const linksBySlot = pageType === 'freelancers' 
          ? (u.freelancerLinksBySlot || [[], [], []]) 
          : (u.establishmentLinksBySlot || [[], [], []]);

        const rawSlots = pageType === 'freelancers' ? u.allowedFreelancerSlots : u.allowedEstablishmentSlots;
        const allowedSlots = (rawSlots && rawSlots.length > 0) ? rawSlots : [1, 2, 3];

        if (allowedSlots.includes(slot)) {
          const targetAds = adsBySlot[slotIndex] || [];
          const targetLinks = linksBySlot[slotIndex] || [];

          targetAds.forEach((img, imgIndex) => {
            if (img && typeof img === 'string' && img.trim() !== '') {
              const link = targetLinks[imgIndex] || '';
              activeAds.push({
                establishmentName: u.name || 'Estabelecimento',
                imageUrl: img,
                linkUrl: link,
                city: u.address?.city || '',
                state: u.address?.state || '',
              });
            }
          });
        }
      }
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;

  const currentAd = activeAds[currentIndex % activeAds.length];

  // Define a proporção correta com base no slot (1 = Retrato/Vertical, 2 = Quadrado, 3 = Faixa/Banner)
  const aspectClass = slot === 1 
    ? 'aspect-[600/900]' 
    : slot === 2 
    ? 'aspect-[6/5]' 
    : 'aspect-[3/1]';

  return (
    <a href={currentAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full group">
      <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm w-full flex flex-col transition-transform hover:scale-[1.01] dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex justify-between items-center mb-2">
           <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full dark:text-amber-400">
            <Crown className="h-2.5 w-2.5" /> Destaque {slot === 1 ? 'Topo' : slot === 2 ? 'Centro' : 'Rodapé'} {activeAds.length > 1 ? `(${currentIndex + 1}/${activeAds.length})` : ''}
           </span>
        </div>
        
        {/* Contêiner com a proporção exata respeitada */}
        <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-950`}>
          <img src={currentAd.imageUrl} alt={currentAd.establishmentName} className="w-full h-full object-cover" />
        </div>
        
        <div className="mt-3 px-1">
          <h4 className="font-bold text-sm text-neutral-900 truncate flex items-center justify-between dark:text-white">
            {currentAd.establishmentName} 
            {currentAd.linkUrl && <ExternalLink className="h-3 w-3 text-neutral-400" />}
          </h4>
          <p className="text-[11px] text-neutral-400 truncate">{currentAd.city} - {currentAd.state}</p>
        </div>
      </div>
    </a>
  );
}
