import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { AppContext, type AppContextValue, useApp } from './context';
import { initialData, CATEGORIES, metroNearby, emptyAvailability } from './mockData';
import { uid, getPlan, canSelectCategories, getEstPlan, getIntermediationFeePercent, calculateFees } from './utils';
import { setPaymentSettings } from '@/services/paymentService';
import { supabase } from '@/lib/supabase';
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
  dbInsertAdmin
} from '@/services/db';

export { useApp };

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const STORAGE_KEY = 'freelaagora_current_user';

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbData = await loadAllData();
        if (!cancelled && dbData) {
          setDataState((prev) => ({ ...dbData, currentUserId: prev.currentUserId ?? dbData.currentUserId }));
        }
      } catch (e) { console.warn("⚠️ Falha ao carregar do Supabase:", e); } finally { if (!cancelled) setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const currentUser = useMemo(() => data?.users.find((u) => u.id === data.currentUserId) ?? null, [data?.users, data?.currentUserId]);
  
  // 1. O Freelancer solicita o check-in (Chegada ao local)
  const requestCheckIn = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'check_in_pending', history: [...ct.history, { status: 'check_in_pending', at: new Date().toISOString(), note: 'Profissional registrou chegada, aguardando estabelecimento.' }] } : ct),
      notifications: [
        { id: crypto.randomUUID(), userId: c.establishmentId, type: 'announcement', title: 'Chegada do Profissional', body: `${c.freelancerName} fez o check-in e aguarda sua confirmação de presença.`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));
    void dbUpdateContractStatus(contractId, 'check_in_pending').catch(() => {});
  }, [data, setData]);

  // 2. O Estabelecimento confirma a presença (Check-in duplo concluído)
  const confirmCheckIn = useCallback((contractId: string) => {
    if (!data) return;
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) return;

    setData((d) => ({
      ...d,
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'checked_in', history: [...ct.history, { status: 'checked_in', at: new Date().toISOString(), note: 'Estabelecimento confirmou a presença.' }] } : ct),
      notifications: [
        { id: crypto.randomUUID(), userId: c.freelancerId, type: 'announcement', title: 'Check-in Confirmado!', body: `O estabelecimento ${c.establishmentName} confirmou sua presença. Bom trabalho!`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications
      ]
    }));
    void dbUpdateContractStatus(contractId, 'checked_in').catch(() => {});
  }, [data, setData]);

  // Pagamento descontando do saldo
  const payEscrow = useCallback((contractId: string, paymentMethod: 'wallet' | 'pix' | 'card' = 'wallet'): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const c = data.contracts.find((x) => x.id === contractId);
    const est = data.users.find(u => u.id === c?.establishmentId);
    if (!c || !est) return { ok: false, error: 'Contrato ou usuário não encontrado.' };

    if (paymentMethod === 'wallet' && (est.walletBalance ?? 0) < c.total) {
      return { ok: false, error: 'Saldo insuficiente na carteira.' };
    }

    const newBalance = paymentMethod === 'wallet' ? Math.max(0, est.walletBalance - c.total) : est.walletBalance;
    const invoiceId = c.coraInvoiceId ?? `inv-${crypto.randomUUID()}`;
    const estTx: WalletTx = { id: crypto.randomUUID(), userId: c.establishmentId, type: 'escrow_hold', amount: -c.total, description: `Escrow — ${c.freelancerName}`, contractId, date: new Date().toISOString() };

    setData((d) => ({
      ...d,
      users: d.users.map(u => u.id === c.establishmentId ? { ...u, walletBalance: newBalance } : u),
      contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, status: 'paid', coraInvoiceId: invoiceId, history: [...ct.history, { status: 'paid', at: new Date().toISOString() }] } : ct),
      walletTxs: [estTx, ...d.walletTxs]
    }));

    void dbUpdateContractStatus(contractId, 'paid').catch(() => {});
    void dbUpdateContractInvoice(contractId, invoiceId).catch(() => {});
    void dbInsertWalletTx(estTx).catch(() => {});
    if (paymentMethod === 'wallet') void dbUpdateWalletBalance(c.establishmentId, newBalance).catch(() => {});
    
    return { ok: true };
  }, [data, setData]);

  // ... (manter o restante das funções existentes)
  
  const value = useMemo<AppContextValue>(() => ({
    // ... (incluir as novas funções no value)
    requestCheckIn,
    confirmCheckIn,
    payEscrow,
    // ... restante
  }), [ /* dependências */ ]);

  // ... rest of provider return
}
