import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { AppContext, type AppContextValue, useApp } from './context';
import { initialData, CATEGORIES, metroNearby, emptyAvailability } from './mockData';
import { uid, getPlan, canSelectCategories, getEstPlan, getIntermediationFeePercent, calculateFees } from './utils';
import { setPaymentSettings } from '@/services/paymentService';
import type { AppData, User, Job, Contract, WalletTx, AppNotification, Review, Tier, Period, WeekAvailability, DateAvailability, ContractStatus, EstTier, TermsAcceptance, Coupon, VipPlan, EstVipPlan, PaymentSettings } from './types';
import {
  loadAllData, dbInsertUser, dbUpdateUser, dbDeleteUser,
  dbInsertJob, dbUpdateJob, dbDeleteJob, dbApplyToJob,
  dbInsertContract, dbUpdateContractStatus, dbUpdateContractInvoice,
  dbInsertWalletTx, dbUpdateWalletBalance,
  dbInsertNotification, dbMarkNotificationRead, dbMarkAllNotificationsRead,
  dbInsertReview, dbDeleteReview,
  dbInsertCoupon, dbToggleCoupon, dbDeleteCoupon,
  dbInsertAuditLog, dbUpdateDefaultFeePercent, dbUpdatePaymentSettings,
  dbUpsertVipPlan, dbDeleteVipPlan, dbUpsertEstVipPlan, dbDeleteEstVipPlan,
} from '@/services/db';

export { useApp };

const ADMIN_ID = 'admin1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [adminTab, setAdminTab] = useState('overview');
  const [adminMode, setAdminMode] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbData = await loadAllData();
        if (!cancelled && dbData) {
          setDataState(dbData);
          console.log("✅ Estado carregado com sucesso das tabelas relacionais do Supabase!");
        }
      } catch (e) {
        console.warn("⚠️ Falha ao carregar do Supabase relacional, usando initialData:", e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (data?.paymentSettings) {
      setPaymentSettings(data.paymentSettings ?? { activeProvider: 'asaas', configs: {} });
    }
  }, [data?.paymentSettings]);

  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: AppData) => AppData)(prev) : updater;
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
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
    if (user.banned) return { ok: false, error: 'Esta conta foi banida. Contate o suporte.' };
    
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
    } as User;

    setData((d) => ({ ...d, users: [...d.users, newUser], currentUserId: id }));
    void dbInsertUser(newUser).catch((err) => console.error("❌ Erro ao inserir usuário no banco:", err));

    return { ok: true };
  }, [data, setData]);

  const logout = useCallback(() => {
    setData((d) => ({ ...d, currentUserId: null }));
  }, [setData]);

  // Função ATUALIZADA com trava de limites de anúncios
  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    if (patch.adImages && data) {
      const user = data.users.find(u => u.id === id);
      if (user && user.accountType === 'establishment') {
        const isOnTrial = user.trialEndsAt ? new Date(user.trialEndsAt) > new Date() : false;
        const currentTier = isOnTrial ? 'trial' : (user.estVipTier ?? 'free');
        const plan = data.estVipPlans.find(p => p.tier === currentTier);

        if (!plan?.allowAds) {
          console.warn("⚠️ O plano atual deste estabelecimento não permite anúncios.");
          return; 
        } 
        if (patch.adImages.length > (plan.maxAds ?? 0)) {
          console.warn(`⚠️ Limite de anúncios excedido. Máximo permitido: ${plan.maxAds}`);
          return; 
        }
      }
    }

    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    void dbUpdateUser(id, patch).catch(() => {});
  }, [setData, data]);

  const adminUpdateUser = useCallback((id: string, patch: Partial<User>) => {
    const stampedPatch = { ...patch, lastAdminEdit: new Date().toISOString() };
    const auditLog = { id: uid('al'), adminId: currentAdminId, action: `Admin alterou campos do usuário ${id}: ${Object.keys(patch).join(', ')}`, targetUserId: id, createdAt: new Date().toISOString() };
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

  // Funções ATUALIZADAS com trava de saldo insuficiente
  const setVipTier = useCallback((id: string, tier: Tier, period: Period = 'monthly'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find(u => u.id === id);
    const price = getPlan(tier, data.vipPlans).prices[period];

    if (tier !== 'free' && price > 0 && (user?.walletBalance ?? 0) < price) {
        return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }

    const expiry = tier === 'free' ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
    const newTxs: WalletTx[] = price > 0 ? [{ id: uid('wt'), userId: id, type: 'vip_charge', amount: -price, description: `Assinatura ${getPlan(tier, data.vipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
    
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, vipTier: tier, vipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
      walletTxs: [...newTxs, ...d.walletTxs]
    }));

    void dbUpdateUser(id, { vipTier: tier, vipExpiresAt: expiry }).catch(() => {});
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
    const newTxs: WalletTx[] = price > 0 ? [{ id: uid('wt'), userId: id, type: 'vip_charge_est', amount: -price, description: `Assinatura ${getEstPlan(tier, data.estVipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
    
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, estVipTier: tier, estVipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
      walletTxs: [...newTxs, ...d.walletTxs]
    }));

    void dbUpdateUser(id, { estVipTier: tier, estVipExpiresAt: expiry }).catch(() => {});
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

  // ... (o restante das funções permanece o mesmo até o fim do AppProvider) ...
  // (Note: Certifique-se de manter todo o resto do seu código original intacto abaixo desta parte)

// ... (Resto do arquivo, mantendo o que você já tinha)
