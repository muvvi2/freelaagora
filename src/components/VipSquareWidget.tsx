import { useState, useEffect } from 'react';
import { useApp } from '@/AppContext';

export function VipSquareWidget({ 
  pageType = 'freelancers', 
  slot = 1 
}: { 
  pageType?: 'freelancers' | 'establishments'; 
  slot: 1 | 2 | 3; // 1 = Topo (Vertical 600x900), 2 = Centro (Quadrado 600x500), 3 = Rodapé (Faixa 600x200)
}) {
  const { data } = useApp();
  const slotIndex = slot - 1; 
  const activeAds: { imageUrl: string; linkUrl: string }[] = [];
  
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
                imageUrl: img,
                linkUrl: link,
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

  // Define a proporção exata para cada slot sem nenhum texto ou elemento adicional
  const aspectClass = slot === 1 
    ? 'aspect-[600/900]' 
    : slot === 2 
    ? 'aspect-[6/5]' 
    : 'aspect-[3/1]';

  return (
    <a 
      href={currentAd.linkUrl || '#'} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`block w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-transform hover:scale-[1.01] dark:border-neutral-800 dark:bg-neutral-900 ${aspectClass}`}
    >
      <img src={currentAd.imageUrl} alt="Anúncio" className="w-full h-full object-cover" />
    </a>
  );
}
