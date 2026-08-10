import { useState, useEffect } from 'react';
import { Crown, ExternalLink } from 'lucide-react';
import { useApp } from '@/AppContext';

export function VipSquareWidget({ 
  pageType = 'freelancers', 
  slot = 1 
}: { 
  pageType?: 'freelancers' | 'establishments'; 
  slot?: number; 
}) {
  const { data } = useApp();
  const activeAds: { establishmentName: string; imageUrl: string; linkUrl: string; city: string; state: string }[] = [];
  
  data.users.forEach((u) => {
    // Verifica se é um estabelecimento com plano ativo ou em período de testes
    if (u.accountType === 'establishment' && u.estVipTier && u.estVipTier !== 'free') {
      const adsBySlot = pageType === 'freelancers' 
        ? (u.freelancerAdsBySlot || [u.freelancerAds || [], [], []]) 
        : (u.establishmentAdsBySlot || [u.establishmentAds || [], [], []]);

      const linksBySlot = pageType === 'freelancers' 
        ? (u.freelancerLinksBySlot || [u.freelancerLinks || [], [], []]) 
        : (u.establishmentLinksBySlot || [u.establishmentLinks || [], [], []]);

      // Varre todas as imagens cadastradas nos slots deste usuário
      adsBySlot.forEach((slotAds, sIndex) => {
        if (Array.isArray(slotAds)) {
          slotAds.forEach((img, imgIndex) => {
            if (img && typeof img === 'string' && img.trim() !== '') {
              const link = linksBySlot[sIndex]?.[imgIndex] || '';
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
      });
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

  // Se realmente não houver nenhuma imagem cadastrada no sistema inteiro, não renderiza nada
  if (activeAds.length === 0) return null;

  const currentAd = activeAds[currentIndex % activeAds.length];

  return (
    <a href={currentAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full group">
      <div className="rounded-2xl border border-amber-300/50 bg-neutral-900 p-3 shadow-lg w-full flex flex-col transition-transform hover:scale-[1.01]">
        <div className="flex justify-between items-center mb-2">
           <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Crown className="h-2.5 w-2.5" /> Destaque {activeAds.length > 1 ? `(${currentIndex + 1}/${activeAds.length})` : ''}
           </span>
        </div>
        
        <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden bg-black">
          <img src={currentAd.imageUrl} alt={currentAd.establishmentName} className="w-full h-full object-cover" />
        </div>
        
        <div className="mt-3 px-1">
          <h4 className="font-bold text-sm text-white truncate flex items-center justify-between">
            {currentAd.establishmentName} 
            {currentAd.linkUrl && <ExternalLink className="h-3 w-3 text-neutral-500" />}
          </h4>
          <p className="text-[11px] text-neutral-400 truncate">{currentAd.city} - {currentAd.state}</p>
        </div>
      </div>
    </a>
  );
}
