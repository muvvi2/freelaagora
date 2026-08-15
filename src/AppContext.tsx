import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { AppContext, type AppContextValue, useApp } from './context';
import { initialData, CATEGORIES, metroNearby, emptyAvailability } from './mockData';
import { uid, getPlan, canSelectCategories, getEstPlan, getIntermediationFeePercent, calculateFees, emptyAddress, formatCurrency } from './utils';
import { setPaymentSettings } from '@/services/paymentService';
import { supabase } from '@/lib/supabase';
import type { AppData, User, Job, Contract, WalletTx, AppNotification, Review, Tier, Period, WeekAvailability, DateAvailability, ContractStatus, EstTier, TermsAcceptance, Coupon, VipPlan, EstVipPlan, PaymentSettings, AdminAuditLog, PaymentProviderId, PaymentProviderConfig } from './types';
import {
  loadAllData, dbFetchSingleUser, dbInsertUser, dbUpdateUser, dbDeleteUser,
  dbInsertJob, dbUpdateJob, dbDeleteJob, dbApplyToJob,
  dbInsertContract, dbUpdateContractStatus, dbUpdateContractInvoice,
  dbInsertWalletTx, dbUpdateWalletBalance,
  dbInsertNotification, dbMarkNotificationRead, dbMarkAllNotificationsRead,
  dbInsertReview, dbDeleteReview,
  dbInsertCoupon, dbToggleCoupon, dbDeleteCoupon,
  dbInsertAuditLog, dbUpdateDefaultFeePercent, dbUpdatePaymentSettings,
  dbUpsertVipPlan, dbDeleteVipPlan, dbUpsertEstVipPlan, dbDeleteEstVipPlan,
  dbInsertAdmin
} from '@/services/db';

export { useApp };

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const STORAGE_KEY = 'freelaagora_current_user';

