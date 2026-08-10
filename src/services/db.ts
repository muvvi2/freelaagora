import { supabase } from '@/lib/supabase';
import { CATEGORIES, VIP_PLANS, EST_VIP_PLANS } from '@/mockData';
import { emptyAvailability, fullAvailability } from '@/mockData';
import type {
  User, Job, Contract, WalletTx, AppNotification, Review,
  AppData, WeekAvailability, DateAvailability, DayKey, Tier, EstTier,
  PaymentSettings, PaymentProviderId, PaymentProviderConfig, VipPlan, EstVipPlan,
} from '@/types';

const DAY_KEYS: DayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAY_INDEX: Record<DayKey, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
const INDEX_TO_DAY: Record<number, DayKey> = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  user_type: string;
  full_name: string;
  photo_url: string | null;
  document_cpf: string | null;
  document_cnpj: string | null;
  whatsapp: string;
  phone_contact: string | null;
  city: string;
  state: string;
  banned: boolean;
  created_at: string;
  nickname: string | null;
  document_verified: boolean;
  terms_acceptance_json: Record<string, unknown> | null;
  last_admin_edit: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_lat: number | null;
  address_lng: number | null;
  service_radius_km: number | null;
  accepts_interstate: boolean;
  establishment_type: string | null;
  bio: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  pix_key: string | null;
  asaas_wallet_id: string | null;
  rating_average: number;
  reviews_count: number;
  completed_shifts: number;
  vip_tier: string;
  est_vip_tier: string;
  vip_expires_at: string | null;
  est_vip_expires_at: string | null;
  wallet_balance: number;
  is_admin: boolean;
  admin_role: string | null;
  trial_ends_at: string | null;
  ad_images: string[] | null;
  home_ads: string[] | null;
  home_links: string[] | null;
  freelancer_ads: string[] | null;
  freelancer_links: string[] | null;
  establishment_ads: string[] | null;
  establishment_links: string[] | null;
  freelancer_ads_by_slot?: string[][] | null;
  establishment_ads_by_slot?: string[][] | null;
  freelancer_links_by_slot?: string[][] | null;
  establishment_links_by_slot?: string[][] | null;
  allowed_freelancer_slots?: number[] | null;
  allowed_establishment_slots?: number[] | null;
  include_freelancer_ad?: boolean;
  include_establishment_ad?: boolean;
}

export interface DbFreelancerProfile {
  user_id: string;
  bio: string | null;
  specialties: string[] | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  pix_key: string | null;
  vip_plan_id: number | null;
  vip_expires_at: string | null;
  rating_average: number;
  reviews_count: number;
  completed_shifts: number;
  wallet_balance: number;
  is_verified: boolean;
  service_radius_km: number | null;
  accepts_interstate: boolean;
}

export interface DbEstablishmentProfile {
  user_id: string;
  company_description: string | null;
  establishment_type: string | null;
  address: string | null;
  vip_plan_id: number | null;
  vip_expires_at: string | null;
  rating_average: number;
  reviews_count: number;
  wallet_balance: number;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_lat: number | null;
  address_lng: number | null;
}

export interface DbFreelancerCategory {
  freelancer_id: string;
  category_id: number;
}

export interface DbFreelancerAvailability {
  id: string;
  freelancer_id: string;
  day_of_week: number;
  shift_morning: boolean;
  shift_afternoon: boolean;
  shift_night: boolean;
  specific_date: string | null;
}

export interface DbContract {
  id: string;
  establishment_id: string;
  freelancer_id: string;
  job_id: string | null;
  contract_date: string;
  shifts_contracted: string;
  hours_contracted: number;
  total_freelancer_value: number;
  platform_fee_percentage: number;
  platform_fee_value: number;
  total_amount_paid: number;
  status: string;
  cora_invoice_id: string | null;
  created_at: string;
  category: string | null;
  freelancer_name: string | null;
  establishment_name: string | null;
  freelancer_photo: string | null;
  freelancer_phone: string | null;
  freelancer_whatsapp: string | null;
  review_from_establishment_id: string | null;
  review_from_freelancer_id: string | null;
}

