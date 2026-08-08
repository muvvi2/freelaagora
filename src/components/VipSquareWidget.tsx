import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { useApp } from '@/AppContext';

export function VipSquareWidget() {
  const { data } = useApp();
  
  const activeAds: { establishmentName: string; imageUrl: string; city: string; state: string }[] = [];
  
  data.users.forEach((u) => {
    if (u.accountType === 'establishment' && u.estVipTier && u.estVipTier !== 'free' && u.adImages && u.adImages.length > 0) {
      // Verifica se o plano atual do estabelecimento tem permissão para exibir anúncios dinamicamente
      const isOnTrial = u.trialEndsAt ? new Date(u.trialEndsAt) > new Date() : false;
      const currentTier = isOnTrial ? 'trial' : u.estVipTier;
      const plan = data.estVipPlans.find((p) => p.tier === currentTier);

      if (plan?.allowAds) {
        u.adImages.forEach((img) => {
          if (img && img.trim() !== '') {
            activeAds.push({
              establishmentName: u.name,
              imageUrl: img,
              city: u.address?.city || '',
              state: u.address?.state || '',
            });
          }
        });
      }
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 10000); // 10 segundos
    return () => clearInterval(timer);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;
  const currentAd = activeAds[currentIndex];

  return (
    <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-3 shadow-md dark:border-amber-500/30 dark:from-amber-950/30 dark:via-neutral-900 dark:to-neutral-900 w-full aspect-square flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full shadow-xs">
          <Crown className="h-2.5 w-2.5 text-amber-500" /> Destaque (800x800px)
        </span>
      </div>
      <div className="relative w-full h-[75%] rounded-xl overflow-hidden shadow-inner bg-black">
        <img src={currentAd.imageUrl} alt={currentAd.establishmentName} className="w-full h-full object-cover transition-all duration-700" />
      </div>
      <div className="mt-1 flex flex-col justify-end flex-1 min-w-0">
        <h4 className="font-display font-bold text-xs text-neutral-900 dark:text-white truncate">{currentAd.establishmentName}</h4>
        <p className="text-[10px] text-neutral-400 truncate">{currentAd.city} - {currentAd.state}</p>
      </div>
    </div>
  );
}
