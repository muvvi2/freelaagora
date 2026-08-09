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

  const getRouteFromPath = (): Route => {
    const path = window.location.pathname;
    if (path === '/terms') return 'terms';
    if (path === '/freela') return 'vip_freela';
    if (path === '/estab') return 'vip_estab';
    if (path === '/vip') {
      return currentUser?.accountType === 'establishment' ? 'vip_estab' : 'vip_freela';
    }
    return 'app';
  };

  const [route, setRoute] = useState<Route>(getRouteFromPath);

  // Sincroniza a rota com o histórico do navegador e cliques em links
  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(getRouteFromPath());
    };

    // Intercepta pushState para atualizar o estado ao navegar via código/links
    const originalPushState = window.history.pushState;
    window.history.pushState = function (state, title, url) {
      originalPushState.apply(this, [state, title, url]);
      window.dispatchEvent(new Event('popstate'));
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, [currentUser]);

  if (route === 'terms') {
    return (
      <TermsPage
        onBack={() => {
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (currentUser) {
    if (route === 'vip_freela') {
      return (
        <VipPanel
          userId={currentUser.id}
          accountType="freelancer"
          onBack={() => {
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }
    if (route === 'vip_estab') {
      return (
        <VipPanel
          userId={currentUser.id}
          accountType="establishment"
          onBack={() => {
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }
  }

  if (!currentUser) {
    return (
      <LandingPage
        onNavigateTerms={() => {
          window.history.pushState({}, '', '/terms');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />
      <main className="pb-16">
        {isAdmin ? (
          adminMode ? (
            <AdminView />
          ) : currentUser.accountType === 'establishment' ? (
            <ContractorView />
          ) : (
            <FreelancerView />
          )
        ) : currentUser.accountType === 'establishment' ? (
          <ContractorView />
        ) : (
          <FreelancerView />
        )}
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
