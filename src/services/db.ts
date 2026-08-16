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
  const availabilityRows = (flAvailRes.data ?? []) as unknown as DbFreelancerAvailability[];
  const contractsRows = (contractsRes.data ?? []) as unknown as DbContract[];
  const eventsRows = (eventsRes.data ?? []) as unknown as DbContractEvent[];
  const contractReviewsRows = (contractReviewsRes.data ?? []) as unknown as DbContractReview[];
  const walletRows = (walletRes.data ?? []) as unknown as DbWalletTx[];
  const notifRows = (notifRes.data ?? []) as unknown as DbNotification[];
  const jobsRows = (jobsRes.data ?? []) as unknown as DbJob[];
  const applicantsRows = (applicantsRes.data ?? []) as unknown as DbJobApplicant[];
  const auditRows = (auditRes.data ?? []) as unknown as DbAuditLog[];

  const users: User[] = usersRows.map((row) => {
    const flProfile = flProfiles.find((p) => p.user_id === row.id);
    const esProfile = esProfiles.find((p) => p.user_id === row.id);
    const userCatIds = flCategories.filter((c) => c.freelancer_id === row.id).map((c) => categoryIdToSlug(c.category_id));
    const userAvail = mapAvailabilityRows(availabilityRows, row.id);
    return mapDbUserToUser(row, flProfile, esProfile, userCatIds, userAvail.availability, userAvail.dateAvailability);
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

  const coupons = couponsRes.data ? couponsRes.data.map((row: any) => ({
    id: String(row.id),
    code: row.code,
    discountPercentage: Number(row.discount_percentage),
    isActive: row.is_active,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  })) : [];

  const adminAuditLogs = auditRows.map((row) => ({
    id: row.id,
    adminId: row.admin_id ?? '',
    action: row.action_performed,
    targetUserId: row.target_user_id ?? undefined,
    createdAt: row.created_at,
  }));

  // Mapeamento seguro para Freelancer Plans (evita falha de ID)
  const vipPlans: VipPlan[] = VIP_PLANS.map(plan => {
    const dbPlan = vipFlRes.data?.find((p: any) => 
      String(p.id) === String(freelancerTierToId(plan.tier)) || 
      p.name?.toLowerCase().includes(plan.label.toLowerCase()) ||
      p.name?.toLowerCase().includes(plan.tier.toLowerCase())
    ) || vipFlRes.data?.find((p: any) => p.id === plan.tier || p.tier === plan.tier);

    const prices = dbPlan ? {
      monthly: Number(dbPlan.monthly_price ?? dbPlan.monthlyPrice ?? plan.prices.monthly),
      semestral: Number(dbPlan.semestral_price ?? dbPlan.semestralPrice ?? plan.prices.semestral),
      annual: Number(dbPlan.annual_price ?? dbPlan.annualPrice ?? plan.prices.annual),
    } : plan.prices;

    return {
      ...plan,
      label: dbPlan?.name || plan.label,
      maxCategories: dbPlan?.max_categories ?? plan.maxCategories,
      prices,
      discountMonthlyPercent: Number(dbPlan?.discount_monthly_percent ?? dbPlan?.discountMonthlyPercent ?? plan.discountMonthlyPercent ?? 0),
      discountSemestralPercent: Number(dbPlan?.discount_semestral_percent ?? dbPlan?.discountSemestralPercent ?? plan.discountSemestralPercent ?? 0),
      discountAnnualPercent: Number(dbPlan?.discount_annual_percent ?? dbPlan?.discountAnnualPercent ?? plan.discountAnnualPercent ?? 0),
      badge: dbPlan?.badge_type || plan.badge,
      features: dbPlan?.features || plan.features,
    };
  });

  // Mapeamento seguro para Establishment Plans (evita falha de ID)
  const estVipPlans: EstVipPlan[] = EST_VIP_PLANS.map(plan => {
    const dbPlan = vipEsRes.data?.find((p: any) => 
      String(p.id) === String(establishmentTierToId(plan.tier)) || 
      p.name?.toLowerCase().includes(plan.label.toLowerCase()) ||
      p.name?.toLowerCase().includes(plan.tier.toLowerCase())
    ) || vipEsRes.data?.find((p: any) => p.id === plan.tier || p.tier === plan.tier);

    const prices = dbPlan ? {
      monthly: Number(dbPlan.monthly_price ?? dbPlan.monthlyPrice ?? plan.prices.monthly),
      semestral: Number(dbPlan.semestral_price ?? dbPlan.semestralPrice ?? plan.prices.semestral),
      annual: Number(dbPlan.annual_price ?? dbPlan.annualPrice ?? plan.prices.annual),
    } : plan.prices;

    return {
      ...plan,
      label: dbPlan?.name || plan.label,
      intermediationFee: Number(dbPlan?.intermediation_fee_percentage ?? dbPlan?.intermediationFee ?? plan.intermediationFee),
      prices,
      discountMonthlyPercent: Number(dbPlan?.discount_monthly_percent ?? dbPlan?.discountMonthlyPercent ?? plan.discountMonthlyPercent ?? 0),
      discountSemestralPercent: Number(dbPlan?.discount_semestral_percent ?? dbPlan?.discountSemestralPercent ?? plan.discountSemestralPercent ?? 0),
      discountAnnualPercent: Number(dbPlan?.discount_annual_percent ?? dbPlan?.discountAnnualPercent ?? plan.discountAnnualPercent ?? 0),
      allowAds: Boolean(dbPlan?.allow_ads ?? plan.allowAds ?? false),
      maxAds: Number(dbPlan?.max_ads ?? plan.maxAds ?? 0),
      priceSlot1: Number(dbPlan?.price_slot_1 ?? plan.priceSlot1 ?? 30),
      priceSlot2: Number(dbPlan?.price_slot_2 ?? plan.priceSlot2 ?? 25),
      priceSlot3: Number(dbPlan?.price_slot_3 ?? plan.priceSlot3 ?? 20),
      features: dbPlan?.features || plan.features,
    };
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
