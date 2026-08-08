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
          console.log("✅ Estado carregado com sucesso!");
        }
      } catch (e) {
        console.warn("⚠️ Falha ao carregar do Supabase:", e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (p: AppData) => AppData)(prev) : updater));
  }, []);

  const resetData = useCallback(() => setDataState(initialData), []);

  const currentUser = useMemo(() => data?.users.find((u) => u.id === data.currentUserId) ?? null, [data?.users, data?.currentUserId]);
  const isAdmin = !!currentUser?.isAdmin;
  const isSuperAdmin = !!currentUser?.isAdmin && currentUser?.adminRole === 'super';
  const currentAdminId = currentUser?.id ?? ADMIN_ID;

  const notify = useCallback((userId: string, type: AppNotification['type'], title: string, body: string, contractId?: string) => {
    const n: AppNotification = { id: uid('n'), userId, type, title, body, read: false, date: new Date().toISOString(), contractId };
    setData((d) => ({ ...d, notifications: [n, ...d.notifications] }));
    void dbInsertNotification(n).catch(() => {});
  }, [setData]);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    // TRAVA DE SEGURANÇA: Limite de Anúncios
    if (patch.adImages && data) {
      const user = data.users.find(u => u.id === id);
      if (user && user.accountType === 'establishment') {
        const isOnTrial = user.trialEndsAt ? new Date(user.trialEndsAt) > new Date() : false;
        const currentTier = isOnTrial ? 'trial' : (user.estVipTier ?? 'free');
        const plan = data.estVipPlans.find(p => p.tier === currentTier);

        if (!plan?.allowAds) {
          notify(id, 'error', 'Bloqueado', 'Seu plano atual não permite anúncios.');
          return; 
        } 
        if (patch.adImages.length > (plan.maxAds ?? 0)) {
          notify(id, 'error', 'Limite excedido', `Seu plano permite no máximo ${plan.maxAds} anúncios.`);
          return; 
        }
      }
    }

    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    void dbUpdateUser(id, patch).catch(() => {});
  }, [setData, data, notify]);

  // Funções de planos com TRAVA DE SALDO
  const setVipTier = useCallback((id: string, tier: Tier, period: Period = 'monthly'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Carregando.' };
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
    if (!data) return { ok: false, error: 'Carregando.' };
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

  // Mantendo todas as outras funções originais (login, register, logout, etc)...
  // (Nota: Como o código é longo, apenas garanta que as funções acima substituíram as antigas no seu arquivo)
  
  const value = useMemo<AppContextValue>(() => ({
    data, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    // ... incluir todas as outras funções que você já tinha no value
  }), [data, currentUser, isAdmin, isSuperAdmin]); // Mantenha as dependências completas

  if (!loaded || !data) return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">Carregando...</div>;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