export interface DbContractEvent {
  id: string;
  contract_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface DbContractReview {
  id: string;
  contract_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DbWalletTx {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  contract_id: string | null;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  contract_id: string | null;
  created_at: string;
}

export interface DbJob {
  id: string;
  establishment_id: string;
  category_id: number | null;
  title: string;
  description: string | null;
  job_date: string;
  start_time: string;
  hours: number;
  value: number;
  urgency: string;
  status: string;
  city: string | null;
  state: string | null;
  created_at: string;
  establishment_name: string | null;
  establishment_photo: string | null;
}

export interface DbJobApplicant {
  job_id: string;
  freelancer_id: string;
  created_at: string;
}

export interface DbCoupon {
  id: number;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  admin_id: string | null;
  action_performed: string;
  target_user_id: string | null;
  created_at: string;
}

const STATUS_TO_DB: Record<string, string> = {
  requested: 'pending_admin_check',
  confirmed: 'accepted_by_freela',
  paid: 'paid_escrow',
  checked_in: 'check_in_done',
  completed: 'completed_split',
  cancelled: 'canceled',
};
const STATUS_FROM_DB: Record<string, string> = {
  pending_admin_check: 'requested',
  accepted_by_freela: 'confirmed',
  paid_escrow: 'paid',
  check_in_done: 'checked_in',
  completed_split: 'completed',
  canceled: 'cancelled',
};

function freelancerTierToId(tier: string): number {
  switch (tier) {
    case 'free': return 1;
    case 'vip1': return 2;
    case 'vip2': return 3;
    case 'vip3': return 4;
    case 'vip4': return 5;
    case 'vip5': return 6;
    case 'vip6': return 7;
    default: return 1;
  }
}

function establishmentTierToId(tier: string): number {
  switch (tier) {
    case 'trial': return 3;
    case 'free': return 4;
    case 'vip1': return 5;
    case 'vip2': return 6;
    case 'vip3': return 7;
    case 'vip4': return 8;
    case 'vip5': return 9;
    case 'vip6': return 10;
    default: return 4;
  }
}

function categorySlugToId(slug: string): number | null {
  const index = CATEGORIES.findIndex((c) => c.id === slug);
  if (index === -1) return 1;
  return index + 1;
}

function categoryIdToSlug(id: number): string {
  if (id >= 1 && id <= CATEGORIES.length) {
    return CATEGORIES[id - 1].id;
  }
  return 'geral';
}

function mapDbUserToUser(
  row: DbUser,
  flProfile?: DbFreelancerProfile | null,
  esProfile?: DbEstablishmentProfile | null,
  categories?: string[],
  availability?: WeekAvailability,
  dateAvailability?: DateAvailability,
): User {
  const address = {
    cep: esProfile?.address_cep ?? row.address_cep ?? '',
    street: esProfile?.address_street ?? row.address_street ?? '',
    number: esProfile?.address_number ?? row.address_number ?? '',
    complement: esProfile?.address_complement ?? row.address_complement,
    neighborhood: esProfile?.address_neighborhood ?? row.address_neighborhood ?? '',
    city: esProfile?.address_city ?? row.city,
    state: esProfile?.address_state ?? row.state,
    lat: esProfile?.address_lat ?? row.address_lat ?? undefined,
    lng: esProfile?.address_lng ?? row.address_lng ?? undefined,
  };

  const isFreelancer = row.user_type === 'freelancer' || (row.user_type === 'admin' && !row.establishment_type);
  const isEstablishment = row.user_type === 'establishment';

  return {
    id: row.id,
    accountType: row.user_type === 'admin' ? 'freelancer' : (row.user_type as 'freelancer' | 'establishment'),
    email: row.email,
    password: row.password_hash ?? '',
    name: row.full_name,
    nickname: row.nickname ?? undefined,
    photo: row.photo_url ?? '',
    phone: row.phone_contact ?? row.whatsapp ?? '',
    whatsapp: row.whatsapp,
    address,
    cpf: row.document_cpf ?? undefined,
    cnpj: row.document_cnpj ?? undefined,
    asaasWalletId: row.asaas_wallet_id ?? undefined,
    bio: flProfile?.bio ?? row.bio ?? undefined,
    specialties: flProfile?.specialties ?? undefined,
    hourlyRate: flProfile?.hourly_rate ?? row.hourly_rate ?? undefined,
    dailyRate: flProfile?.daily_rate ?? row.daily_rate ?? undefined,
    pixKey: flProfile?.pix_key ?? row.pix_key ?? undefined,
    rating: row.rating_average ?? flProfile?.rating_average ?? (esProfile?.rating_average ?? 0),
    reviewsCount: row.reviews_count ?? flProfile?.reviews_count ?? (esProfile?.reviews_count ?? 0),
    completedShifts: row.completed_shifts ?? flProfile?.completed_shifts ?? 0,
    vipTier: isFreelancer ? (row.vip_tier as Tier) : undefined,
    vipExpiresAt: isFreelancer ? (row.vip_expires_at ?? undefined) : undefined,
    categories: isFreelancer ? (categories ?? []) : undefined,
    availability: isFreelancer ? (availability ?? emptyAvailability()) : undefined,
    dateAvailability: isFreelancer ? (dateAvailability ?? undefined) : undefined,
    walletBalance: row.wallet_balance ?? flProfile?.wallet_balance ?? esProfile?.wallet_balance ?? 0,
    documentVerified: row.document_verified ?? flProfile?.is_verified ?? false,
    serviceRadiusKm: flProfile?.service_radius_km ?? row.service_radius_km ?? undefined,
    acceptsInterstate: flProfile?.accepts_interstate ?? row.accepts_interstate ?? false,
    establishmentType: isEstablishment ? (esProfile?.establishment_type ?? row.establishment_type ?? undefined) : undefined,
    estVipTier: isEstablishment ? (row.est_vip_tier as EstTier) : undefined,
    estVipExpiresAt: isEstablishment ? (row.est_vip_expires_at ?? undefined) : undefined,
    trialEndsAt: isEstablishment ? (row.trial_ends_at ?? undefined) : undefined,
    isAdmin: row.is_admin ?? row.user_type === 'admin',
    adminRole: row.admin_role === 'super' || row.admin_role === 'regular' ? row.admin_role : undefined,
    banned: row.banned ?? false,
    termsAcceptance: row.terms_acceptance_json as { timestamp: string; ip: string; userAgent: string; legalVersion: string } | undefined,
    lastAdminEdit: row.last_admin_edit ?? undefined,
    createdAt: row.created_at,
    adImages: row.ad_images ?? row.home_ads ?? [],
    homeAds: row.home_ads ?? row.ad_images ?? [],
    homeLinks: row.home_links ?? [],
    freelancerAds: row.freelancer_ads ?? [],
    freelancerLinks: row.freelancer_links ?? [],
    establishmentAds: row.establishment_ads ?? [],
    establishmentLinks: row.establishment_links ?? [],
    freelancerAdsBySlot: row.freelancer_ads_by_slot ?? [],
    establishmentAdsBySlot: row.establishment_ads_by_slot ?? [],
    freelancerLinksBySlot: row.freelancer_links_by_slot ?? [],
    establishmentLinksBySlot: row.establishment_links_by_slot ?? [],
    allowedFreelancerSlots: row.allowed_freelancer_slots ?? [],
    allowedEstablishmentSlots: row.allowed_establishment_slots ?? [],
    includeFreelancerAd: row.include_freelancer_ad ?? false,
    includeEstablishmentAd: row.include_establishment_ad ?? false,
  };
}

function mapUserToDbUser(user: User): Partial<DbUser> {
  return {
    id: user.id,
    email: user.email,
    password_hash: user.password,
    user_type: user.isAdmin ? 'admin' : user.accountType,
    full_name: user.name,
    photo_url: user.photo,
    document_cpf: user.cpf ?? null,
    document_cnpj: user.cnpj ?? null,
    whatsapp: user.whatsapp,
    phone_contact: user.phone,
    city: user.address.city,
    state: user.address.state,
    banned: user.banned ?? false,
    nickname: user.nickname ?? null,
    document_verified: user.documentVerified ?? false,
    terms_acceptance_json: (user.termsAcceptance as Record<string, unknown>) ?? null,
    last_admin_edit: user.lastAdminEdit ?? null,
    address_cep: user.address.cep ?? null,
    address_street: user.address.street ?? null,
    address_number: user.address.number ?? null,
    address_complement: user.address.complement ?? null,
    address_neighborhood: user.address.neighborhood ?? null,
    address_lat: user.address.lat ?? null,
    address_lng: user.address.lng ?? null,
    service_radius_km: user.serviceRadiusKm ?? null,
    accepts_interstate: user.acceptsInterstate ?? false,
    establishment_type: user.establishmentType ?? null,
    bio: user.bio ?? null,
    hourly_rate: user.hourlyRate ?? null,
    daily_rate: user.dailyRate ?? null,
    pix_key: user.pixKey ?? null,
    asaas_wallet_id: user.asaasWalletId ?? null,
    rating_average: user.rating ?? 0,
    reviews_count: user.reviewsCount ?? 0,
    completed_shifts: user.completedShifts ?? 0,
    vip_tier: user.vipTier ?? 'free',
    est_vip_tier: user.estVipTier ?? 'free',
    vip_expires_at: user.vipExpiresAt ?? null,
    est_vip_expires_at: user.estVipExpiresAt ?? null,
    wallet_balance: user.walletBalance ?? 0,
    is_admin: user.isAdmin ?? false,
    admin_role: user.adminRole ?? null,
    trial_ends_at: user.trialEndsAt ?? null,
    ad_images: user.adImages ?? user.homeAds ?? [],
    home_ads: user.homeAds ?? user.adImages ?? [],
    home_links: user.homeLinks ?? [],
    freelancer_ads: user.freelancerAds ?? [],
    freelancer_links: user.freelancerLinks ?? [],
    establishment_ads: user.establishmentAds ?? [],
    establishment_links: user.establishmentLinks ?? [],
    freelancer_ads_by_slot: user.freelancerAdsBySlot ?? [],
    establishment_ads_by_slot: user.establishmentAdsBySlot ?? [],
    freelancer_links_by_slot: user.freelancerLinksBySlot ?? [],
    establishment_links_by_slot: user.establishmentLinksBySlot ?? [],
    allowed_freelancer_slots: user.allowedFreelancerSlots ?? [],
    allowed_establishment_slots: user.allowedEstablishmentSlots ?? [],
    include_freelancer_ad: user.includeFreelancerAd ?? false,
    include_establishment_ad: user.includeEstablishmentAd ?? false,
  };
}

function mapUserToFlProfile(user: User): Partial<DbFreelancerProfile> {
  return {
    user_id: user.id,
    bio: user.bio ?? null,
    specialties: user.specialties ?? null,
    hourly_rate: user.hourlyRate ?? 0,
    daily_rate: user.dailyRate ?? 0,
    pix_key: user.pixKey ?? null,
    vip_plan_id: user.vipTier ? freelancerTierToId(user.vipTier) : 1,
    vip_expires_at: user.vipExpiresAt ?? null,
    rating_average: user.rating ?? 5,
    reviews_count: user.reviewsCount ?? 0,
    completed_shifts: user.completedShifts ?? 0,
    wallet_balance: user.walletBalance ?? 0,
    is_verified: user.documentVerified ?? false,
    service_radius_km: user.serviceRadiusKm ?? 25,
    accepts_interstate: user.acceptsInterstate ?? false,
  };
}

function mapUserToEsProfile(user: User): Partial<DbEstablishmentProfile> {
  return {
    user_id: user.id,
    company_description: user.bio ?? null,
    establishment_type: user.establishmentType ?? null,
    address: `${user.address.street}, ${user.address.number}`,
    vip_plan_id: user.estVipTier ? establishmentTierToId(user.estVipTier) : 4,
    vip_expires_at: user.estVipExpiresAt ?? null,
    rating_average: user.rating ?? 0,
    reviews_count: user.reviewsCount ?? 0,
    wallet_balance: user.walletBalance ?? 0,
    address_cep: user.address.cep ?? null,
    address_street: user.address.street ?? null,
    address_number: user.address.number ?? null,
    address_complement: user.address.complement ?? null,
    address_neighborhood: user.address.neighborhood ?? null,
    address_city: user.address.city ?? null,
    address_state: user.address.state ?? null,
    address_lat: user.address.lat ?? null,
    address_lng: user.address.lng ?? null,
  };
}

function mapAvailabilityToRows(userId: string, av: WeekAvailability): Array<{ freelancer_id: string; day_of_week: number; shift_morning: boolean; shift_afternoon: boolean; shift_night: boolean; specific_date: null }> {
  return DAY_KEYS.map((day) => ({
    freelancer_id: userId,
    day_of_week: DAY_INDEX[day],
    shift_morning: av[day]?.manha ?? false,
    shift_afternoon: av[day]?.tarde ?? false,
    shift_night: av[day]?.noite ?? false,
    specific_date: null,
  }));
}

function mapRowsToAvailability(rows: DbFreelancerAvailability[]): WeekAvailability {
  const av = emptyAvailability();
  for (const row of rows) {
    if (row.specific_date) continue;
    const day = INDEX_TO_DAY[row.day_of_week];
    if (day) {
      av[day] = {
        manha: row.shift_morning,
        tarde: row.shift_afternoon,
        noite: row.shift_night,
      };
    }
  }
  return av;
}

function mapRowsToDateAvailability(rows: DbFreelancerAvailability[]): DateAvailability {
  const da: DateAvailability = {};
  for (const row of rows) {
    if (!row.specific_date) continue;
    da[row.specific_date] = {
      manha: row.shift_morning,
      tarde: row.shift_afternoon,
      noite: row.shift_night,
    };
  }
  return da;
}

function mapDbContractToContract(
  row: DbContract,
  events: DbContractEvent[],
  reviews: DbContractReview[],
): Contract {
  const reviewFromEst = reviews.find((r) => r.id === row.review_from_establishment_id);
  const reviewFromFl = reviews.find((r) => r.id === row.review_from_freelancer_id);

  const mapReview = (r: DbContractReview | undefined): Review | undefined => {
    if (!r) return undefined;
    return {
      id: r.id,
      fromId: r.from_user_id,
      fromName: '',
      toId: r.to_user_id,
      rating: r.rating,
      comment: r.comment ?? '',
      date: r.created_at,
    };
  };

  return {
    id: row.id,
    jobId: row.job_id,
    establishmentId: row.establishment_id,
    establishmentName: row.establishment_name ?? '',
    freelancerId: row.freelancer_id,
    freelancerName: row.freelancer_name ?? '',
    freelancerPhoto: row.freelancer_photo ?? '',
    freelancerPhone: row.freelancer_phone ?? '',
    freelancerWhatsapp: row.freelancer_whatsapp ?? '',
    category: row.category ?? 'geral',
    date: row.contract_date,
    hours: row.hours_contracted,
    freelancerFee: Number(row.total_freelancer_value),
    platformFeePercentage: Number(row.platform_fee_percentage),
    platformFee: Number(row.platform_fee_value),
    total: Number(row.total_amount_paid),
    status: (STATUS_FROM_DB[row.status] ?? 'requested') as Contract['status'],
    coraInvoiceId: row.cora_invoice_id ?? undefined,
    createdAt: row.created_at,
    history: events.map((e) => ({
      status: (STATUS_FROM_DB[e.status] ?? 'requested') as Contract['status'],
      at: e.created_at,
      note: e.note ?? undefined,
    })),
    reviewFromEstablishment: mapReview(reviewFromEst),
    reviewFromFreelancer: mapReview(reviewFromFl),
  };
}

function mapContractToDbRow(c: Contract): Partial<DbContract> {
  return {
    id: c.id,
    establishment_id: c.establishmentId,
    freelancer_id: c.freelancerId,
    job_id: c.jobId,
    contract_date: c.date.slice(0, 10),
    shifts_contracted: 'manha',
    hours_contracted: c.hours,
    total_freelancer_value: c.freelancerFee,
    platform_fee_percentage: c.platformFeePercentage,
    platform_fee_value: c.platformFee,
    total_amount_paid: c.total,
    status: STATUS_TO_DB[c.status] ?? 'pending_admin_check',
    cora_invoice_id: c.coraInvoiceId ?? null,
    created_at: c.createdAt,
    category: c.category,
    freelancer_name: c.freelancerName,
    establishment_name: c.establishmentName,
    freelancer_photo: c.freelancerPhoto,
    freelancer_phone: c.freelancerPhone,
    freelancer_whatsapp: c.freelancerWhatsapp,
  };
}

function mapDbJobToJob(row: DbJob, applicants: string[]): Job {
  return {
    id: row.id,
    establishmentId: row.establishment_id,
    establishmentName: row.establishment_name ?? '',
    establishmentPhoto: row.establishment_photo ?? '',
    category: row.category_id ? categoryIdToSlug(row.category_id) : 'geral',
    title: row.title,
    description: row.description ?? '',
    date: row.job_date,
    startTime: row.start_time,
    hours: row.hours,
    value: Number(row.value),
    urgency: (row.urgency as Job['urgency']) ?? 'esta_semana',
    status: (row.status as Job['status']) ?? 'active',
    city: row.city ?? '',
    state: row.state ?? '',
    applicants,
    createdAt: row.created_at,
  };
}

function mapJobToDbRow(j: Job): Partial<DbJob> {
  return {
    id: j.id,
    establishment_id: j.establishmentId,
    category_id: categorySlugToId(j.category),
    title: j.title,
    description: j.description,
    job_date: j.date.slice(0, 10),
    start_time: j.startTime,
    hours: j.hours,
    value: j.value,
    urgency: j.urgency,
    status: j.status,
    city: j.city,
    state: j.state,
    created_at: j.createdAt,
    establishment_name: j.establishmentName,
    establishment_photo: j.establishmentPhoto,
  };
}

export async function dbUpsertVipPlan(plan: VipPlan): Promise<void> {
  const planId = freelancerTierToId(plan.tier);
  const { error } = await supabase.from('vip_plans_freelancer').upsert({
    id: planId,
    name: plan.label,
    max_categories: plan.maxCategories,
    monthly_price: plan.prices.monthly,
    semestral_price: plan.prices.semestral,
    annual_price: plan.prices.annual,
    search_boost_level: plan.tier === 'free' ? 0 : 1,
    badge_type: plan.badge || null,
    features: plan.features || [],
  } as never, { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar plano freelancer:', error.message);
    throw new Error(`Erro ao salvar plano freelancer: ${error.message}`);
  }
}

export async function dbDeleteVipPlan(tier: Tier): Promise<void> {
  const planId = freelancerTierToId(tier);
  const { error } = await supabase.from('vip_plans_freelancer').delete().eq('id', planId);
  if (error) {
    console.error('Erro ao deletar plano freelancer:', error.message);
    throw new Error(`Erro ao deletar plano freelancer: ${error.message}`);
  }
}

export async function dbUpsertEstVipPlan(plan: EstVipPlan): Promise<void> {
  const planId = establishmentTierToId(plan.tier);
  const { error } = await supabase.from('vip_plans_establishment').upsert({
    id: planId,
    name: plan.label,
    intermediation_fee_percentage: plan.intermediationFee,
    monthly_price: plan.prices.monthly,
    semestral_price: plan.prices.semestral,
    annual_price: plan.prices.annual,
    allow_ads: plan.allowAds ?? false,
    max_ads: plan.maxAds ?? 0,
    price_slot_1: plan.priceSlot1 ?? 30,
    price_slot_2: plan.priceSlot2 ?? 25,
    price_slot_3: plan.priceSlot3 ?? 20,
    features: plan.features || [],
  } as never, { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar plano de estabelecimento:', error.message);
    throw new Error(`Erro ao salvar plano de estabelecimento: ${error.message}`);
  }
}

export async function dbDeleteEstVipPlan(tier: EstTier): Promise<void> {
  const planId = establishmentTierToId(tier);
  const { error } = await supabase.from('vip_plans_establishment').delete().eq('id', planId);
  if (error) {
    console.error('Erro ao deletar plano de estabelecimento:', error.message);
    throw new Error(`Erro ao deletar plano de estabelecimento: ${error.message}`);
  }
}

export async function loadAllData(): Promise<AppData> {
  const [
    usersRes, flProfilesRes, esProfilesRes, flCategoriesRes, flAvailRes,
    contractsRes, eventsRes, contractReviewsRes, walletRes, notifRes,
    jobsRes, applicantsRes, couponsRes, auditRes, configRes, paymentRes,
    vipFlRes, vipEsRes,
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('freelancer_profiles').select('*'),
    supabase.from('establishment_profiles').select('*'),
    supabase.from('freelancer_categories').select('*'),
    supabase.from('freelancer_availability').select('*'),
    supabase.from('contracts').select('*'),
    supabase.from('contract_events').select('*'),
    supabase.from('contract_reviews').select('*'),
    supabase.from('wallet_transactions').select('*'),
    supabase.from('notifications').select('*'),
    supabase.from('jobs').select('*'),
    supabase.from('job_applicants').select('*'),
    supabase.from('discount_coupons').select('*'),
    supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('platform_config').select('*').limit(1).maybeSingle(),
    supabase.from('payment_settings').select('*').limit(1).maybeSingle(),
    supabase.from('vip_plans_freelancer').select('*'),
    supabase.from('vip_plans_establishment').select('*'),
  ]);

  const usersRows = (usersRes.data ?? []) as unknown as DbUser[];
  const flProfiles = (flProfilesRes.data ?? []) as unknown as DbFreelancerProfile[];
  const esProfiles = (esProfilesRes.data ?? []) as unknown as DbEstablishmentProfile[];
  const flCategories = (flCategoriesRes.data ?? []) as unknown as DbFreelancerCategory[];
  const flAvail = (flAvailRes.data ?? []) as unknown as DbFreelancerAvailability[];
  const contractsRows = (contractsRes.data ?? []) as unknown as DbContract[];
  const eventsRows = (eventsRes.data ?? []) as unknown as DbContractEvent[];
  const contractReviewsRows = (contractReviewsRes.data ?? []) as unknown as DbContractReview[];
  const walletRows = (walletRes.data ?? []) as unknown as DbWalletTx[];
  const notifRows = (notifRes.data ?? []) as unknown as DbNotification[];
  const jobsRows = (jobsRes.data ?? []) as unknown as DbJob[];
  const applicantsRows = (applicantsRes.data ?? []) as unknown as DbJobApplicant[];
  const couponRows = (couponsRes.data ?? []) as unknown as DbCoupon[];
  const auditRows = (auditRes.data ?? []) as unknown as DbAuditLog[];

  const users: User[] = usersRows.map((row) => {
    const flProfile = flProfiles.find((p) => p.user_id === row.id);
    const esProfile = esProfiles.find((p) => p.user_id === row.id);
    const userCatIds = flCategories.filter((c) => c.freelancer_id === row.id).map((c) => categoryIdToSlug(c.category_id));
    const userAvailRows = flAvail.filter((a) => a.freelancer_id === row.id);
    const availability = mapRowsToAvailability(userAvailRows);
    const dateAvailability = mapRowsToDateAvailability(userAvailRows);
    return mapDbUserToUser(row, flProfile, esProfile, userCatIds, availability, dateAvailability);
  });

  const eventsByContract = new Map<string, DbContractEvent[]>();
  for (const e of eventsRows) {
    const arr = eventsByContract.get(e.contract_id) ?? [];
    arr.push(e);
    eventsByContract.set(e.contract_id, arr);
  }

  const contracts: Contract[] = contractsRows.map((row) =>
    mapDbContractToContract(row, eventsByContract.get(row.id) ?? [], contractReviewsRows),
  );

  const applicantsByJob = new Map<string, string[]>();
  for (const a of applicantsRows) {
    const arr = applicantsByJob.get(a.job_id) ?? [];
    arr.push(a.freelancer_id);
    applicantsByJob.set(a.job_id, arr);
  }

  const jobs: Job[] = jobsRows.map((row) => mapDbJobToJob(row, applicantsByJob.get(row.id) ?? []));

  const walletTxs: WalletTx[] = walletRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as WalletTx['type'],
    amount: Number(row.amount),
    description: row.description ?? '',
    contractId: row.contract_id ?? undefined,
    date: row.created_at,
  }));

