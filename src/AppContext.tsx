import { useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { AppContext, type AppContextValue, useApp } from './context';
import { initialData, CATEGORIES, metroNearby, emptyAvailability } from './mockData';
import { uid, getPlan, canSelectCategories, getEstPlan, getIntermediationFeePercent, calculateFees } from './utils';
import { supabase } from './lib/supabase';
import { setPaymentSettings } from '@/services/paymentService';
import type { AppData, User, Job, Contract, WalletTx, AppNotification, Review, Tier, Period, WeekAvailability, DateAvailability, ContractStatus, EstTier, TermsAcceptance, Coupon, VipPlan, EstVipPlan, PaymentSettings } from './types';

export { useApp };

const ADMIN_ID = 'admin1';
const STATE_ID = 'freelaagora';
const SESSION_KEY = 'freelaagora_current_user';

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adminTab, setAdminTab] = useState('overview');
  const [adminMode, setAdminMode] = useState(true);

  // Load state strictly from Supabase on mount, falling back to initialData only if empty/new
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from('app_state')
          .select('data')
          .eq('id', STATE_ID)
          .maybeSingle();
        
        if (error) throw error;
        
        if (!cancelled && row?.data && Object.keys(row.data).length > 0) {
          const loadedData = row.data as AppData;

          // 🛡️ Blindagem de Pagamentos: Se o banco veio sem paymentSettings configurado ou vazio, injeta o do initialData para não sumir com os meios de pagamento
          if (!loadedData.paymentSettings || !loadedData.paymentSettings.configs || Object.keys(loadedData.paymentSettings.configs).length === 0) {
            loadedData.paymentSettings = initialData.paymentSettings;
          }

          // Restaura o usuário logado da sessão atual (sessionStorage) se existir
          const savedUserId = sessionStorage.getItem(SESSION_KEY);
          if (savedUserId && loadedData.users.some(u => u.id === savedUserId)) {
            loadedData.currentUserId = savedUserId;
          } else {
            loadedData.currentUserId = null;
          }
          setDataState(loadedData);
          console.log("✅ Estado carregado com sucesso do Supabase!");
        } else {
          // Se a tabela estiver vazia, inicializa com o initialData e já salva no banco
          setDataState({ ...initialData, currentUserId: null });
          await supabase.from('app_state').upsert({ id: STATE_ID, data: initialData as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
          console.log("📌 Tabela vazia. Inicializado com dados padrão.");
        }
      } catch (e) {
        console.warn("⚠️ Falha ao carregar do Supabase, usando fallback local:", e);
        setDataState({ ...initialData, currentUserId: null });
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

  // Persist to Supabase whenever data changes with clear console feedback
  const persist = useCallback(async (next: AppData) => {
    try {
      // Remove o currentUserId do objeto salvo no banco global para evitar que o login de uma aba contamine a outra
      const { currentUserId, ...dataToPersist } = next;
      const { error } = await supabase
        .from('app_state')
        .upsert({ id: STATE_ID, data: dataToPersist as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
      
      if (error) {
        console.error("❌ Erro ao salvar no Supabase (app_state):", error.message, error.details);
      } else {
        console.log("💾 Estado salvo com sucesso no Supabase!");
      }
    } catch (e) {
      console.error("❌ Exceção na rede/código ao persistir:", e);
    }
  }, []);

  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? (updater as (p: AppData) => AppData)(prev) : updater;
      void persist(next);
      return next;
    });
  }, [persist]);

  const resetData = useCallback(() => {
    setDataState({ ...initialData, currentUserId: null });
    sessionStorage.removeItem(SESSION_KEY);
    void persist({ ...initialData, currentUserId: null });
  }, [persist]);

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
    
    // Salva estritamente na sessão da aba atual
    sessionStorage.setItem(SESSION_KEY, user.id);
    setData((d) => ({ ...d, currentUserId: user.id }));
    return { ok: true };
  }, [data?.users, setData]);

  const register = useCallback((user: Omit<User, 'id' | 'createdAt' | 'walletBalance' | 'rating' | 'reviewsCount' | 'completedShifts'> & Partial<User>): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema ainda carregando.' };
    if (data.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase().trim())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const id = uid(user.accountType === 'freelancer' ? 'fl' : 'es');
    const newUser: User = {
      ...user, id, email: user.email.toLowerCase().trim(), createdAt: new Date().toISOString(),
      walletBalance: 0, rating: user.accountType === 'freelancer' ? 5 : 0, reviewsCount: 0, completedShifts: 0,
      vipTier: user.accountType === 'freelancer' ? 'free' : undefined,
      estVipTier: user.accountType === 'establishment' ? 'trial' : undefined,
      trialEndsAt: user.accountType === 'establishment' ? new Date(Date.now() + 15 * 86400000).toISOString() : undefined,
      categories: user.accountType === 'freelancer' ? (user.categories ?? []) : undefined,
      availability: user.accountType === 'freelancer' ? (user.availability ?? emptyAvailability()) : undefined,
    } as User;
    
    sessionStorage.setItem(SESSION_KEY, id);
    setData((d) => ({ ...d, users: [...d.users, newUser], currentUserId: id }));
    return { ok: true };
  }, [data?.users, setData]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setData((d) => ({ ...d, currentUserId: null }));
  }, [setData]);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  }, [setData]);

  const adminUpdateUser = useCallback((id: string, patch: Partial<User>) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch, lastAdminEdit: new Date().toISOString() } : u)), adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin alterou campos do usuário ${id}: ${Object.keys(patch).join(', ')}`, targetUserId: id, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const deleteEntity = useCallback((id: string) => setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) })), [setData]);
  const banUser = useCallback((id: string) => setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, banned: true } : u)) })), [setData]);
  const unbanUser = useCallback((id: string) => setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, banned: false } : u)) })), [setData]);

  const setVipTier = useCallback((id: string, tier: Tier, period: Period = 'monthly') => {
    setData((d) => {
      const price = getPlan(tier, d.vipPlans).prices[period];
      const expiry = tier === 'free' ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
      const newTxs: WalletTx[] = price > 0 ? [{ id: uid('wt'), userId: id, type: 'vip_charge', amount: -price, description: `Assinatura ${getPlan(tier, d.vipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
      return {
        ...d,
        users: d.users.map((u) => (u.id === id ? { ...u, vipTier: tier, vipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
        walletTxs: [...newTxs, ...d.walletTxs]
      };
    });
  }, [setData]);

  const setEstVipTier = useCallback((id: string, tier: EstTier, period: Period = 'monthly') => {
    setData((d) => {
      const price = getEstPlan(tier, d.estVipPlans).prices[period];
      const expiry = (tier === 'free' || tier === 'trial') ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString();
      const newTxs: WalletTx[] = price > 0 ? [{ id: uid('wt'), userId: id, type: 'vip_charge_est', amount: -price, description: `Assinatura ${getEstPlan(tier, d.estVipPlans).label} (${period})`, date: new Date().toISOString() }] : [];
      return {
        ...d,
        users: d.users.map((u) => (u.id === id ? { ...u, estVipTier: tier, estVipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - price) } : u)),
        walletTxs: [...newTxs, ...d.walletTxs]
      };
    });
  }, [setData]);

  const setTermsAcceptance = useCallback((id: string, acceptance: TermsAcceptance) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, termsAcceptance: acceptance } : u)) }));
  }, [setData]);

  const setAvailability = useCallback((userId: string, av: WeekAvailability) => updateUser(userId, { availability: av }), [updateUser]);
  const toggleAvailabilitySlot = useCallback((userId: string, day: keyof WeekAvailability, shift: 'manha' | 'tarde' | 'noite') => {
    setData((d) => ({ ...d, users: d.users.map((u) => { if (u.id !== userId) return u; const av = u.availability ?? emptyAvailability(); return { ...u, availability: { ...av, [day]: { ...av[day], [shift]: !av[day][shift] } } }; }) }));
  }, [setData]);

  const toggleDateShift = useCallback((userId: string, dateKey: string, shift: 'manha' | 'tarde' | 'noite') => {
    setData((d) => ({ ...d, users: d.users.map((u) => {
      if (u.id !== userId) return u;
      const da = { ...(u.dateAvailability ?? {}) } as DateAvailability;
      const day = { ...(da[dateKey] ?? { manha: false, tarde: false, noite: false }) };
      day[shift] = !day[shift];
      if (!day.manha && !day.tarde && !day.noite) { delete da[dateKey]; }
      else { da[dateKey] = day; }
      return { ...u, dateAvailability: da };
    }) }));
  }, [setData]);

  const toggleCategory = useCallback((userId: string, categoryId: string): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    const user = data.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: 'Usuário não encontrado.' };
    const current = user.categories ?? [];
    const tier = user.vipTier ?? 'free';
    if (current.includes(categoryId)) { updateUser(userId, { categories: current.filter((c) => c !== categoryId) }); return { ok: true }; }
    if (!canSelectCategories(tier, current.length, data.vipPlans)) { const plan = getPlan(tier, data.vipPlans); return { ok: false, error: `Seu plano ${plan.label} permite até ${plan.maxCategories} categorias. Faça upgrade para VIP!` }; }
    updateUser(userId, { categories: [...current, categoryId] });
    return { ok: true };
  }, [data, updateUser]);

  const addJob = useCallback((j: Job): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    
    const est = data.users.find((u) => u.id === j.establishmentId);
    if (!est) return { ok: false, error: 'Estabelecimento não encontrado.' };

    const isOnTrial = est.trialEndsAt ? new Date(est.trialEndsAt) > new Date() : false;
    const currentTier = isOnTrial ? 'trial' : (est.estVipTier ?? 'free');

    // Busca o limite de vagas diretamente do plano cadastrado no Admin (estVipPlans)
    const matchedPlan = data.estVipPlans?.find((p) => p.tier === currentTier);
    const effectiveMaxJobs = matchedPlan?.maxActiveJobs ?? (currentTier === 'trial' ? 10 : currentTier === 'free' ? 2 : 20);

    // Janela semanal: últimos 7 dias a partir de agora
    const oneWeekAgo = Date.now() - 7 * 86400000;

    // Conta TODAS as vagas criadas nos últimos 7 dias (mesmo preenchidas ou fechadas)
    const jobsThisWeekCount = data.jobs.filter((job) => {
      if (job.establishmentId !== est.id) return false;
      const jobDate = new Date(job.createdAt).getTime();
      return jobDate >= oneWeekAgo;
    }).length;

    console.log(`🔒 [TRAVA SEMANAL] Estabelecimento: ${est.name} | Tier: ${currentTier} | Em Trial: ${isOnTrial} | Publicadas nos últimos 7 dias: ${jobsThisWeekCount} | Limite Semanal: ${effectiveMaxJobs}`);

    if (jobsThisWeekCount >= effectiveMaxJobs) {
      return { 
        ok: false, 
        error: `Limite semanal atingido! Seu plano (${currentTier === 'trial' ? 'TESTE GRATUITO' : currentTier.toUpperCase()}) permite publicar no máximo ${effectiveMaxJobs} vagas por semana. Vagas preenchidas ou fechadas continuam contando para o ciclo semanal.` 
      };
    }

    setData((d) => ({ ...d, jobs: [j, ...d.jobs] }));
    return { ok: true };
  }, [data, setData]);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })), [setData]);
  const deleteJob = useCallback((id: string) => setData((d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== id) })), [setData]);
  const pauseJob = useCallback((id: string) => setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === id ? { ...j, status: j.status === 'paused' ? 'active' : 'paused' } : j)) })), [setData]);
  const applyToJob = useCallback((jobId: string, freelancerId: string) => setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === jobId && !j.applicants.includes(freelancerId) ? { ...j, applicants: [...j.applicants, freelancerId] } : j)) })), [setData]);

  const notify = useCallback((userId: string, type: AppNotification['type'], title: string, body: string, contractId?: string) => {
    setData((d) => ({ ...d, notifications: [{ id: uid('n'), userId, type, title, body, read: false, date: new Date().toISOString(), contractId }, ...d.notifications] }));
  }, [setData]);
  const markNotificationRead = useCallback((id: string) => setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })), [setData]);
  const markAllNotificationsRead = useCallback((userId: string) => setData((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) })), [setData]);
  const userNotifications = useCallback((userId: string) => data?.notifications.filter((n) => n.userId === userId) ?? [], [data?.notifications]);

  const userWalletBalance = useCallback((userId: string) => data?.users.find((u) => u.id === userId)?.walletBalance ?? 0, [data?.users]);
  const userWalletTxs = useCallback((userId: string) => data?.walletTxs.filter((t) => t.userId === userId) ?? [], [data?.walletTxs]);
  const adminWalletTxs = useCallback(() => data?.walletTxs.filter((t) => t.userId === ADMIN_ID) ?? [], [data?.walletTxs]);
  const depositToWallet = useCallback((userId: string, amount: number, description?: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: (u.walletBalance ?? 0) + amount } : u)), walletTxs: [{ id: uid('wt'), userId, type: 'deposit', amount, description: description ?? 'Depósito na carteira digital', date: new Date().toISOString() }, ...d.walletTxs] }));
  }, [setData]);
  const withdrawFromWallet = useCallback((userId: string, amount: number, description?: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, (u.walletBalance ?? 0) - amount) } : u)), walletTxs: [{ id: uid('wt'), userId, type: 'withdraw', amount: -amount, description: description ?? 'Saque da carteira digital', date: new Date().toISOString() }, ...d.walletTxs] }));
  }, [setData]);

  const requestHire = useCallback((establishmentId: string, freelancerId: string, jobId: string | null, hours: number, freelancerFee: number): Contract => {
    const est = data?.users.find((u) => u.id === establishmentId);
    const fl = data?.users.find((u) => u.id === freelancerId);
    const feePercent = est ? getIntermediationFeePercent(est, data.estVipPlans) : data?.config.defaultFeePercent ?? 15;
    const { fee, total } = calculateFees(freelancerFee, feePercent);
    const contract: Contract = {
      id: uid('ct'), jobId, establishmentId, establishmentName: est?.name ?? '',
      freelancerId, freelancerName: fl?.name ?? '', freelancerPhoto: fl?.photo ?? '',
      freelancerPhone: fl?.phone ?? '', freelancerWhatsapp: fl?.whatsapp ?? '',
      category: fl?.categories?.[0] ?? 'geral', date: new Date().toISOString(), hours,
      freelancerFee, platformFeePercentage: feePercent, platformFee: fee, total,
      status: 'requested', createdAt: new Date().toISOString(), history: [{ status: 'requested', at: new Date().toISOString() }],
    };
    setData((d) => ({ ...d, contracts: [contract, ...d.contracts], notifications: [
      { id: uid('n'), userId: freelancerId, type: 'hire_request', title: 'Nova solicitação de contratação', body: `${est?.name} quer te contratar. Confirme sua disponibilidade.`, read: false, date: new Date().toISOString(), contractId: contract.id },
      { id: uid('n'), userId: ADMIN_ID, type: 'hire_request', title: 'Nova solicitação de contratação', body: `${est?.name} solicitou ${fl?.name}.`, read: false, date: new Date().toISOString(), contractId: contract.id },
      ...d.notifications,
    ] }));
    return contract;
  }, [data?.users, data?.estVipPlans, data?.config?.defaultFeePercent, setData]);

  const pushHistory = (d: AppData, contractId: string, status: ContractStatus, note?: string): AppData => ({ ...d, contracts: d.contracts.map((c) => c.id === contractId ? { ...c, status, history: [...c.history, { status, at: new Date().toISOString(), note }] } : c) });

  const confirmAvailability = useCallback((contractId: string) => {
    setData((d) => { const c = d.contracts.find((x) => x.id === contractId); if (!c) return d; const next = pushHistory(d, contractId, 'confirmed'); return { ...next, notifications: [{ id: uid('n'), userId: c.establishmentId, type: 'contract_update', title: 'Freelancer confirmou disponibilidade', body: `${c.freelancerName} confirmou. Realize o pagamento para liberar o contato.`, read: false, date: new Date().toISOString(), contractId }, ...d.notifications] }; });
  }, [setData]);

  const payEscrow = useCallback((contractId: string) => {
    setData((d) => {
      const c = d.contracts.find((x) => x.id === contractId); if (!c) return d;
      const estTx: WalletTx = { id: uid('wt'), userId: c.establishmentId, type: 'escrow_hold', amount: -c.total, description: `Pagamento em garantia (Cora) — ${c.freelancerName}`, contractId, date: new Date().toISOString() };
      const next = pushHistory({ ...d, contracts: d.contracts.map((ct) => ct.id === contractId ? { ...ct, coraInvoiceId: ct.coraInvoiceId ?? `cora-${uid('inv')}` } : ct) }, contractId, 'paid');
      return { ...next, walletTxs: [estTx, ...d.walletTxs], notifications: [
        { id: uid('n'), userId: c.freelancerId, type: 'payment', title: 'Pagamento em garantia recebido', body: `${c.establishmentName} pagou ${formatBRL(c.total)} via Cora. O valor está retido em garantia.`, read: false, date: new Date().toISOString(), contractId },
        { id: uid('n'), userId: c.establishmentId, type: 'contract_update', title: 'Contato do freelancer liberado', body: `O WhatsApp de ${c.freelancerName} foi desbloqueado.`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications,
      ] };
    });
  }, [setData]);

  const checkInFreelancer = useCallback((contractId: string) => {
    setData((d) => { const c = d.contracts.find((x) => x.id === contractId); if (!c) return d; const next = pushHistory(d, contractId, 'checked_in', 'Check-in geolocalizado'); return { ...next, notifications: [{ id: uid('n'), userId: c.establishmentId, type: 'contract_update', title: 'Freelancer chegou ao local', body: `${c.freelancerName} realizou o check-in geolocalizado.`, read: false, date: new Date().toISOString(), contractId }, ...d.notifications] }; });
  }, [setData]);

  const finishService = useCallback((contractId: string) => {
    setData((d) => {
      const c = d.contracts.find((x) => x.id === contractId); if (!c) return d;
      const flRelease: WalletTx = { id: uid('wt'), userId: c.freelancerId, type: 'escrow_release', amount: c.freelancerFee, description: `Repasse do turno — ${c.establishmentName}`, contractId, date: new Date().toISOString() };
      const adminFee: WalletTx = { id: uid('wt'), userId: ADMIN_ID, type: 'platform_fee', amount: c.platformFee, description: `Taxa de intermediação (${c.platformFeePercentage}%) — contrato ${c.id}`, contractId, date: new Date().toISOString() };
      const next = pushHistory(d, contractId, 'completed', 'Split payment realizado');
      return { ...next, walletTxs: [flRelease, adminFee, ...d.walletTxs], users: d.users.map((u) => {
        if (u.id === c.freelancerId) return { ...u, walletBalance: (u.walletBalance ?? 0) + c.freelancerFee, completedShifts: (u.completedShifts ?? 0) + 1 };
        if (u.id === ADMIN_ID) return { ...u, walletBalance: (u.walletBalance ?? 0) + c.platformFee };
        return u;
      }), notifications: [
        { id: uid('n'), userId: c.freelancerId, type: 'payment', title: 'Repasse realizado', body: `${formatBRL(c.freelancerFee)} liberado para sua carteira. Avalie o estabelecimento!`, read: false, date: new Date().toISOString(), contractId },
        { id: uid('n'), userId: c.establishmentId, type: 'review', title: 'Serviço concluído', body: `${c.freelancerName} finalizou o serviço. Avalie o profissional!`, read: false, date: new Date().toISOString(), contractId },
        { id: uid('n'), userId: ADMIN_ID, type: 'payment', title: 'Taxa arrecadada', body: `${formatBRL(c.platformFee)} creditada da intermediação (${c.platformFeePercentage}%).`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications,
      ] };
    });
  }, [setData]);

  const cancelContract = useCallback((contractId: string) => {
    setData((d) => {
      const c = d.contracts.find((x) => x.id === contractId); if (!c) return d;
      let extraTxs: WalletTx[] = []; let users = d.users;
      if (c.status === 'paid' || c.status === 'checked_in') {
        extraTxs = [{ id: uid('wt'), userId: c.establishmentId, type: 'deposit', amount: c.total, description: `Estorno — contrato cancelado ${c.id}`, contractId, date: new Date().toISOString() }];
        users = users.map((u) => u.id === c.establishmentId ? { ...u, walletBalance: (u.walletBalance ?? 0) + c.total } : u);
      }
      const next = pushHistory(d, contractId, 'cancelled');
      return { ...next, walletTxs: [...extraTxs, ...d.walletTxs], users, notifications: [
        { id: uid('n'), userId: c.freelancerId, type: 'contract_update', title: 'Contrato cancelado', body: `O contrato com ${c.establishmentName} foi cancelado.`, read: false, date: new Date().toISOString(), contractId },
        { id: uid('n'), userId: c.establishmentId, type: 'contract_update', title: 'Contrato cancelado', body: `O contrato com ${c.freelancerName} foi cancelado. Valor estornado.`, read: false, date: new Date().toISOString(), contractId },
        ...d.notifications,
      ] };
    });
  }, [setData]);

  const submitReview = useCallback((contractId: string, fromId: string, fromName: string, toId: string, rating: number, comment: string) => {
    setData((d) => {
      const review: Review = { id: uid('rv'), fromId, fromName, toId, rating, comment, date: new Date().toISOString() };
      const contracts = d.contracts.map((c) => { if (c.id !== contractId) return c; const isFromEst = fromId === c.establishmentId; return isFromEst ? { ...c, reviewFromEstablishment: review } : { ...c, reviewFromFreelancer: review }; });
      const users = d.users.map((u) => { if (u.id !== toId) return u; const newCount = (u.reviewsCount ?? 0) + 1; const oldSum = (u.rating ?? 0) * (u.reviewsCount ?? 0); return { ...u, reviewsCount: newCount, rating: Math.round(((oldSum + rating) / newCount) * 10) / 10 }; });
      return { ...d, contracts, users, reviews: [review, ...d.reviews], notifications: [{ id: uid('n'), userId: toId, type: 'review', title: 'Nova avaliação recebida', body: `${fromName} te avaliou com ${rating} estrelas.`, read: false, date: new Date().toISOString() }, ...d.notifications] };
    });
  }, [setData]);

  const reviewsFor = useCallback((userId: string) => data?.reviews.filter((r) => r.toId === userId) ?? [], [data?.reviews]);
  const setDefaultFeePercent = useCallback((n: number) => setData((d) => ({ ...d, config: { ...d.config, defaultFeePercent: n } })), [setData]);
  const updatePaymentSettings = useCallback((settings: PaymentSettings) => setData((d) => ({ ...d, paymentSettings: settings })), [setData]);
  const overrideContractStatus = useCallback((contractId: string, status: ContractStatus) => setData((d) => pushHistory(d, contractId, status, 'Override administrativo')), [setData]);

  const forceRefund = useCallback((contractId: string) => {
    setData((d) => {
      const c = d.contracts.find((x) => x.id === contractId); if (!c) return d;
      const refundTx: WalletTx = { id: uid('wt'), userId: c.establishmentId, type: 'deposit', amount: c.total, description: `Estorno forçado pelo SuperAdmin — contrato ${c.id}`, contractId, date: new Date().toISOString() };
      const next = pushHistory(d, contractId, 'cancelled', 'Estorno de custódia forçado pelo SuperAdmin');
      return { ...next, walletTxs: [refundTx, ...d.walletTxs], users: d.users.map((u) => u.id === c.establishmentId ? { ...u, walletBalance: (u.walletBalance ?? 0) + c.total } : u), adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `SuperAdmin forçou estorno de custódia no contrato ${contractId} (R$ ${c.total})`, targetUserId: c.establishmentId, createdAt: new Date().toISOString() }, ...d.adminAuditLogs], notifications: [{ id: uid('n'), userId: c.establishmentId, type: 'contract_update', title: 'Estorno processado', body: `O estorno de ${formatBRL(c.total)} foi processado pelo administrador.`, read: false, date: new Date().toISOString(), contractId }, ...d.notifications] };
    });
  }, [setData, currentAdminId]);

  // Coupons with 1 use per user enforcement
  const coupons = useMemo(() => data?.coupons ?? [], [data?.coupons]);
  
  const validateCoupon = useCallback((code: string, userId?: string): { coupon?: Coupon; error?: string } => {
    if (!data) return { error: 'Sistema carregando.' };
    const c = data.coupons.find((cp) => cp.code.toUpperCase() === code.toUpperCase().trim() && cp.isActive);
    if (!c) return { error: 'Cupom inválido ou desativado.' };
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { error: 'Este cupom já expirou.' };
    if (userId && c.usedBy && c.usedBy.includes(userId)) {
      return { error: 'Você já utilizou este cupom anteriormente.' };
    }
    return { coupon: c };
  }, [data]);

  const addCoupon = useCallback((coupon: Omit<Coupon, 'id' | 'createdAt'>) => {
    setData((d) => ({ ...d, coupons: [{ ...coupon, id: uid('cp'), usedBy: [], createdAt: new Date().toISOString() }, ...d.coupons], adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin criou cupom ${coupon.code} (${coupon.discountPercentage}%)`, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const toggleCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c), adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin alternou status do cupom ${id}`, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const deleteCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id), adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin removeu cupom ${id}`, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const applyCouponToPurchase = useCallback((userId: string, tier: Tier | EstTier, period: Period, coupon: Coupon, accountType: 'freelancer' | 'establishment'): { ok: boolean; discountedPrice: number; error?: string } => {
    if (!data) return { ok: false, discountedPrice: 0, error: 'Sistema carregando.' };
    if (coupon.usedBy?.includes(userId)) {
      return { ok: false, discountedPrice: 0, error: 'Você já utilizou este cupom.' };
    }
    const plan = accountType === 'freelancer' ? getPlan(tier as Tier, data.vipPlans) : getEstPlan(tier as EstTier, data.estVipPlans);
    const fullPrice = plan.prices[period];
    const discounted = Math.round(fullPrice * (1 - coupon.discountPercentage / 100) * 100) / 100;
    
    setData((d) => ({
      ...d,
      coupons: d.coupons.map((c) => c.id === coupon.id ? { ...c, usedBy: [...(c.usedBy || []), userId] } : c),
      users: d.users.map((u) => {
        if (u.id !== userId) return u;
        if (accountType === 'freelancer') { const expiry = tier === 'free' ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString(); return { ...u, vipTier: tier as Tier, vipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - discounted) }; }
        const expiry = (tier === 'free' || tier === 'trial') ? undefined : new Date(Date.now() + (period === 'annual' ? 365 : period === 'semestral' ? 180 : 30) * 86400000).toISOString(); return { ...u, estVipTier: tier as EstTier, estVipExpiresAt: expiry, walletBalance: Math.max(0, (u.walletBalance ?? 0) - discounted) };
      }),
      walletTxs: [
        { id: uid('wt'), userId, type: 'vip_charge', amount: -discounted, description: `Assinatura ${plan.label} (${period}) com cupom ${coupon.code}`, date: new Date().toISOString() },
        { id: uid('wt'), userId, type: 'coupon_discount', amount: -(fullPrice - discounted), description: `Desconto do cupom ${coupon.code} (${coupon.discountPercentage}%)`, date: new Date().toISOString() },
        ...d.walletTxs,
      ]
    }));
    return { ok: true, discountedPrice: discounted };
  }, [data, setData]);

  // Audit logs
  const auditLogs = useMemo(() => data?.adminAuditLogs ?? [], [data?.adminAuditLogs]);
  const logAdminAction = useCallback((action: string, targetUserId?: string) => {
    setData((d) => ({ ...d, adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action, targetUserId, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const adminCreateUser = useCallback((user: Omit<User, 'id' | 'createdAt' | 'walletBalance' | 'rating' | 'reviewsCount' | 'completedShifts'> & Partial<User>): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    if (data.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase().trim())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const id = uid(user.accountType === 'freelancer' ? 'fl' : 'es');
    const newUser: User = {
      ...user, id, email: user.email.toLowerCase().trim(), createdAt: new Date().toISOString(),
      walletBalance: 0, rating: user.accountType === 'freelancer' ? 5 : 0, reviewsCount: 0, completedShifts: 0,
      vipTier: user.accountType === 'freelancer' ? (user.vipTier ?? 'free') : undefined,
      estVipTier: user.accountType === 'establishment' ? (user.estVipTier ?? 'free') : undefined,
      categories: user.accountType === 'freelancer' ? (user.categories ?? []) : undefined,
      availability: user.accountType === 'freelancer' ? (user.availability ?? emptyAvailability()) : undefined,
    } as User;
    setData((d) => ({ ...d, users: [...d.users, newUser], adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin criou usuário ${newUser.name} (${newUser.email})`, targetUserId: id, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
    return { ok: true };
  }, [data, setData, currentAdminId]);

  const adminCreateAdmin = useCallback((user: { name: string; email: string; password: string; adminRole: 'super' | 'regular'; photo?: string }): { ok: boolean; error?: string } => {
    if (!data) return { ok: false, error: 'Sistema carregando.' };
    if (data.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase().trim())) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' };
    }
    const id = uid('adm');
    const newUser: User = {
      ...user, id, accountType: 'freelancer', isAdmin: true, adminRole: user.adminRole,
      email: user.email.toLowerCase().trim(), createdAt: new Date().toISOString(),
      walletBalance: 0, rating: 0, reviewsCount: 0, completedShifts: 0,
      photo: user.photo ?? 'https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      phone: '', whatsapp: '', address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', lat: 0, lng: 0 },
    } as User;
    setData((d) => ({ ...d, users: [...d.users, newUser], adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `SuperAdmin criou ${user.adminRole === 'super' ? 'SuperAdmin' : 'Admin'} ${newUser.name} (${newUser.email})`, targetUserId: id, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
    return { ok: true };
  }, [data, setData, currentAdminId]);

  const removeAdmin = useCallback((id: string) => {
    setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id), adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `SuperAdmin removeu administrador ${id}`, targetUserId: id, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const adjustWallet = useCallback((userId: string, amount: number, description: string) => {
    setData((d) => ({ ...d, users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, (u.walletBalance ?? 0) + amount) } : u)), walletTxs: [{ id: uid('wt'), userId, type: amount >= 0 ? 'deposit' : 'withdraw', amount, description: `[SuperAdmin] ${description}`, date: new Date().toISOString() }, ...d.walletTxs], adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `SuperAdmin ajustou carteira de ${userId} em ${amount >= 0 ? '+' : ''}${amount} (${description})`, targetUserId: userId, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] }));
  }, [setData, currentAdminId]);

  const deleteReview = useCallback((reviewId: string) => {
    setData((d) => {
      const review = d.reviews.find((r) => r.id === reviewId);
      if (!review) return d;
      const target = d.users.find((u) => u.id === review.toId);
      let users = d.users;
      if (target && (target.reviewsCount ?? 0) > 0) {
        const oldCount = target.reviewsCount ?? 0;
        const oldSum = (target.rating ?? 0) * oldCount;
        const newCount = oldCount - 1;
        const newRating = newCount > 0 ? Math.round(((oldSum - review.rating) / newCount) * 10) / 10 : 0;
        users = users.map((u) => u.id === target.id ? { ...u, reviewsCount: newCount, rating: newRating } : u);
      }
      return { ...d, users, reviews: d.reviews.filter((r) => r.id !== reviewId), contracts: d.contracts.map((c) => (c.reviewFromEstablishment?.id === reviewId ? { ...c, reviewFromEstablishment: undefined } : c.reviewFromFreelancer?.id === reviewId ? { ...c, reviewFromFreelancer: undefined } : c)), adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin removeu avaliação ${reviewId}`, targetUserId: review.toId, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] };
    });
  }, [setData]);

  const broadcastNotification = useCallback((title: string, body: string) => {
    setData((d) => {
      const notifs: AppNotification[] = d.users.filter((u) => !u.isAdmin).map((u) => ({ id: uid('n'), userId: u.id, type: 'system' as const, title, body, read: false, date: new Date().toISOString() }));
      return { ...d, notifications: [...notifs, ...d.notifications], adminAuditLogs: [{ id: uid('al'), adminId: currentAdminId, action: `Admin enviou comunicado: "${title}"`, createdAt: new Date().toISOString() }, ...d.adminAuditLogs] };
    });
  }, [setData, currentAdminId]);

  const updateVipPlan = useCallback((tier: Tier, patch: Partial<VipPlan>) => {
    setData((d) => ({ ...d, vipPlans: d.vipPlans.map((p) => p.tier === tier ? { ...p, ...patch } : p) }));
  }, [setData]);
  const addVipPlan = useCallback((plan: VipPlan) => {
    setData((d) => d.vipPlans.some((p) => p.tier === plan.tier) ? d : { ...d, vipPlans: [...d.vipPlans, plan] });
  }, [setData]);
  const removeVipPlan = useCallback((tier: Tier) => {
    setData((d) => ({ ...d, vipPlans: d.vipPlans.filter((p) => p.tier !== tier), users: d.users.map((u) => u.vipTier === tier ? { ...u, vipTier: 'free' } : u) }));
  }, [setData]);
  const updateEstVipPlan = useCallback((tier: EstTier, patch: Partial<EstVipPlan>) => {
    setData((d) => ({ ...d, estVipPlans: d.estVipPlans.map((p) => p.tier === tier ? { ...p, ...patch } : p) }));
  }, [setData]);
  const addEstVipPlan = useCallback((plan: EstVipPlan) => {
    setData((d) => d.estVipPlans.some((p) => p.tier === plan.tier) ? d : { ...d, estVipPlans: [...d.estVipPlans, plan] });
  }, [setData]);
  const removeEstVipPlan = useCallback((tier: EstTier) => {
    setData((d) => ({ ...d, estVipPlans: d.estVipPlans.filter((p) => p.tier !== tier), users: d.users.map((u) => u.estVipTier === tier ? { ...u, estVipTier: 'free' } : u) }));
  }, [setData]);

  const enterAdminMode = useCallback(() => setAdminMode(true), []);
  const exitAdminMode = useCallback(() => { setAdminMode(false); setAdminTab('overview'); }, []);

  const freelancers = useMemo(() => data?.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin) ?? [], [data?.users]);
  const establishments = useMemo(() => data?.users.filter((u) => u.accountType === 'establishment') ?? [], [data?.users]);
  const nearbyFreelancers = useCallback((city: string) => {
    if (!data) return [];
    const nearby = metroNearby(city);
    return data.users.filter((u) => u.accountType === 'freelancer' && !u.isAdmin && !u.banned && nearby.includes(u.address.city));
  }, [data?.users]);
  const categoryById = useCallback((id: string) => CATEGORIES.find((c) => c.id === id), []);

  const value = useMemo<AppContextValue>(() => ({
    data: data!, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    setAvailability, toggleAvailabilitySlot, toggleDateShift, toggleCategory,
    addJob, updateJob, deleteJob, pauseJob, applyToJob,
    requestHire, confirmAvailability, payEscrow, checkInFreelancer, finishService, cancelContract,
    submitReview, notify, markNotificationRead, markAllNotificationsRead, userNotifications,
    userWalletBalance, userWalletTxs, adminWalletTxs, depositToWallet, withdrawFromWallet,
    reviewsFor, setDefaultFeePercent, updatePaymentSettings, overrideContractStatus, forceRefund, resetData,
    freelancers, establishments, nearbyFreelancers, categoryById,
    adminTab, setAdminTab, adminMode, exitAdminMode, enterAdminMode,
    coupons, validateCoupon, addCoupon, toggleCoupon, deleteCoupon, applyCouponToPurchase,
    auditLogs, logAdminAction, adminCreateUser, adminCreateAdmin, removeAdmin, adjustWallet, deleteReview, broadcastNotification,
    updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan,
  }), [
    data, currentUser, isAdmin, isSuperAdmin, login, register, logout, updateUser, adminUpdateUser, deleteEntity, banUser, unbanUser, setVipTier, setEstVipTier, setTermsAcceptance,
    setAvailability, toggleAvailabilitySlot, toggleDateShift, toggleCategory, addJob, updateJob, deleteJob, pauseJob, applyToJob,
    requestHire, confirmAvailability, payEscrow, checkInFreelancer, finishService, cancelContract,
    submitReview, notify, markNotificationRead, markAllNotificationsRead, userNotifications,
    userWalletBalance, userWalletTxs, adminWalletTxs, depositToWallet, withdrawFromWallet,
    reviewsFor, setDefaultFeePercent, updatePaymentSettings, overrideContractStatus, forceRefund, resetData, freelancers, establishments, nearbyFreelancers, categoryById,
    adminTab, setAdminTab, adminMode, exitAdminMode, enterAdminMode,
    coupons, validateCoupon, addCoupon, toggleCoupon, deleteCoupon, applyCouponToPurchase,
    auditLogs, logAdminAction, adminCreateUser, adminCreateAdmin, removeAdmin, adjustWallet, deleteReview, broadcastNotification,
    updateVipPlan, addVipPlan, removeVipPlan, updateEstVipPlan, addEstVipPlan, removeEstVipPlan,
  ]);

  if (!loaded || !data) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white"><div className="animate-pulse text-sm">Carregando FreelaAgora…</div></div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function formatBRL(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
