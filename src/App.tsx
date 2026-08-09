import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import { ToastProvider } from './components/ui/Toast';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ContractorView } from './components/ContractorView';
import { FreelancerView } from './components/FreelancerView';
import { AdminView } from './components/AdminView';
import { TermsPage } from './components/TermsPage';
import { VipPanel } from './components/VipPanel';

type Route = 'app' | 'terms' | 'vip_freela' | 'vip_estab';

function MainContent() {
  const { currentUser, isAdmin, adminMode } = useApp();
  const [route, setRoute] = useState<Route>(() => {
    const path = window.location.pathname;
    if (path === '/terms') return 'terms';
    if (path === '/freela') return 'vip_freela';
    if (path === '/estab') return 'vip_estab';
    if (path === '/vip') return currentUser?.accountType === 'establishment' ? 'vip_estab' : 'vip_freela';
    return 'app';
  });

  // Atualiza a rota se o usuário navegar via histórico ou URL direta
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/terms') setRoute('terms');
      else if (path === '/freela') setRoute('vip_freela');
      else if (path === '/estab') setRoute('vip_estab');
      else if (path === '/vip') setRoute(currentUser?.accountType === 'establishment' ? 'vip_estab' : 'vip_freela');
      else setRoute('app');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  if (route === 'terms') {
    return <TermsPage onBack={() => { window.history.pushState({}, '', '/'); setRoute('app'); }} />;
  }

  // Se o usuário estiver logado e acessou /freela ou /estab, exibe o VipPanel correspondente
  if (currentUser) {
    if (route === 'vip_freela') {
      return <VipPanel userId={currentUser.id} accountType="freelancer" onBack={() => { window.history.pushState({}, '', '/'); setRoute('app'); }} />;
    }
    if (route === 'vip_estab') {
      return <VipPanel userId={currentUser.id} accountType="establishment" onBack={() => { window.history.pushState({}, '', '/'); setRoute('app'); }} />;
    }
  }

  if (!currentUser) {
    return <LandingPage onNavigateTerms={() => { window.history.pushState({}, '', '/terms'); setRoute('terms'); }} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />
      <main className="pb-16">
        {isAdmin ? (adminMode ? <AdminView /> : currentUser.accountType === 'establishment' ? <ContractorView /> : <FreelancerView />) : currentUser.accountType === 'establishment' ? <ContractorView /> : <FreelancerView />}
      </main>
      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400 dark:border-neutral-800">
        FreelaAgora · Plataforma fintech de freelancers · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <MainContent />
      </ToastProvider>
    </AppProvider>
  );
}