  const notifications: AppNotification[] = notifRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type as AppNotification['type'],
    title: row.title,
    body: row.body ?? '',
    read: row.read,
    date: row.created_at,
    contractId: row.contract_id ?? undefined,
  }));

  const reviews: Review[] = contractReviewsRows.map((row) => {
    const fromUser = users.find((u) => u.id === row.from_user_id);
    return {
      id: row.id,
      fromId: row.from_user_id,
      fromName: fromUser?.name ?? '',
      toId: row.to_user_id,
      rating: row.rating,
      comment: row.comment ?? '',
      date: row.created_at,
    };
  });

  const coupons = couponRows.map((row) => ({
    id: String(row.id),
    code: row.code,
    discountPercentage: Number(row.discount_percentage),
    isActive: row.is_active,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  }));

  const adminAuditLogs = auditRows.map((row) => ({
    id: row.id,
    adminId: row.admin_id ?? '',
    action: row.action_performed,
    targetUserId: row.target_user_id ?? undefined,
    createdAt: row.created_at,
  }));

  const vipPlans: VipPlan[] = VIP_PLANS.map(plan => {
    const targetId = freelancerTierToId(plan.tier);
    const dbPlan = vipFlRes.data?.find((p: any) => p.id === targetId);
    if (dbPlan) {
      return {
        ...plan,
        label: dbPlan.name || plan.label,
        maxCategories: dbPlan.max_categories ?? plan.maxCategories,
        prices: {
          monthly: Number(dbPlan.monthly_price ?? plan.prices.monthly),
          semestral: Number(dbPlan.semestral_price ?? plan.prices.semestral),
          annual: Number(dbPlan.annual_price ?? plan.prices.annual),
        },
        badge: dbPlan.badge_type || plan.badge,
        features: dbPlan.features || plan.features,
      };
    }
    return plan;
  });

  const estVipPlans: EstVipPlan[] = EST_VIP_PLANS.map(plan => {
    const targetId = establishmentTierToId(plan.tier);
    const dbPlan = vipEsRes.data?.find((p: any) => p.id === targetId);
    if (dbPlan) {
      return {
        ...plan,
        label: dbPlan.name || plan.label,
        intermediationFee: Number(dbPlan.intermediation_fee_percentage ?? plan.intermediationFee),
        prices: {
          monthly: Number(dbPlan.monthly_price ?? plan.prices.monthly),
          semestral: Number(dbPlan.semestral_price ?? plan.prices.semestral),
          annual: Number(dbPlan.annual_price ?? plan.prices.annual),
        },
        allowAds: Boolean(dbPlan.allow_ads ?? plan.allowAds ?? false),
        maxAds: Number(dbPlan.max_ads ?? plan.maxAds ?? 0),
        priceSlot1: Number(dbPlan.price_slot_1 ?? plan.priceSlot1 ?? 30),
        priceSlot2: Number(dbPlan.price_slot_2 ?? plan.priceSlot2 ?? 25),
        priceSlot3: Number(dbPlan.price_slot_3 ?? plan.priceSlot3 ?? 20),
        features: dbPlan.features || plan.features,
      };
    }
    return plan;
  });

  let paymentSettings: PaymentSettings = { activeProvider: 'asaas', configs: {} };
  if (paymentRes.data) {
    const ps = paymentRes.data as { active_provider: string; configs: Record<string, unknown> };
    const configs: Partial<Record<PaymentProviderId, PaymentProviderConfig>> = {};
    if (ps.configs) {
      for (const [key, val] of Object.entries(ps.configs)) {
        if (val && typeof val === 'object') {
          const v = val as { apiKey?: string; env?: string };
          configs[key as PaymentProviderId] = {
            apiKey: v.apiKey ?? '',
            env: (v.env as 'sandbox' | 'production') ?? 'sandbox',
          };
        }
      }
    }
    paymentSettings = {
      activeProvider: (ps.active_provider as PaymentProviderId) ?? 'asaas',
      configs,
    };
  }

  return {
    users,
    jobs,
    contracts,
    walletTxs,
    notifications,
    reviews,
    coupons,
    adminAuditLogs,
    config: { defaultFeePercent: configRes.data ? Number((configRes.data as { default_fee_percent: number }).default_fee_percent) : 15.0 },
    paymentSettings,
    currentUserId: null,
    vipPlans,
    estVipPlans,
  };
}

