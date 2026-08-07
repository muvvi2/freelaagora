import { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { ToastProvider } from './components/ui/Toast';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ContractorView } from './components/ContractorView';
import { FreelancerView } from './components/FreelancerView';
import { AdminView } from './components/AdminView';
import { TermsPage } from './components/TermsPage';

type Route = 'app' | 'terms';

function MainContent() {
  const { currentUser, isAdmin, adminMode } = useApp();
  const [route, setRoute] = useState<Route>('app');

  if (route === 'terms') {
    return <TermsPage onBack={() => setRoute('app')} />;
  }

  if (!currentUser) {
    return <LandingPage onNavigateTerms={() => setRoute('terms')} />;
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