// --- MAPEADORES REALTIME SEGUROS (DB <-> App) ---
const mapJobRealtime = (raw: any, existingUsers: User[] = [], existingJob?: Job): Job => {
  const estId = raw.establishment_id ?? raw.establishmentId ?? '';
  const est = existingUsers.find((u) => u.id === estId);

  let applicants: string[] = existingJob?.applicants ?? [];
  if (Array.isArray(raw.applicants)) {
    applicants = raw.applicants;
  }

  return {
    id: String(raw.id ?? ''),
    establishmentId: estId,
    establishmentName: raw.establishment_name ?? raw.establishmentName ?? est?.name ?? '',
    establishmentPhoto: raw.establishment_photo ?? raw.establishmentPhoto ?? est?.photo ?? '',
    title: raw.title ?? '',
    description: raw.description ?? '',
    category: raw.category ?? 'geral',
    date: raw.job_date ?? raw.date ?? new Date().toISOString(),
    startTime: raw.start_time ?? raw.startTime ?? '18:00',
    hours: Number(raw.hours ?? 8),
    value: Number(raw.value ?? 0),
    urgency: raw.urgency ?? 'esta_semana',
    status: raw.status ?? 'active',
    city: raw.city ?? est?.address?.city ?? '',
    state: raw.state ?? est?.address?.state ?? 'SP',
    applicants,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
};

const mapContractRealtime = (raw: any, existingUsers: User[] = [], existingContract?: Contract): Contract => {
  const estId = raw.establishment_id ?? raw.establishmentId ?? '';
  const flId = raw.freelancer_id ?? raw.freelancerId ?? '';
  const est = existingUsers.find((u) => u.id === estId);
  const fl = existingUsers.find((u) => u.id === flId);

  const rawStatus = raw.status ?? 'requested';
  const status: ContractStatus = ['requested', 'confirmed', 'paid', 'check_in_pending', 'checked_in', 'completed', 'cancelled'].includes(rawStatus) 
    ? rawStatus 
    : 'requested';

  return {
    id: String(raw.id ?? ''),
    jobId: raw.job_id ?? raw.jobId ?? null,
    establishmentId: estId,
    establishmentName: raw.establishment_name ?? raw.establishmentName ?? est?.name ?? '',
    freelancerId: flId,
    freelancerName: raw.freelancer_name ?? raw.freelancerName ?? fl?.name ?? '',
    freelancerPhoto: raw.freelancer_photo ?? raw.freelancerPhoto ?? fl?.photo ?? '',
    freelancerPhone: raw.freelancer_phone ?? raw.freelancerPhone ?? fl?.phone ?? '',
    freelancerWhatsapp: raw.freelancer_whatsapp ?? raw.freelancerWhatsapp ?? fl?.whatsapp ?? '',
    category: raw.category ?? 'geral',
    date: raw.contract_date ?? raw.date ?? new Date().toISOString(),
    hours: Number(raw.hours_contracted ?? raw.hours ?? 8),
    freelancerFee: Number(raw.total_freelancer_value ?? raw.freelancer_fee ?? 0),
    platformFeePercentage: Number(raw.platform_fee_percentage ?? 15),
    platformFee: Number(raw.platform_fee_value ?? raw.platform_fee ?? 0),
    total: Number(raw.total_amount_paid ?? raw.total ?? 0),
    status,
    coraInvoiceId: raw.cora_invoice_id ?? raw.coraInvoiceId ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    history: existingContract?.history ?? [{ status, at: raw.created_at ?? new Date().toISOString() }],
  };
};

const mapNotificationRealtime = (raw: any): AppNotification => ({
  id: String(raw.id ?? ''),
  userId: raw.user_id ?? raw.userId ?? '',
  type: raw.type ?? 'system',
  title: raw.title ?? '',
  body: raw.body ?? '',
  read: Boolean(raw.read ?? false),
  date: raw.created_at ?? raw.date ?? new Date().toISOString(),
  contractId: raw.contract_id ?? raw.contractId ?? undefined,
});

const mapReviewRealtime = (raw: any, existingUsers: User[] = []): Review => {
  const fromId = raw.from_user_id ?? raw.fromId ?? '';
  const fromUser = existingUsers.find((u) => u.id === fromId);
  return {
    id: String(raw.id ?? ''),
    fromId,
    fromName: raw.from_name ?? raw.fromName ?? fromUser?.name ?? '',
    toId: raw.to_user_id ?? raw.toId ?? '',
    rating: Number(raw.rating ?? 5),
    comment: raw.comment ?? '',
    date: raw.created_at ?? raw.date ?? new Date().toISOString(),
  };
};

const mapWalletTxRealtime = (raw: any): WalletTx => ({
  id: String(raw.id ?? ''),
  userId: raw.user_id ?? raw.userId ?? '',
  type: raw.type ?? 'deposit',
  amount: Number(raw.amount ?? 0),
  description: raw.description ?? '',
  contractId: raw.contract_id ?? raw.contractId ?? undefined,
  date: raw.created_at ?? raw.date ?? new Date().toISOString(),
});

const mapCouponRealtime = (raw: any): Coupon => ({
  id: String(raw.id ?? ''),
  code: raw.code ?? '',
  discountPercentage: Number(raw.discount_percentage ?? raw.discountPercentage ?? 0),
  isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
  expiresAt: raw.expires_at ?? raw.expiresAt ?? undefined,
  createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
});

const mapAuditLogRealtime = (raw: any): AdminAuditLog => ({
  id: String(raw.id ?? ''),
  adminId: raw.admin_id ?? raw.adminId ?? '',
  action: raw.action_performed ?? raw.action ?? '',
  targetUserId: raw.target_user_id ?? raw.targetUserId ?? undefined,
  createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => {
    try {
      const savedUserId = localStorage.getItem(STORAGE_KEY);
      if (savedUserId) {
        return { ...initialData, currentUserId: savedUserId };
      }
    } catch (e) {}
    return initialData;
  });

  const [loaded, setLoaded] = useState(false);
  const [adminTab, setAdminTab] = useState('overview');
  const [adminMode, setAdminMode] = useState(true);

  // 1. Carga Inicial dos Dados
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbData = await loadAllData();
        if (!cancelled && dbData) {
          setDataState((prev) => ({ ...dbData, currentUserId: prev.currentUserId ?? dbData.currentUserId }));
        }
      } catch (e) { 
        console.warn("⚠️ Falha ao carregar do Supabase:", e); 
      } finally { 
        if (!cancelled) setLoaded(true); 
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2. Realtime Listener Global Completo (Todas as tabelas do sistema)
  useEffect(() => {
    const refetchUser = (userId: string) => {
      if (!userId) return;
      dbFetchSingleUser(userId).then((freshUser) => {
        if (!freshUser) return;
        setDataState((prev) => {
          const existing = prev.users.find((u) => u.id === userId);
          if (!existing) return { ...prev, users: [...prev.users, freshUser] };
          return {
            ...prev,
            users: prev.users.map((u) => (u.id === userId ? {
              ...existing, ...freshUser,
              name: freshUser.name || existing.name,
              email: freshUser.email || existing.email,
              walletBalance: typeof freshUser.walletBalance === 'number' && !isNaN(freshUser.walletBalance) ? freshUser.walletBalance : existing.walletBalance,
            } : u)),
          };
        });
      }).catch(() => {});
    };

    const channel = supabase
      .channel('global-complete-sync')

      // --- VAGAS ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setDataState((prev) => {
            const newRow = payload.new as any;
            const existing = prev.jobs.find((j) => j.id === newRow.id);
            const item = mapJobRealtime(newRow, prev.users, existing);
            if (existing) {
              return { ...prev, jobs: prev.jobs.map((j) => (j.id === item.id ? { ...existing, ...item, applicants: existing.applicants } : j)) };
            }
            return { ...prev, jobs: [item, ...prev.jobs] };
          });
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }));
        }
      })

      // --- CANDIDATURAS ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applicants' }, (payload) => {
        const raw = (payload.new ?? payload.old) as any;
        const jobId = raw?.job_id ?? raw?.jobId;
        const freelancerId = raw?.freelancer_id ?? raw?.freelancerId;
        if (payload.eventType === 'DELETE') {
          if (jobId && freelancerId) {
            setDataState((prev) => ({ ...prev, jobs: prev.jobs.map((j) => j.id === jobId ? { ...j, applicants: j.applicants.filter((a) => a !== freelancerId) } : j) }));
          }
          return;
        }
        if (jobId && freelancerId) {
          setDataState((prev) => ({ ...prev, jobs: prev.jobs.map((j) => j.id === jobId ? { ...j, applicants: Array.from(new Set([...(j.applicants || []), freelancerId])) } : j) }));
        }
      })

      // --- USUÁRIOS E PERFIS ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }));
          return;
        }
        const userId = (payload.new as any)?.id;
        if (userId) refetchUser(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_profiles' }, (payload) => {
        const userId = (payload.new as any)?.user_id ?? (payload.old as any)?.user_id;
        if (userId) refetchUser(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'establishment_profiles' }, (payload) => {
        const userId = (payload.new as any)?.user_id ?? (payload.old as any)?.user_id;
        if (userId) refetchUser(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_categories' }, (payload) => {
        const userId = (payload.new as any)?.freelancer_id ?? (payload.old as any)?.freelancer_id;
        if (userId) refetchUser(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_availability' }, (payload) => {
        const userId = (payload.new as any)?.freelancer_id ?? (payload.old as any)?.freelancer_id;
        if (userId) refetchUser(userId);
      })

      // --- CONTRATOS ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setDataState((prev) => {
            const newRow = payload.new as any;
            const existing = prev.contracts.find((c) => c.id === newRow.id);
            const item = mapContractRealtime(newRow, prev.users, existing);
            if (existing) {
              return { ...prev, contracts: prev.contracts.map((c) => (c.id === item.id ? { ...existing, ...item, history: existing.history } : c)) };
            }
            return { ...prev, contracts: [item, ...prev.contracts] };
          });
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, contracts: prev.contracts.filter((c) => c.id !== id) }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_events' }, (payload) => {
        const raw = payload.new as any;
        const contractId = raw?.contract_id ?? raw?.contractId;
        if (!contractId) return;
        const rawStatus = raw?.status ?? 'requested';
        const status: ContractStatus = ['requested', 'confirmed', 'paid', 'check_in_pending', 'checked_in', 'completed', 'cancelled'].includes(rawStatus) ? rawStatus : 'requested';
        const event = { status, at: raw?.created_at ?? raw?.at ?? new Date().toISOString(), note: raw?.note ?? undefined };
        setDataState((prev) => ({
          ...prev,
          contracts: prev.contracts.map((c) => c.id === contractId ? { ...c, status, history: [...(c.history || []), event] } : c),
        }));
      })

      // --- NOTIFICAÇÕES ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = mapNotificationRealtime(payload.new as any);
          setDataState((prev) => (prev.notifications.some((n) => n.id === item.id)
            ? { ...prev, notifications: prev.notifications.map((n) => (n.id === item.id ? { ...n, ...item } : n)) }
            : { ...prev, notifications: [item, ...prev.notifications] }));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
        }
      })

      // --- AVALIAÇÕES ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_reviews' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = mapReviewRealtime(payload.new as any, data?.users ?? []);
          setDataState((prev) => (prev.reviews.some((r) => r.id === item.id)
            ? { ...prev, reviews: prev.reviews.map((r) => (r.id === item.id ? { ...r, ...item } : r)) }
            : { ...prev, reviews: [item, ...prev.reviews] }));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, reviews: prev.reviews.filter((r) => r.id !== id) }));
        }
      })

      // --- CARTEIRA E TRANSAÇÕES ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = mapWalletTxRealtime(payload.new as any);
          setDataState((prev) => (prev.walletTxs.some((t) => t.id === item.id)
            ? { ...prev, walletTxs: prev.walletTxs.map((t) => (t.id === item.id ? { ...t, ...item } : t)) }
            : { ...prev, walletTxs: [item, ...prev.walletTxs] }));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, walletTxs: prev.walletTxs.filter((t) => t.id !== id) }));
        }
      })

      // --- CUPONS ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discount_coupons' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = mapCouponRealtime(payload.new as any);
          setDataState((prev) => (prev.coupons.some((c) => c.id === item.id)
            ? { ...prev, coupons: prev.coupons.map((c) => (c.id === item.id ? { ...c, ...item } : c)) }
            : { ...prev, coupons: [item, ...prev.coupons] }));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.id;
          if (id) setDataState((prev) => ({ ...prev, coupons: prev.coupons.filter((c) => c.id !== String(id)) }));
        }
      })

      // --- LOGS DE AUDITORIA ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_audit_logs' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = mapAuditLogRealtime(payload.new as any);
          setDataState((prev) => ({ ...prev, adminAuditLogs: [item, ...prev.adminAuditLogs] }));
        }
      })

      // --- PLANOS VIP (FREELANCER) ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_plans_freelancer' }, (payload) => {
        const raw = (payload.new ?? payload.old) as any;
        const tier = raw?.tier;
        if (!tier) return;
        if (payload.eventType === 'DELETE') {
          setDataState((prev) => ({ ...prev, vipPlans: prev.vipPlans.filter((p) => p.tier !== tier) }));
          return;
        }
        const updatedPlan = {
          tier: raw.tier,
          label: raw.label ?? '',
          priceMonthly: Number(raw.price_monthly ?? raw.priceMonthly ?? 0),
          priceSemestral: Number(raw.price_semestral ?? raw.priceSemestral ?? 0),
          priceAnnual: Number(raw.price_annual ?? raw.priceAnnual ?? 0),
          maxCategories: Number(raw.max_categories ?? raw.maxCategories ?? 1),
          prices: {
            monthly: Number(raw.price_monthly ?? raw.priceMonthly ?? 0),
            semestral: Number(raw.price_semestral ?? raw.priceSemestral ?? 0),
            annual: Number(raw.price_annual ?? raw.priceAnnual ?? 0),
          },
          features: Array.isArray(raw.features) ? raw.features : [],
        };
        setDataState((prev) => {
          const exists = prev.vipPlans.some((p) => p.tier === tier);
          if (exists) {
            return { ...prev, vipPlans: prev.vipPlans.map((p) => p.tier === tier ? { ...p, ...updatedPlan } : p) };
          }
          return { ...prev, vipPlans: [...prev.vipPlans, updatedPlan] };
        });
      })

      // --- PLANOS VIP (ESTABELECIMENTO) ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_plans_establishment' }, (payload) => {
        const raw = (payload.new ?? payload.old) as any;
        const tier = raw?.tier;
        if (!tier) return;
        if (payload.eventType === 'DELETE') {
          setDataState((prev) => ({ ...prev, estVipPlans: prev.estVipPlans.filter((p) => p.tier !== tier) }));
          return;
        }
        const updatedEstPlan = {
          tier: raw.tier,
          label: raw.label ?? '',
          priceMonthly: Number(raw.price_monthly ?? raw.priceMonthly ?? 0),
          priceSemestral: Number(raw.price_semestral ?? raw.priceSemestral ?? 0),
          priceAnnual: Number(raw.price_annual ?? raw.priceAnnual ?? 0),
          prices: {
            monthly: Number(raw.price_monthly ?? raw.priceMonthly ?? 0),
            semestral: Number(raw.price_semestral ?? raw.priceSemestral ?? 0),
            annual: Number(raw.price_annual ?? raw.priceAnnual ?? 0),
          },
          features: Array.isArray(raw.features) ? raw.features : [],
        };
        setDataState((prev) => {
          const exists = prev.estVipPlans.some((p) => p.tier === tier);
          if (exists) {
            return { ...prev, estVipPlans: prev.estVipPlans.map((p) => p.tier === tier ? { ...p, ...updatedEstPlan } : p) };
          }
          return { ...prev, estVipPlans: [...prev.estVipPlans, updatedEstPlan] };
        });
      })

      // --- CONFIGURAÇÕES GLOBAIS E DE PAGAMENTO ---
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_config' }, (payload) => {
        if (payload.new) {
          setDataState((prev) => ({ ...prev, config: { defaultFeePercent: Number((payload.new as any).default_fee_percent ?? 15) } }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_settings' }, (payload) => {
        if (payload.new) {
          const ps = payload.new as any;
          const configs: Partial<Record<string, PaymentProviderConfig>> = {};
          if (ps.configs) {
            for (const [key, val] of Object.entries(ps.configs)) {
              if (val && typeof val === 'object') {
                const v = val as { apiKey?: string; env?: string };
                configs[key as PaymentProviderId] = { apiKey: v.apiKey ?? '', env: (v.env as 'sandbox' | 'production') ?? 'sandbox' };
              }
            }
          }
          const settings: PaymentSettings = { activeProvider: ps.active_provider ?? 'asaas', configs };
          setDataState((prev) => ({ ...prev, paymentSettings: settings }));
        }
      })

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("🟢 Canal Realtime global sincronizado com sucesso!");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (data?.paymentSettings) {
      setPaymentSettings(data.paymentSettings ?? { activeProvider: 'asaas', configs: {} });
    }
  }, [data?.paymentSettings]);

  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: AppData) => AppData)(prev) : updater;
      try {
        if (next.currentUserId) localStorage.setItem(STORAGE_KEY, next.currentUserId);
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setDataState(initialData);
  }, []);

  const currentUser = useMemo(() => data?.users.find((u) => u.id === data.currentUserId) ?? null, [data?.users, data?.currentUserId]);
  const isAdmin = !!currentUser?.isAdmin;
  const isSuperAdmin = !!currentUser?.isAdmin && currentUser?.adminRole === 'super';
  const currentAdminId = currentUser?.id ?? ADMIN_ID;

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema ainda carregando.' };
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return { ok: false, error: 'E-mail não cadastrado.' };
    if (user.password !== password) return { ok: false, error: 'Senha incorreta.' };
    if (user.banned) return { ok: false, error: 'Esta conta foi banida.' };
    setData((d) => ({ ...d, currentUserId: user.id }));
    return { ok: true };
  }, [data?.users, setData]);

  const register = useCallback((user: Omit<User, 'id' | 'createdAt' | 'walletBalance' | 'rating' | 'reviewsCount' | 'completedShifts'> & Partial<User>): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema ainda carregando.' };
    if (data.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase().trim())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const id = crypto.randomUUID();
    const newUser: User = {
      ...user, id, email: user.email.toLowerCase().trim(), createdAt: new Date().toISOString(),
      walletBalance: 0, rating: user.accountType === 'freelancer' ? 5 : 0, reviewsCount: 0, completedShifts: 0,
      vipTier: user.accountType === 'freelancer' ? 'free' : undefined,
      estVipTier: user.accountType === 'establishment' ? 'trial' : undefined,
      trialEndsAt: user.accountType === 'establishment' ? new Date(Date.now() + 15 * 86400000).toISOString() : undefined,
      categories: user.accountType === 'freelancer' ? (user.categories ?? []) : undefined,
      availability: user.accountType === 'freelancer' ? (user.availability ?? emptyAvailability()) : undefined,
      address: user.address ?? emptyAddress(),
    } as User;
    setData((d) => ({ ...d, users: [...d.users, newUser], currentUserId: id }));
    void dbInsertUser(newUser).catch(() => {});
    return { ok: true };
  }, [data, setData]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setData((d) => ({ ...d, currentUserId: null }));
  }, [setData]);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    void dbUpdateUser(id, patch).catch(() => {});
  }, [setData]);

  const adminUpdateUser = useCallback((id: string, patch: Partial<User>) => {
    const stampedPatch = { ...patch, lastAdminEdit: new Date().toISOString() };
    const auditLog = { id: crypto.randomUUID(), adminId: currentAdminId, action: `Admin alterou dados do usuário ${id}`, targetUserId: id, createdAt: new Date().toISOString() };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, ...stampedPatch } : u)),
      adminAuditLogs: [auditLog, ...d.adminAuditLogs]
    }));
    void dbUpdateUser(id, stampedPatch).catch(() => {});
    void dbInsertAuditLog(auditLog).catch(() => {});
  }, [setData, currentAdminId]);

  const deleteEntity = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));
    void dbDeleteUser(id).catch(() => {});
  }, [setData]);

  const banUser = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, banned: true } : u)) }));
    void dbUpdateUser(id, { banned: true }).catch(() => {});
  }, [setData]);

  const unbanUser = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, banned: false } : u)) }));
    void dbUpdateUser(id, { banned: false }).catch(() => {});
  }, [setData]);

  const setVipTier = useCallback((id: string, tier: Tier, period: Period = 'monthly'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find(u => u.id === id);
    const price = getPlan(tier, data.vipPlans).prices[period];
    if (tier !== 'free' && price > 0 && (user?.walletBalance ?? 0) < price) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }
    const expiry = tier === 'free' ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
    const newTxs: WalletTx[] = price > 0 ? [{ id: crypto.randomUUID(), userId: id, type: 'vip_charge', amount: -price, description: `Assinatura ${getPlan(tier, data.vipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, vipTier: tier, vipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
      walletTxs: [...newTxs, ...d.walletTxs]
    }));
    void dbUpdateUser(id, { vipTier: tier, vipExpiresAt: expiry, estVipTier: user?.estVipTier }).catch(() => {});
    if (price > 0 && newTxs[0]) {
      void dbInsertWalletTx(newTxs[0]).catch(() => {});
      if (user) void dbUpdateWalletBalance(id, Math.max(0, (user.walletBalance ?? 0) - price)).catch(() => {});
    }
    return { ok: true };
  }, [setData, data]);

  const setEstVipTier = useCallback((id: string, tier: EstTier, period: Period = 'monthly'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find(u => u.id === id);
    const price = getEstPlan(tier, data.estVipPlans).prices[period];
    if (tier !== 'free' && tier !== 'trial' && price > 0 && (user?.walletBalance ?? 0) < price) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }
    const expiry = (tier === 'free' || tier === 'trial') ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
    const newTrialEndsAt = (tier !== 'free' && tier !== 'trial') ? undefined : user?.trialEndsAt;
    const newTxs: WalletTx[] = price > 0 ? [{ id: crypto.randomUUID(), userId: id, type: 'vip_charge_est', amount: -price, description: `Assinatura ${getEstPlan(tier, data.estVipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
    
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, estVipTier: tier, estVipExpiresAt: expiry, trialEndsAt: newTrialEndsAt, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
      walletTxs: [...newTxs, ...d.walletTxs]
    }));

    void dbUpdateUser(id, { estVipTier: tier, est_vip_tier: tier, estVipExpiresAt: expiry, trialEndsAt: newTrialEndsAt } as any).catch((err) => {
      console.error("Erro ao atualizar VIP do estabelecimento no banco:", err);
    });
    
    if (price > 0 && newTxs[0]) {
      void dbInsertWalletTx(newTxs[0]).catch(() => {});
      if (user) void dbUpdateWalletBalance(id, Math.max(0, (user.walletBalance ?? 0) - price)).catch(() => {});
    }
    return { ok: true };
  }, [setData, data]);

  const setTermsAcceptance = useCallback((id: string, acceptance: TermsAcceptance) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, termsAcceptance: acceptance } : u)) }));
    void dbUpdateUser(id, { termsAcceptance: acceptance }).catch(() => {});
  }, [setData]);

  const setAvailability = useCallback((userId: string, av: WeekAvailability) => {
    const user = data?.users.find((u) => u.id === userId);
    updateUser(userId, { availability: av, dateAvailability: user?.dateAvailability ?? {} });
  }, [data?.users, updateUser]);
  
  const toggleAvailabilitySlot = useCallback((userId: string, day: keyof WeekAvailability, shift: 'manha' | 'tarde' | 'noite') => {
    setData((d) => {
      const users = d.users.map((u) => {
        if (u.id !== userId) return u;
        const av = u.availability ?? emptyAvailability();
        const updated = { ...av, [day]: { ...av[day], [shift]: !av[day][shift] } };
        return { ...u, availability: updated };
      });
      const user = users.find((u) => u.id === userId);
      if (user?.availability) void dbUpdateUser(userId, { availability: user.availability, dateAvailability: user.dateAvailability ?? {} }).catch(() => {});
      return { ...d, users };
    });
  }, [setData]);

  const toggleDateShift = useCallback((userId: string, dateKey: string, shift: 'manha' | 'tarde' | 'noite') => {
    setData((d) => {
      const users = d.users.map((u) => {
        if (u.id !== userId) return u;
        const da = { ...(u.dateAvailability ?? {}) } as DateAvailability;
        const day = { ...(da[dateKey] ?? { manha: false, tarde: false, noite: false }) };
        day[shift] = !day[shift];
        if (!day.manha && !day.tarde && !day.noite) { delete da[dateKey]; } else { da[dateKey] = day; }
        return { ...u, dateAvailability: da };
      });
      const user = users.find((u) => u.id === userId);
      if (user) {
        void dbUpdateUser(userId, { availability: user.availability ?? emptyAvailability(), dateAvailability: user.dateAvailability ?? {} }).catch((err) => {
          console.error("Erro ao salvar agenda no banco:", err);
        });
      }
      return { ...d, users };
    });
  }, [setData]);

  const toggleCategory = useCallback((userId: string, categoryId: string): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: 'Usuário não encontrado.' };
    const current = user.categories ?? [];
    const tier = user.vipTier ?? 'free';
    if (current.includes(categoryId)) {
      updateUser(userId, { categories: current.filter((c) => c !== categoryId) });
      return { ok: true };
    }
    if (!canSelectCategories(tier, current.length, data.vipPlans)) {
      const plan = getPlan(tier, data.vipPlans);
      return { ok: false, error: `Seu plano ${plan.label} permite até ${plan.maxCategories} categorias.` };
    }
    updateUser(userId, { categories: [...current, categoryId] });
    return { ok: true };
  }, [data, updateUser]);

  const addJob = useCallback((j: Job): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const est = data.users.find((u) => u.id === j.establishmentId);
    if (!est) return { ok: false, error: 'Estabelecimento não encontrado.' };

    const fullJob: Job = {
      ...j,
      establishmentName: j.establishmentName || est.name || 'Estabelecimento',
      establishmentPhoto: j.establishmentPhoto || est.photo || '',
      city: j.city || est.address?.city || '',
      state: j.state || est.address?.state || 'SP',
      applicants: Array.isArray(j.applicants) ? j.applicants : [],
      status: j.status || 'active',
      createdAt: j.createdAt || new Date().toISOString()
    };

    setData((d) => ({ ...d, jobs: [fullJob, ...d.jobs] }));
    void dbInsertJob(fullJob).catch(() => {});
    return { ok: true };
  }, [data, setData]);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
    void dbUpdateJob(id, patch).catch(() => {});
  }, [setData]);

  const deleteJob = useCallback((id: string) => {
    setData((d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== id) }));
    void dbDeleteJob(id).catch(() => {});
  }, [setData]);

  const pauseJob = useCallback((id: string) => {
    if (!data) return;
    const job = data.jobs.find((j) => j.id === id);
    const newStatus = job?.status === 'paused' ? 'active' : 'paused';
    setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j)) }));
    void dbUpdateJob(id, { status: newStatus }).catch(() => {});
  }, [setData, data]);

  const applyToJob = useCallback((jobId: string, freelancerId: string) => {
    setData((d) => {
      const updatedJobs = d.jobs.map((j) => {
        if (j.id === jobId && !j.applicants.includes(freelancerId)) {
          return { ...j, applicants: [...j.applicants, freelancerId] };
        }
        return j;
      });
      const targetJob = updatedJobs.find(j => j.id === jobId);
      if (targetJob) {
        void dbUpdateJob(jobId, { applicants: targetJob.applicants }).catch(() => {});
      }
      return { ...d, jobs: updatedJobs };
    });
    void dbApplyToJob(jobId, freelancerId).catch(() => {});
  }, [setData]);

  const notifyUser = useCallback((userId: string, type: AppNotification['type'], title: string, body: string, contractId?: string) => {
    const n: AppNotification = { id: crypto.randomUUID(), userId, type, title, body, read: false, date: new Date().toISOString(), contractId };
    setData((d) => ({ ...d, notifications: [n, ...d.notifications] }));
    void dbInsertNotification(n).catch(() => {});
  }, [setData]);

  const markNotificationRead = useCallback((id: string) => {
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    void dbMarkNotificationRead(id).catch(() => {});
  }, [setData]);

  const markAllNotificationsRead = useCallback((userId: string) => {
    setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) }));
    void dbMarkAllNotificationsRead(userId).catch(() => {});
  }, [setData]);

  const userNotifications = useCallback((userId: string) => data?.notifications.filter((n) => n.userId === userId) ?? [], [data?.notifications]);
  const userWalletBalance = useCallback((userId: string) => data?.users.find((u) => u.id === userId)?.walletBalance ?? 0, [data?.users]);
  const userWalletTxs = useCallback((userId: string) => data?.walletTxs.filter((t) => t.userId === userId) ?? [], [data?.walletTxs]);
  const adminWalletTxs = useCallback(() => data?.walletTxs.filter((t) => t.userId === ADMIN_ID) ?? [], [data?.walletTxs]);

  const depositToWallet = useCallback((userId: string, amount: number, description?: string) => {
    if (!data) return;
    const tx: WalletTx = { id: crypto.randomUUID(), userId, type: 'deposit', amount, description: description ?? 'Depósito', date: new Date().toISOString() };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: (u.walletBalance ?? 0) + amount } : u)),
      walletTxs: [tx, ...d.walletTxs]
    }));
    void dbInsertWalletTx(tx).catch(() => {});
    const newBal = (data.users.find((u) => u.id === userId)?.walletBalance ?? 0) + amount;
    void dbUpdateWalletBalance(userId, newBal).catch(() => {});
  }, [setData, data]);

  const withdrawFromWallet = useCallback((userId: string, amount: number, description?: string) => {
    if (!data) return;
    const tx: WalletTx = { id: crypto.randomUUID(), userId, type: 'withdraw', amount: -amount, description: description ?? 'Saque', date: new Date().toISOString() };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, (u.walletBalance ?? 0) - amount) } : u)),
      walletTxs: [tx, ...d.walletTxs]
    }));
    void dbInsertWalletTx(tx).catch(() => {});
    const newBal = Math.max(0, (data.users.find((u) => u.id === userId)?.walletBalance ?? 0) - amount);
    void dbUpdateWalletBalance(userId, newBal).catch(() => {});
  }, [setData, data]);

  const requestHire = useCallback((establishmentId: string, freelancerId: string, jobId: string | null, hours: number, freelancerFee: number): Contract => {
    const est = data?.users.find((u) => u.id === establishmentId);
    const fl = data?.users.find((u) => u.id === freelancerId);

    const defaultFee = data?.config?.defaultFeePercent ?? 15;
    const feePercent = est ? getIntermediationFeePercent(est, data.estVipPlans, data.vipPlans, defaultFee) : defaultFee;
    const { fee, total } = calculateFees(freelancerFee, feePercent);

    const contract: Contract = {
      id: crypto.randomUUID(), 
      jobId, 
      establishmentId, 
      establishmentName: est?.name ?? '',
      freelancerId, 
      freelancerName: fl?.name ?? '', 
      freelancerPhoto: fl?.photo ?? '',
      freelancerPhone: fl?.phone ?? '', 
      freelancerWhatsapp: fl?.whatsapp ?? '',
      category: fl?.categories?.[0] ?? 'geral', 
      date: new Date().toISOString(), 
      hours,
      freelancerFee, 
      platformFeePercentage: feePercent, 
      platformFee: fee, 
      total,
      status: 'requested', 
      createdAt: new Date().toISOString(), 
      history: [{ status: 'requested', at: new Date().toISOString() }],
    };

    const notifs: AppNotification[] = [
      { id: crypto.randomUUID(), userId: freelancerId, type: 'hire_request', title: 'Nova solicitação', body: `${est?.name} quer te contratar.`, read: false, date: new Date().toISOString(), contractId: contract.id },
    ];

    setData((d) => ({ ...d, contracts: [contract, ...d.contracts], notifications: [...notifs, ...d.notifications] }));
    void dbInsertContract(contract).catch(() => {});
    return contract;
  }, [data, setData]);

  const confirmAvailability = useCallback(async (contractId: string) => {
    if (!data) return;
    const contract = data.contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const updatedHistory = [...(contract.history || []), { status: 'confirmed' as ContractStatus, at: new Date().toISOString() }];

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => (ct.id === contractId ? { ...ct, status: 'confirmed', history: updatedHistory } : ct)),
      notifications: [
        { id: crypto.randomUUID(), userId: contract.establishmentId, type: 'hire_request', title: 'Disponibilidade Confirmada!', body: `${contract.freelancerName} confirmou a disponibilidade. Realize o pagamento em garantia para liberar o contato.`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));

    void dbUpdateContractStatus(contractId, 'confirmed').catch(() => {});
  }, [data, setData]);

  const payEscrow = useCallback((contractId: string, paymentMethod: 'wallet' | 'pix' | 'card' = 'wallet'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const c = data.contracts.find((x) => x.id === contractId);
    const est = data.users.find(u => u.id === c?.establishmentId);
    if (!c || !est) return { ok: false, error: 'Contrato ou usuário não encontrado.' };

    if (paymentMethod === 'wallet' && (est.walletBalance ?? 0) < c.total) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }

    const newBalance = paymentMethod === 'wallet' ? Math.max(0, (est.walletBalance ?? 0) - c.total) : (est.walletBalance ?? 0);
    const invoiceId = c.coraInvoiceId ?? `inv-${crypto.randomUUID()}`;
    const estTx: WalletTx = { id: crypto.randomUUID(), userId: c.establishmentId, type: 'escrow_hold', amount: -c.total, description: `Escrow — ${c.freelancerName}`, contractId, date: new Date().toISOString() };
    const updatedHistory = [...(c.history || []), { status: 'paid' as ContractStatus, at: new Date().toISOString() }];

    setData((d) => ({
      ...d,
      users: d.users.map(u => u.id === c.establishmentId ? { ...u, walletBalance: newBalance } : u),
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'paid', coraInvoiceId: invoiceId, history: updatedHistory } : ct),
      walletTxs: [estTx, ...d.walletTxs],
      notifications: [
        { id: crypto.randomUUID(), userId: c.freelancerId, type: 'hire_request', title: 'Pagamento Realizado!', body: `O estabelecimento ${c.establishmentName} realizou o pagamento em garantia. Contato liberado!`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));

    void dbUpdateContractStatus(contractId, 'paid').catch(() => {});
    void dbUpdateContractInvoice(contractId, invoiceId).catch(() => {});
    void dbInsertWalletTx(estTx).catch(() => {});
    if (paymentMethod === 'wallet') void dbUpdateWalletBalance(c.establishmentId, newBalance as number).catch(() => {});
    
    return { ok: true };
  }, [data, setData]);

  const requestCheckIn = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    const updatedHistory = [...(c.history || []), { status: 'check_in_pending' as ContractStatus, at: new Date().toISOString(), note: 'Profissional registrou chegada, aguardando estabelecimento.' }];

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'check_in_pending', history: updatedHistory } : ct),
      notifications: [
        { id: crypto.randomUUID(), userId: c.establishmentId, type: 'system', title: 'Chegada do Profissional', body: `${c.freelancerName} fez o check-in e aguarda sua confirmação de presença.`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));
    void dbUpdateContractStatus(contractId, 'check_in_pending').catch(() => {});
  }, [data, setData]);

  const confirmCheckIn = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    const updatedHistory = [...(c.history || []), { status: 'checked_in' as ContractStatus, at: new Date().toISOString(), note: 'Estabelecimento confirmou a presença.' }];

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'checked_in', history: updatedHistory } : ct),
      notifications: [
        { id: crypto.randomUUID(), userId: c.freelancerId, type: 'system', title: 'Check-in Confirmado!', body: `O estabelecimento ${c.establishmentName} confirmou sua presença. Bom trabalho!`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));
    void dbUpdateContractStatus(contractId, 'checked_in').catch(() => {});
  }, [data, setData]);

  const finishService = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find((x) => x.id === contractId);
    if (!c) return;
    const flRelease: WalletTx = { id: crypto.randomUUID(), userId: c.freelancerId, type: 'escrow_release', amount: c.freelancerFee, description: `Repasse — ${c.establishmentName}`, contractId, date: new Date().toISOString() };
    const adminFee: WalletTx = { id: crypto.randomUUID(), userId: ADMIN_ID, type: 'platform_fee', amount: c.platformFee, description: `Taxa (${c.platformFeePercentage}%)`, contractId, date: new Date().toISOString() };
    const updatedHistory = [...(c.history || []), { status: 'completed' as ContractStatus, at: new Date().toISOString() }];

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'completed', history: updatedHistory } : ct),
      walletTxs: [flRelease, adminFee, ...d.walletTxs]
    }));
    void dbUpdateContractStatus(contractId, 'completed').catch(() => {});
    void dbInsertWalletTx(flRelease).catch(() => {});
    void dbInsertWalletTx(adminFee).catch(() => {});
  }, [data, setData]);

  const cancelContract = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    const est = data.users.find(u => u.id === c.establishmentId);
    const wasPaid = c.status === 'paid' || c.status === 'check_in_pending' || c.status === 'checked_in';

    const refundAmount = wasPaid ? c.total : 0;
    const newWalletBalance = (est?.walletBalance ?? 0) + refundAmount;

    const refundTx: WalletTx | null = refundAmount > 0 ? {
      id: crypto.randomUUID(),
      userId: c.establishmentId,
      type: 'deposit',
      amount: refundAmount,
      description: `Estorno por cancelamento — Contrato ${c.id.slice(0, 8)}`,
      contractId,
      date: new Date().toISOString()
    } : null;

    const updatedHistory = [...(c.history || []), { status: 'cancelled' as ContractStatus, at: new Date().toISOString() }];

    setData((d) => ({
      ...d,
      users: d.users.map(u => u.id === c.establishmentId ? { ...u, walletBalance: newWalletBalance } : u),
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'cancelled', history: updatedHistory } : ct),
      walletTxs: refundTx ? [refundTx, ...d.walletTxs] : d.walletTxs,
      notifications: [
        {
          id: crypto.randomUUID(),
          userId: c.establishmentId,
          type: 'system',
          title: 'Contrato Cancelado e Estornado',
          body: refundAmount > 0 
            ? `O contrato foi cancelado. O valor de ${formatCurrency(refundAmount)} foi estornado para sua carteira.` 
            : 'O contrato foi cancelado com sucesso.',
          read: false,
          date: new Date().toISOString(),
          contractId
        },
        {
          id: crypto.randomUUID(),
          userId: c.freelancerId,
          type: 'system',
          title: 'Contrato Cancelado',
          body: `O contrato com ${c.establishmentName} foi cancelado.`,
          read: false,
          date: new Date().toISOString(),
          contractId
        },
        ...d.notifications
      ]
    }));

    void dbUpdateContractStatus(contractId, 'cancelled').catch(() => {});
    if (refundAmount > 0 && refundTx) {
      void dbInsertWalletTx(refundTx).catch(() => {});
      void dbUpdateWalletBalance(c.establishmentId, newWalletBalance).catch(() => {});
    }
  }, [data, setData]);

  const submitReview = useCallback((contractId: string, fromId: string, fromName: string, toId: string, rating: number, comment: string) => {
    if (!data) return;
    const review: Review = { id: crypto.randomUUID(), fromId, fromName, toId, rating, comment, date: new Date().toISOString() };
    setData((d) => ({ ...d, reviews: [review, ...d.reviews] }));
    void dbInsertReview(review, contractId, false).catch(() => {});
  }, [data, setData]);

  const reviewsFor = useCallback((userId: string) => data?.reviews.filter((r) => r.toId === userId) ?? [], [data?.reviews]);

  const setDefaultFeePercent = useCallback((n: number) => {
    setData((d) => ({ ...d, config: { ...d.config, defaultFeePercent: n } }));
    void dbUpdateDefaultFeePercent(n).catch(() => {});
  }, [setData]);

  const updatePaymentSettings = useCallback((settings: PaymentSettings) => {
    setData((d) => ({ ...d, paymentSettings: settings }));
    void dbUpdatePaymentSettings(settings).catch(() => {});
  }, [setData]);

  const overrideContractStatus = useCallback((contractId: string, status: ContractStatus) => {
    setData((d) => ({ ...d, contracts: d.contracts.map((c) => c.id === contractId ? { ...c, status } : c) }));
    void dbUpdateContractStatus(contractId, status).catch(() => {});
  }, [setData]);

  const forceRefund = useCallback((contractId: string) => {
    if (!data) return;
    setData((d) => ({ ...d, contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'cancelled' } : ct) }));
    void dbUpdateContractStatus(contractId, 'cancelled').catch(() => {});
  }, [setData, data]);

  const coupons = useMemo(() => data?.coupons ?? [], [data?.coupons]);

  const validateCoupon = useCallback((code: string) => {
    if (!data) return { error: 'Carregando.' };
    const c = data.coupons.find((cp) => cp.code.toUpperCase() === code.toUpperCase().trim() && cp.isActive);
    if (!c) return { error: 'Cupom inválido.' };
    return { coupon: c };
  }, [data]);

  const addCoupon = useCallback((coupon: Omit<Coupon, 'id' | 'createdAt'>) => {
    const newCoupon = { ...coupon, id: crypto.randomUUID(), usedBy: [], createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, coupons: [newCoupon, ...d.coupons] }));
    void dbInsertCoupon(newCoupon).catch(() => {});
  }, [setData]);

  const toggleCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c) }));
    void dbToggleCoupon(id).catch(() => {});
  }, [setData]);

  const deleteCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
    void dbDeleteCoupon(id).catch(() => {});
  }, [setData]);

  const applyCouponToPurchase = useCallback((userId: string, tier: Tier | EstTier, period: Period, coupon: Coupon, accountType: 'freelancer' | 'establishment') => {
    return { ok: true, discountedPrice: 0 };
  }, []);

  const auditLogs = useMemo(() => data?.adminAuditLogs ?? [], [data?.adminAuditLogs]);
  const logAdminAction = useCallback((action: string, targetUserId?: string) => {
    const auditLog = { id: crypto.randomUUID(), adminId: currentAdminId, action, targetUserId, createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, adminAuditLogs: [auditLog, ...d.adminAuditLogs] }));
    void dbInsertAuditLog(auditLog).catch(() => {});
  }, [setData, currentAdminId]);

  const adminCreateUser = useCallback(async (user: User) => { 
    setData((d) => ({ ...d, users: [...d.users, user] }));
    await dbInsertUser(user);
    return { ok: true };
  }, [setData]);

  const adminCreateAdmin = useCallback(async (user: any) => {
    const adminUser = { ...user, id: crypto.randomUUID(), isAdmin: true };
    setData((d) => ({ ...d, users: [...d.users, adminUser] }));
    await dbInsertAdmin(adminUser);
    return { ok: true };
  }, [setData]);

  const adminRemoveAdmin = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));
    void dbDeleteUser(id).catch(() => {});
  }, [setData]);

  const adjustWallet = useCallback((userId: string, amount: number, description: string) => {
    if (!data) return;
    const tx: WalletTx = { 
      id: crypto.randomUUID(), 
      userId, 
      type: amount >= 0 ? 'deposit' : 'withdraw', 
      amount, 
      description: `[Admin] ${description}`, 
      date: new Date().toISOString() 
    };
    const auditLog = { 
      id: crypto.randomUUID(), 
      adminId: currentAdminId, 
      action: `Admin ajustou carteira de ${userId} em ${amount >= 0 ? '+' : ''}${amount} (${description})`, 
      targetUserId: userId, 
      createdAt: new Date().toISOString() 
    };
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, (u.walletBalance ?? 0) + amount) } : u)),
      walletTxs: [tx, ...d.walletTxs],
      adminAuditLogs: [auditLog, ...d.adminAuditLogs]
    }));
    void dbInsertWalletTx(tx).catch(() => {});
    const user = data.users.find((u) => u.id === userId);
    if (user) {
      const newBalance = Math.max(0, (user.walletBalance ?? 0) + amount);
      void dbUpdateWalletBalance(userId, newBalance).catch(() => {});
    }
    void dbInsertAuditLog(auditLog).catch(() => {});
  }, [setData, currentAdminId, data]);

  const deleteReview = useCallback((reviewId: string) => {
    setData((d) => ({ ...d, reviews: d.reviews.filter((r) => r.id !== reviewId) }));
    void dbDeleteReview(reviewId).catch(() => {});
  }, [setData]);

  const broadcastNotification = useCallback((title: string, body: string) => {
    data?.users.forEach(u => {
        notifyUser(u.id, 'system', title, body);
    });
  }, [data, notifyUser]);

  const updateVipPlan = useCallback((tier: Tier, patch: Partial<VipPlan>) => {
    setData((d) => ({ ...d, vipPlans: d.vipPlans.map((p) => p.tier === tier ? { ...p, ...patch } : p) }));
    const plan = data?.vipPlans.find(p => p.tier === tier);
    if (plan) void dbUpsertVipPlan({ ...plan, ...patch }).catch(() => {});
  }, [setData, data]);

  const addVipPlan = useCallback((plan: VipPlan) => {
    setData((d) => ({ ...d, vipPlans: [...d.vipPlans, plan] }));
    void dbUpsertVipPlan(plan).catch(() => {});
  }, [setData]);

  const removeVipPlan = useCallback((tier: Tier) => {
    setData((d) => ({ ...d, vipPlans: d.vipPlans.filter((p) => p.tier !== tier) }));
    void dbDeleteVipPlan(tier).catch(() => {});
  }, [setData]);

  const updateEstVipPlan = useCallback((tier: EstTier, patch: Partial<EstVipPlan>) => {
    setData((d) => ({ ...d, estVipPlans: d.estVipPlans.map((p) => p.tier === tier ? { ...p, ...patch } : p) }));
    const plan = data?.estVipPlans.find(p => p.tier === tier);
    if (plan) void dbUpsertEstVipPlan({ ...plan, ...patch }).catch(() => {});
  }, [setData, data]);

  const addEstVipPlan = useCallback((plan: EstVipPlan) => {
    setData((d) => ({ ...d, estVipPlans: [...d.estVipPlans, plan] }));
    void dbUpsertEstVipPlan(plan).catch(() => {});
  }, [setData]);

  const removeEstVipPlan = useCallback((tier: EstTier) => {
    setData((d) => ({ ...d, estVipPlans: d.estVipPlans.filter((p) => p.tier !== tier) }));
    void dbDeleteEstVipPlan(tier).catch(() => {});
  }, [setData]);

  const enterAdminMode = useCallback(() => setAdminMode(true), []);
  const exitAdminMode = useCallback(() => { setAdminMode(false); setAdminTab('overview'); }, []);

  const freelancers = useMemo(() => data?.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin) ?? [], [data?.users]);
  const establishments = useMemo(() => data?.users.filter((u) => u.accountType === 'establishment') ?? [], [data?.users]);
  const nearbyFreelancers = useCallback((city: string) => {
    if (!data) return [];
    const nearby = metroNearby(city);
    return data.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin && !u.banned && nearby.includes(u.address?.city ?? ''));
  }, [data?.users]);
  const categoryById = useCallback((id: string) => CATEGORIES.find((c) => c.id === id), []);

  const value = useMemo<AppContextValue>(() => ({
    data: data!, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    setAvailability, toggleAvailabilitySlot, toggleDateShift, toggleCategory,
    addJob, updateJob, deleteJob, pauseJob, applyToJob,
    requestHire, confirmAvailability, payEscrow, requestCheckIn, confirmCheckIn, finishService, cancelContract,
    submitReview, notify: notifyUser, markNotificationRead, markAllNotificationsRead, userNotifications,
    userWalletBalance, userWalletTxs, adminWalletTxs, depositToWallet, withdrawFromWallet,
    reviewsFor, setDefaultFeePercent, updatePaymentSettings, overrideContractStatus, forceRefund, resetData,
    freelancers, establishments, nearbyFreelancers, categoryById,
    adminTab, setAdminTab, adminMode, exitAdminMode, enterAdminMode,
    coupons, validateCoupon, addCoupon, toggleCoupon, deleteCoupon, applyCouponToPurchase,
    auditLogs, logAdminAction, adminCreateUser, adminCreateAdmin, removeAdmin: adminRemoveAdmin, adjustWallet, deleteReview, broadcastNotification,
    updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan,
    defaultFeePercent: data?.config?.defaultFeePercent ?? 15,
  }), [
    data, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    setAvailability, toggleAvailabilitySlot, toggleDateShift, toggleCategory, addJob, updateJob, deleteJob, pauseJob, applyToJob,
    requestHire, confirmAvailability, payEscrow, requestCheckIn, confirmCheckIn, finishService, cancelContract,
    submitReview, notifyUser, markNotificationRead, markAllNotificationsRead, userNotifications,
    userWalletBalance, userWalletTxs, adminWalletTxs, depositToWallet, withdrawFromWallet,
    reviewsFor, setDefaultFeePercent, updatePaymentSettings, overrideContractStatus, forceRefund, resetData, freelancers, establishments, nearbyFreelancers, categoryById,
    adminTab, setAdminTab, adminMode, exitAdminMode, enterAdminMode,
    coupons, validateCoupon, addCoupon, toggleCoupon, deleteCoupon, applyCouponToPurchase,
    auditLogs, logAdminAction, adminCreateUser, adminCreateAdmin, adminRemoveAdmin, adjustWallet, deleteReview, broadcastNotification,
    updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan,
  ]);

  if (!loaded || !data) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white"><div className="animate-pulse text-sm">Carregando FreelaAgora…</div></div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