export async function dbInsertUser(user: User): Promise<void> {
  const dbUser = mapUserToDbUser(user);
  const { error } = await supabase.from('users').insert(dbUser as never);
  if (error) throw new Error(`Erro ao inserir usuário: ${error.message}`);

  if (user.accountType === 'freelancer') {
    const flProfile = mapUserToFlProfile(user);
    const { error: e2 } = await supabase.from('freelancer_profiles').insert(flProfile as never);
    if (e2) throw new Error(`Erro ao inserir perfil freelancer: ${e2.message}`);

    if (user.categories && user.categories.length > 0) {
      const catRows = user.categories.map((cat) => ({
        freelancer_id: user.id,
        category_id: categorySlugToId(cat),
      })).filter((r) => r.category_id !== null);
      if (catRows.length > 0) {
        const { error: e3 } = await supabase.from('freelancer_categories').insert(catRows as never);
        if (e3) throw new Error(`Erro ao inserir categorias: ${e3.message}`);
      }
    }

    if (user.availability) {
      const avRows = mapAvailabilityToRows(user.id, user.availability);
      const { error: e4 } = await supabase.from('freelancer_availability').insert(avRows as never);
      if (e4) throw new Error(`Erro ao inserir disponibilidade: ${e4.message}`);
    }
  } else if (user.accountType === 'establishment') {
    const esProfile = mapUserToEsProfile(user);
    const { error: e2 } = await supabase.from('establishment_profiles').insert(esProfile as never);
    if (e2) throw new Error(`Erro ao inserir perfil estabelecimento: ${e2.message}`);
  }
}

