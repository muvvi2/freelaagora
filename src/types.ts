export interface VipPlan {
  tier: Tier;
  label: string;
  maxCategories: number;
  features: string[];
  prices: Record<Period, number>;
  discountMonthlyPercent?: number;
  discountSemestralPercent?: number;
  discountAnnualPercent?: number;
  badge?: 'verified' | 'gold' | 'diamond';
  boost?: 'light' | 'top' | 'max';
  feePercent?: number;
  id?: string;
}

export interface EstVipPlan {
  tier: EstTier;
  label: string;
  intermediationFee: number;
  feePercent?: number;
  id?: string;
  maxActiveJobs: number;
  allowAds?: boolean;
  maxAds?: number;
  homeAdPrice?: number;
  freelancerAdPrice?: number;
  establishmentAdPrice?: number;
  priceSlot1?: number;
  priceSlot2?: number;
  priceSlot3?: number;
  features: string[];
  prices: Record<Period, number>;
  discountMonthlyPercent?: number;
  discountSemestralPercent?: number;
  discountAnnualPercent?: number;
}
