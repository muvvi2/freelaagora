import { useState, useEffect } from 'react';
import { Crown, ExternalLink } from 'lucide-react';
import { useApp } from '@/AppContext';

// Widget para exibir os banners rotativos nas páginas de Freela e Estabelecimento
export function VipSquareWidget({ pageType = 'freelancers' }: { pageType?: 'freelancers' | 'establishments' }) {
  const { data } = useApp();
  
  const activeAds: { establishmentName: string; imageUrl: string; linkUrl: string; city: string; state: string }[] = [];
  
  data.users.forEach((u) => {
    if (u.accountType === 'establishment' && u.estVipTier && u.estVipTier !== 'free') {
      const isOnTrial = u.trialEndsAt ? new Date(u.trialEndsAt) > new Date() : false;
      const currentTier = isOnTrial ? 'trial' : u.estVipTier;
      const plan = data.estVipPlans.find((p) => p.tier === currentTier);

      if (plan?.allowAds) {
        // Puxa corretamente dos arrays por slot ou faz fallback para os arrays simples legados
        const adsBySlot = pageType === 'freelancers' 
          ? (u.freelancerAdsBySlot || [u.freelancerAds || [], [], []]) 
          : (u.establishmentAdsBySlot || [u.establishmentAds || [], [], []]);

        const linksBySlot = pageType === 'freelancers' 
          ? (u.freelancerLinksBySlot || [u.freelancerLinks || [], [], []]) 
          : (u.establishmentLinksBySlot || [u.establishmentLinks || [], [], []]);

        const allowedSlots = pageType === 'freelancers' ? (u.allowedFreelancerSlots || [1, 2, 3]) : (u.allowedEstablishmentSlots || [1, 2, 3]);

        // Varre cada slot (1, 2, 3 correspondendo aos índices 0, 1, 2)
        adsBySlot.forEach((slotAds, slotIndex) => {
          const slotNumber = slotIndex + 1;
          if (allowedSlots.includes(slotNumber) && Array.isArray(slotAds)) {
            slotAds.forEach((img, imgIndex) => {
              if (img && img.trim() !== '') {
                const link = linksBySlot[slotIndex]?.[imgIndex] || '';
                activeAds.push({
                  establishmentName: u.name,
                  imageUrl: img,
                  linkUrl: link,
                  city: u.address?.city || '',
                  state: u.address?.state || '',
                });
              }
            });
          }
        });
      }
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Intervalo ajustado para 4 segundos
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;
  const currentAd = activeAds[currentIndex];

  const AdContent = (
    <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-3 shadow-md dark:border-amber-500/30 dark:from-amber-950/30 dark:via-neutral-900 dark:to-neutral-900 w-full aspect-square flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.02]">
      <div className="absolute top-2 right-2 z-10">
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full shadow-xs">
          <Crown className="h-2.5 w-2.5 text-amber-500" /> Destaque
        </span>
      </div>
      
      <div className="relative w-full h-[75%] rounded-xl overflow-hidden shadow-inner bg-black">
        <img src={currentAd.imageUrl} alt={currentAd.establishmentName} className="w-full h-full object-cover transition-all duration-700" />
      </div>
      
      <div className="mt-1 flex flex-col justify-end flex-1 min-w-0">
        <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white truncate flex items-center gap-1">
          {currentAd.establishmentName} 
          {currentAd.linkUrl && <ExternalLink className="h-3 w-3 text-neutral-400" />}
        </h4>
        <p className="text-[10px] text-neutral-400 truncate">{currentAd.city} - {currentAd.state}</p>
      </div>
    </div>
  );

  if (currentAd.linkUrl) {
    return (
      <a href={currentAd.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
        {AdContent}
      </a>
    );
  }

  return AdContent;
}