export async function dbInsertAdmin(user: User): Promise<void> {
  await dbInsertUser(user);
}

export async function dbUpdateUser(id: string, patch: Partial<User>): Promise<void> {
  const dbPatch: Record<string, unknown> = {};

  if (patch.name !== undefined) dbPatch.full_name = patch.name;
  if (patch.email !== undefined) dbPatch.email = patch.email;
  if (patch.password !== undefined) dbPatch.password_hash = patch.password;
  if (patch.accountType !== undefined) dbPatch.user_type = patch.isAdmin ? 'admin' : patch.accountType;
  if (patch.photo !== undefined) dbPatch.photo_url = patch.photo;
  if (patch.cpf !== undefined) dbPatch.document_cpf = patch.cpf;
  if (patch.cnpj !== undefined) dbPatch.document_cnpj = patch.cnpj;
  if (patch.whatsapp !== undefined) dbPatch.whatsapp = patch.whatsapp;
  if (patch.phone !== undefined) dbPatch.phone_contact = patch.phone;
  if (patch.banned !== undefined) dbPatch.banned = patch.banned;
  if (patch.nickname !== undefined) dbPatch.nickname = patch.nickname;
  if (patch.documentVerified !== undefined) dbPatch.document_verified = patch.documentVerified;
  if (patch.termsAcceptance !== undefined) dbPatch.terms_acceptance_json = patch.termsAcceptance;
  if (patch.lastAdminEdit !== undefined) dbPatch.last_admin_edit = patch.lastAdminEdit;
  if (patch.walletBalance !== undefined) dbPatch.wallet_balance = patch.walletBalance;
  if (patch.isAdmin !== undefined) dbPatch.is_admin = patch.isAdmin;
  if (patch.adminRole !== undefined) dbPatch.admin_role = patch.adminRole;
  if (patch.trialEndsAt !== undefined) dbPatch.trial_ends_at = patch.trialEndsAt;
  if (patch.vipTier !== undefined) dbPatch.vip_tier = patch.vipTier;
  if (patch.estVipTier !== undefined) dbPatch.est_vip_tier = patch.estVipTier;
  if (patch.vipExpiresAt !== undefined) dbPatch.vip_expires_at = patch.vipExpiresAt;
  if (patch.estVipExpiresAt !== undefined) dbPatch.est_vip_expires_at = patch.estVipExpiresAt;
  
  if (patch.allowedFreelancerSlots !== undefined) dbPatch.allowed_freelancer_slots = patch.allowedFreelancerSlots;
  if (patch.allowedEstablishmentSlots !== undefined) dbPatch.allowed_establishment_slots = patch.allowedEstablishmentSlots;
  if (patch.includeFreelancerAd !== undefined) dbPatch.include_freelancer_ad = patch.includeFreelancerAd;
  if (patch.includeEstablishmentAd !== undefined) dbPatch.include_establishment_ad = patch.includeEstablishmentAd;

  if (patch.freelancerAdsBySlot !== undefined) dbPatch.freelancer_ads_by_slot = patch.freelancerAdsBySlot;
  if (patch.establishmentAdsBySlot !== undefined) dbPatch.establishment_ads_by_slot = patch.establishmentAdsBySlot;
  if (patch.freelancerLinksBySlot !== undefined) dbPatch.freelancer_links_by_slot = patch.freelancerLinksBySlot;
  if (patch.establishmentLinksBySlot !== undefined) dbPatch.establishment_links_by_slot = patch.establishmentLinksBySlot;

  if (patch.adImages !== undefined) {
    dbPatch.ad_images = patch.adImages;
    dbPatch.home_ads = patch.adImages;
  }
  if (patch.homeAds !== undefined) {
    dbPatch.home_ads = patch.homeAds;
    dbPatch.ad_images = patch.homeAds;
  }
  if (patch.homeLinks !== undefined) dbPatch.home_links = patch.homeLinks;
  if (patch.freelancerAds !== undefined) dbPatch.freelancer_ads = patch.freelancerAds;
  if (patch.freelancerLinks !== undefined) dbPatch.freelancer_links = patch.freelancerLinks;
  if (patch.establishmentAds !== undefined) dbPatch.establishment_ads = patch.establishmentAds;
  if (patch.establishmentLinks !== undefined) dbPatch.establishment_links = patch.establishmentLinks;

  if (patch.address) {
    if (patch.address.city !== undefined) dbPatch.city = patch.address.city;
    if (patch.address.state !== undefined) dbPatch.state = patch.address.state;
    if (patch.address.cep !== undefined) dbPatch.address_cep = patch.address.cep;
    if (patch.address.street !== undefined) dbPatch.address_street = patch.address.street;
    if (patch.address.number !== undefined) dbPatch.address_number = patch.address.number;
    if (patch.address.complement !== undefined) dbPatch.address_complement = patch.address.complement;
    if (patch.address.neighborhood !== undefined) dbPatch.address_neighborhood = patch.address.neighborhood;
    if (patch.address.lat !== undefined) dbPatch.address_lat = patch.address.lat;
    if (patch.address.lng !== undefined) dbPatch.address_lng = patch.address.lng;
  }

  if (patch.estVipTier !== undefined) {
    const { error: rpcError } = await supabase.rpc('admin_update_user_vip', {
      p_user_id: id,
      p_est_vip_tier: patch.estVipTier,
      p_last_admin_edit: patch.lastAdminEdit ?? new Date().toISOString()
    });
    if (rpcError) {
      console.error('❌ Erro no RPC admin_update_user_vip:', rpcError.message);
      if (Object.keys(dbPatch).length > 0) {
        const { error } = await supabase.from('users').update(dbPatch).eq('id', id);
        if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
      }
    }
  } else if (Object.keys(dbPatch).length > 0) {
    const { error } = await supabase.from('users').update(dbPatch).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
  }

  if (patch.accountType === 'freelancer' || patch.bio !== undefined || patch.hourlyRate !== undefined || patch.dailyRate !== undefined || patch.pixKey !== undefined || patch.specialties !== undefined || patch.serviceRadiusKm !== undefined || patch.acceptsInterstate !== undefined) {
    const flPatch: Record<string, unknown> = { user_id: id };
    if (patch.bio !== undefined) flPatch.bio = patch.bio;
    if (patch.specialties !== undefined) flPatch.specialties = patch.specialties;
    if (patch.hourlyRate !== undefined) flPatch.hourly_rate = patch.hourlyRate;
    if (patch.dailyRate !== undefined) flPatch.daily_rate = patch.dailyRate;
    if (patch.pixKey !== undefined) flPatch.pix_key = patch.pixKey;
    if (patch.serviceRadiusKm !== undefined) flPatch.service_radius_km = patch.serviceRadiusKm;
    if (patch.acceptsInterstate !== undefined) flPatch.accepts_interstate = patch.acceptsInterstate;
    if (patch.vipTier !== undefined) flPatch.vip_plan_id = freelancerTierToId(patch.vipTier);
    if (patch.vipExpiresAt !== undefined) flPatch.vip_expires_at = patch.vipExpiresAt;
    if (patch.walletBalance !== undefined) flPatch.wallet_balance = patch.walletBalance;

    const { error: e2 } = await supabase.from('freelancer_profiles').upsert(flPatch as never);
    if (e2) throw new Error(`Erro ao atualizar perfil freelancer: ${e2.message}`);
  }

  // ADICIONADO: Atualiza as categorias do freelancer no banco quando alteradas no perfil
  if (patch.categories !== undefined) {
    await supabase.from('freelancer_categories').delete().eq('freelancer_id', id);
    if (patch.categories.length > 0) {
      const catRows = patch.categories.map((cat) => ({
        freelancer_id: id,
        category_id: categorySlugToId(cat),
      })).filter((r) => r.category_id !== null);
      if (catRows.length > 0) {
        const { error: eCat } = await supabase.from('freelancer_categories').insert(catRows as never);
        if (eCat) console.error('Erro ao atualizar categorias:', eCat.message);
      }
    }
  }

  if (patch.accountType === 'establishment' || patch.establishmentType !== undefined || patch.address !== undefined) {
    const esPatch: Record<string, unknown> = { user_id: id };
    if (patch.establishmentType !== undefined) esPatch.establishment_type = patch.establishmentType;
    if (patch.bio !== undefined) esPatch.company_description = patch.bio;
    if (patch.address) {
      if (patch.address.street && patch.address.number) {
        esPatch.address = `${patch.address.street}, ${patch.address.number}`;
      }
      if (patch.address.cep !== undefined) esPatch.address_cep = patch.address.cep;
      if (patch.address.street !== undefined) esPatch.address_street = patch.address.street;
      if (patch.address.number !== undefined) esPatch.address_number = patch.address.number;
      if (patch.address.complement !== undefined) esPatch.address_complement = patch.address.complement;
      if (patch.address.neighborhood !== undefined) esPatch.address_neighborhood = patch.address.neighborhood;
      if (patch.address.city !== undefined) esPatch.address_city = patch.address.city;
      if (patch.address.state !== undefined) esPatch.address_state = patch.address.state;
      if (patch.address.lat !== undefined) esPatch.address_lat = patch.address.lat;
      if (patch.address.lng !== undefined) esPatch.address_lng = patch.address.lng;
    }
    if (patch.estVipTier !== undefined) esPatch.vip_plan_id = establishmentTierToId(patch.estVipTier);
    if (patch.estVipExpiresAt !== undefined) esPatch.vip_expires_at = patch.estVipExpiresAt;
    if (patch.walletBalance !== undefined) esPatch.wallet_balance = patch.walletBalance;

    const { error: e3 } = await supabase.from('establishment_profiles').upsert(esPatch as never);
    if (e3) throw new Error(`Erro ao atualizar perfil estabelecimento: ${e3.message}`);
  }
}

