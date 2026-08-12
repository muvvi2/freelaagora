import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/AppContext';

type AdSlot = 'top' | 'center' | 'bottom';
type PageType = 'freelancers' | 'establishments';

interface AdItem {
  imageUrl: string;
  linkUrl: string;
  title?: string;
}

const SLOT_ASPECT: Record<AdSlot, string> = {
  top: 'aspect-[2/1] max-h-[260px]',
  center: 'aspect-[2/1] max-h-[260px]',
  bottom: 'aspect-[3.3:1] max-h-[130px]',
};

function useAdvertisements(pageType: PageType, slot: AdSlot): { ads: AdItem[]; loading: boolean } {
  const [dbAds, setDbAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('advertisements')
          .select('image_url, target_url, title')
          .eq('page_type', pageType)
          .eq('slot_position', slot)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (error) {
          setLoading(false);
          return;
        }

        const mapped: AdItem[] = (data ?? []).map((r: any) => ({
          imageUrl: r.image_url,
          linkUrl: r.target_url || '',
          title: r.title || '',
        }));
        setDbAds(mapped);
      } catch {
        // silently fail — legacy ads will still render
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pageType, slot]);

  const { data: appData } = useApp();

  const legacyAds: AdItem[] = useMemo(() => {
    const slotIndex = slot === 'top' ? 0 : slot === 'center' ? 1 : 2;
    const result: AdItem[] = [];

    (appData?.users ?? []).forEach((u) => {
      if (u.accountType !== 'establishment' || !u.estVipTier || u.estVipTier === 'free') return;

      const isOnTrial = u.trialEndsAt ? new Date(u.trialEndsAt) > new Date() : false;
      const currentTier = isOnTrial ? 'trial' : u.estVipTier;
      const plan = appData?.estVipPlans.find((p) => p.tier === currentTier);

      if (!(plan?.allowAds || ['vip4', 'vip5', 'vip6', 'trial'].includes(currentTier))) return;

      const adsBySlot: string[][] = pageType === 'freelancers'
        ? (u.freelancerAdsBySlot || [[], [], []])
        : (u.establishmentAdsBySlot || [[], [], []]);
      const linksBySlot: string[][] = pageType === 'freelancers'
        ? (u.freelancerLinksBySlot || [[], [], []])
        : (u.establishmentLinksBySlot || [[], [], []]);

      const rawSlots = pageType === 'freelancers' ? u.allowedFreelancerSlots : u.allowedEstablishmentSlots;
      const allowedSlots = rawSlots && rawSlots.length > 0 ? rawSlots : [1, 2, 3];
      const slotNumber = slotIndex + 1;
      if (!allowedSlots.includes(slotNumber)) return;

      const targetAds = adsBySlot[slotIndex] || [];
      const targetLinks = linksBySlot[slotIndex] || [];

      targetAds.forEach((img: string, i: number) => {
        if (img && typeof img === 'string' && img.trim() !== '') {
          result.push({ imageUrl: img, linkUrl: targetLinks[i] || '' });
        }
      });
    });

    return result;
  }, [appData, pageType, slot]);

  const allAds = useMemo(() => {
    const seen = new Set<string>();
    const merged: AdItem[] = [];
    for (const ad of [...dbAds, ...legacyAds]) {
      if (!seen.has(ad.imageUrl)) {
        seen.add(ad.imageUrl);
        merged.push(ad);
      }
    }
    return merged;
  }, [dbAds, legacyAds]);

  return { ads: allAds, loading };
}

export function AdBanner({ pageType, slot }: { pageType: PageType; slot: AdSlot }) {
  const { ads, loading } = useAdvertisements(pageType, slot);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className={`w-full animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl ${SLOT_ASPECT[slot]}`} />
      </div>
    );
  }

  if (ads.length === 0) return null;

  const ad = ads[currentIndex % ads.length];

  return (
    <a
      href={ad.linkUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative block w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900 shadow-lg transition-opacity hover:opacity-95 dark:border-neutral-800 ${SLOT_ASPECT[slot]}`}
    >
      <img
        src={ad.imageUrl}
        alt={ad.title || 'Anúncio Patrocinado'}
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
      <div className="absolute right-3 top-3 z-10 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
        Patrocinado
      </div>
      {ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {ads.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all ${i === currentIndex % ads.length ? 'bg-white w-4' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </a>
  );
}
