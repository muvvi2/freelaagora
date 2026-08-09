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

type Route = 'app' | 'terms' | 'vip' | 'estab_home' | 'freela_home';

function MainContent() {
  const { currentUser, isAdmin, adminMode } = useApp();

  const getRouteFromPath = (): Route => {
    const path = window.location.pathname;
    if (path === '/terms') return 'terms';
    if (path === '/vip') return 'vip';
    if (path === '/estab') return 'estab_home';
    if (path === '/freela') return 'freela_home';
    return 'app';
  };

  const [route, setRoute] = useState<Route>(getRouteFromPath);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(getRouteFromPath());
    };

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
  }, []);

  const navigate = (newRoute: Route, path: string) => {
    window.history.pushState({}, '', path);
    setRoute(newRoute);
  };

  if (route === 'terms') {
    return <TermsPage onBack={() => navigate('app', '/')} />;
  }

  if (currentUser && route === 'vip') {
    return (
      <VipPanel
        userId={currentUser.id}
        accountType={currentUser.accountType}
        onBack={() => navigate('app', currentUser.accountType === 'establishment' ? '/estab' : '/freela')}
      />
    );
  }

  if (!currentUser) {
    return (
      <LandingPage
        onNavigateTerms={() => navigate('terms', '/terms')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header 
        onNavigateHome={() => {
          const homePath = currentUser.accountType === 'establishment' ? '/estab' : '/freela';
          navigate('app', homePath);
        }}
        onNavigateVip={() => navigate('vip', '/vip')}
      />
      <main className="pb-16">
        {isAdmin ? (
          adminMode ? (
            <AdminView />
          ) : route === 'estab_home' || currentUser.accountType === 'establishment' ? (
            <ContractorView />
          ) : (
            <FreelancerView />
          )
        ) : route === 'estab_home' || currentUser.accountType === 'establishment' ? (
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