export async function dbDeleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw new Error(`Erro ao deletar usuário: ${error.message}`);
}

export async function dbInsertJob(job: Job): Promise<void> {
  const row = mapJobToDbRow(job);
  const { error } = await supabase.from('jobs').insert(row as never);
  if (error) throw new Error(`Erro ao inserir vaga: ${error.message}`);
}

export async function dbUpdateJob(id: string, patch: Partial<Job>): Promise<void> {
  const updateRow: Record<string, unknown> = {};
  if (patch.title !== undefined) updateRow.title = patch.title;
  if (patch.description !== undefined) updateRow.description = patch.description;
  if (patch.date !== undefined) updateRow.job_date = patch.date.slice(0, 10);
  if (patch.startTime !== undefined) updateRow.start_time = patch.startTime;
  if (patch.hours !== undefined) updateRow.hours = patch.hours;
  if (patch.value !== undefined) updateRow.value = patch.value;
  if (patch.urgency !== undefined) updateRow.urgency = patch.urgency;
  if (patch.status !== undefined) updateRow.status = patch.status;
  if (patch.city !== undefined) updateRow.city = patch.city;
  if (patch.state !== undefined) updateRow.state = patch.state;
  if (patch.category !== undefined) updateRow.category_id = categorySlugToId(patch.category);
  if (patch.establishmentName !== undefined) updateRow.establishment_name = patch.establishmentName;
  if (patch.establishmentPhoto !== undefined) updateRow.establishment_photo = patch.establishmentPhoto;

  if (Object.keys(updateRow).length > 0) {
    const { error } = await supabase.from('jobs').update(updateRow).eq('id', id);
    if (error) throw new Error(`Erro ao atualizar vaga: ${error.message}`);
  }
}

export async function dbDeleteJob(id: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw new Error(`Erro ao deletar vaga: ${error.message}`);
}

export async function dbApplyToJob(jobId: string, freelancerId: string): Promise<void> {
  const { error } = await supabase.from('job_applicants').insert({ job_id: jobId, freelancer_id: freelancerId } as never);
  if (error && !error.message.includes('duplicate')) throw new Error(`Erro ao candidatar: ${error.message}`);
}

export async function dbInsertContract(contract: Contract): Promise<void> {
  const row = mapContractToDbRow(contract);
  const { error } = await supabase.from('contracts').insert(row as never);
  if (error) throw new Error(`Erro ao inserir contrato: ${error.message}`);

  for (const evt of contract.history) {
    const { error: e2 } = await supabase.from('contract_events').insert({
      contract_id: contract.id,
      status: STATUS_TO_DB[evt.status] ?? evt.status,
      note: evt.note ?? null,
      created_at: evt.at,
    } as never);
    if (e2) throw new Error(`Erro ao inserir evento: ${e2.message}`);
  }
}

export async function dbUpdateContractStatus(contractId: string, status: string, note?: string): Promise<void> {
  const dbStatus = STATUS_TO_DB[status] ?? status;
  const { error } = await supabase.from('contracts').update({ status: dbStatus }).eq('id', contractId);
  if (error) throw new Error(`Erro ao atualizar contrato: ${error.message}`);

  const { error: e2 } = await supabase.from('contract_events').insert({
    contract_id: contractId,
    status: dbStatus,
    note: note ?? null,
  } as never);
  if (e2) throw new Error(`Erro ao inserir evento: ${e2.message}`);
}

export async function dbUpdateContractInvoice(contractId: string, invoiceId: string): Promise<void> {
  const { error } = await supabase.from('contracts').update({ cora_invoice_id: invoiceId }).eq('id', contractId);
  if (error) throw new Error(`Erro ao atualizar fatura: ${error.message}`);
}

export async function dbInsertWalletTx(tx: WalletTx): Promise<void> {
  const { error } = await supabase.from('wallet_transactions').insert({
    id: tx.id,
    user_id: tx.userId,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    contract_id: tx.contractId ?? null,
    created_at: tx.date,
  } as never);
  if (error) throw new Error(`Erro ao inserir transação: ${error.message}`);
}

export async function dbUpdateWalletBalance(userId: string, newBalance: number): Promise<void> {
  const { error: rpcError } = await supabase.rpc('admin_update_wallet_balance', {
    p_user_id: userId,
    p_wallet_balance: newBalance
  });

  if (rpcError) {
    console.error('❌ Erro no RPC admin_update_wallet_balance:', rpcError.message);
    throw new Error(`Erro ao atualizar saldo: ${rpcError.message}`);
  }
}

export async function dbInsertNotification(n: AppNotification): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    contract_id: n.contractId ?? null,
    created_at: n.date,
  } as never);
  if (error) throw new Error(`Erro ao inserir notificação: ${error.message}`);
}

export async function dbMarkNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw new Error(`Erro ao marcar notificação: ${error.message}`);
}

export async function dbMarkAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  if (error) throw new Error(`Erro ao marcar notificações: ${error.message}`);
}

export async function dbInsertReview(review: Review, contractId: string, fromEstablishment: boolean): Promise<void> {
  const { data, error } = await supabase.from('contract_reviews').insert({
    id: review.id,
    contract_id: contractId,
    from_user_id: review.fromId,
    to_user_id: review.toId,
    rating: review.rating,
    comment: review.comment,
    created_at: review.date,
  } as never).select().single();
  if (error) throw new Error(`Erro ao inserir avaliação: ${error.message}`);

  const reviewId = (data as { id: string }).id;
  const updateCol = fromEstablishment ? 'review_from_establishment_id' : 'review_from_freelancer_id';
  const { error: e2 } = await supabase.from('contracts').update({ [updateCol]: reviewId }).eq('id', contractId);
  if (e2) throw new Error(`Erro ao vincular avaliação: ${e2.message}`);
}

export async function dbDeleteReview(reviewId: string, fromEstablishment: boolean, contractId: string): Promise<void> {
  const updateCol = fromEstablishment ? 'review_from_establishment_id' : 'review_from_freelancer_id';
  await supabase.from('contracts').update({ [updateCol]: null }).eq('id', contractId);
  const { error } = await supabase.from('contract_reviews').delete().eq('id', reviewId);
  if (error) throw new Error(`Erro ao deletar avaliação: ${error.message}`);
}

export async function dbInsertCoupon(coupon: { code: string; discountPercentage: number; isActive: boolean; expiresAt?: string }): Promise<void> {
  const { error } = await supabase.from('discount_coupons').insert({
    code: coupon.code,
    discount_percentage: coupon.discountPercentage,
    is_active: coupon.isActive,
    expires_at: coupon.expiresAt ?? null,
  } as never);
  if (error) throw new Error(`Erro ao inserir cupom: ${error.message}`);
}

export async function dbToggleCoupon(id: string): Promise<void> {
  const { data } = await supabase.from('discount_coupons').select('is_active').eq('id', Number(id)).single();
  if (data) {
    const { error } = await supabase.from('discount_coupons').update({ is_active: !(data as { is_active: boolean }).is_active }).eq('id', Number(id));
    if (error) throw new Error(`Erro ao alternar cupom: ${error.message}`);
  }
}

export async function dbDeleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from('discount_coupons').delete().eq('id', Number(id));
  if (error) throw new Error(`Erro ao deletar cupom: ${error.message}`);
}

export async function dbInsertAuditLog(log: { id: string; adminId: string; action: string; targetUserId?: string; createdAt: string }): Promise<void> {
  const { error } = await supabase.from('admin_audit_logs').insert({
    id: log.id,
    admin_id: log.adminId,
    action_performed: log.action,
    target_user_id: log.targetUserId ?? null,
    created_at: log.createdAt,
  } as never);
  if (error) throw new Error(`Erro ao inserir log: ${error.message}`);
}

export async function dbUpdateDefaultFeePercent(value: number): Promise<void> {
  const { error } = await supabase.from('platform_config').update({ default_fee_percent: value }).eq('id', 1);
  if (error) throw new Error(`Erro ao atualizar taxa: ${error.message}`);
}

export async function dbUpdatePaymentSettings(settings: PaymentSettings): Promise<void> {
  const configs: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(settings.configs)) {
    if (val) configs[key] = { apiKey: val.apiKey, env: val.env };
  }
  const { error } = await supabase.from('payment_settings').update({
    active_provider: settings.activeProvider,
    configs,
    updated_at: new Date().toISOString(),
  }).eq('id', 1);
  if (error) throw new Error(`Erro ao atualizar pagamentos: ${error.message}`);
}
