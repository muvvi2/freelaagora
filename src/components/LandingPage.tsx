import { useState, useEffect } from 'react';
import { LogIn, UserPlus, Shield, Wallet, Calendar, MapPin, Check, Eye, EyeOff, ChefHat, Store, Fingerprint, AlertCircle, ExternalLink, Info, Tags, Crown, Download } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { emailValid, maskCPF, maskCNPJ, maskPhone, maskCEP, validateCPF, validateCNPJ } from '@/utils';
import { LEGAL_VERSION, MACRO_CATEGORIES, CATEGORIES } from '@/mockData';
import type { AccountType, User, Address, TermsAcceptance } from '@/types';

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const ESTABLISHMENT_TYPES = [
  'Bar & Restaurante', 'Restaurante', 'Bar', 'Lanchonete / Fast Food', 'Buffet & Eventos', 'Padaria & Confeitaria', 'Pizzaria', 'Churrascaria', 'Cafeteria & Barista', 'Cervejaria & Choperia', 'Sorveteria & Gelateria', 'Cozinha Industrial / Coletiva',
  'Hotel', 'Pousada', 'Resort', 'Hostel', 'Casa de Shows & Eventos', 'Espaço de Festas',
  'Supermercado & Hipermercado', 'Loja de Shopping / Varejo', 'Farmácia & Perfumaria', 'Comércio de Hortifrúti', 'Loja de E-commerce / Centro de Distribuição', 'Posto de Combustíveis & Conveniência',
  'Clínica Médica / Home Care', 'Clínica Odontológica', 'Salão de Beleza & Barbearia', 'Estúdio de Estética & Spa', 'Academia & Centro Esportivo', 'Clínica Veterinária & Pet Shop',
  'Construtora & Incorporadora', 'Empresa de Engenharia & Arquitetura', 'Loja de Materiais de Construção', 'Condomínio Residencial / Predial', 'Administradora de Imóveis',
  'Escritório de Advocacia', 'Escritório de Contabilidade', 'Agência de Marketing & Publicidade', 'Empresa de TI / Tecnologia', 'Consultoria & Gestão',
  'Empresa de Logística & Transportes', 'Indústria & Fábrica', 'Fazenda & Produtor Rural', 'Cooperativa Agrícola', 'Oficina Mecânica & Estética Automotiva', 'Outros / Geral'
];

export function LandingPage({ onNavigateTerms }: { onNavigateTerms?: () => void }) {
  const [authModal, setAuthModal] = useState<null | 'login' | 'register'>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      notify('Para instalar no celular, abra o menu do navegador (3 pontinhos ou Compartilhar) e selecione "Adicionar à Tela Inicial".', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      notify('Aplicativo instalado com sucesso!');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-primary-950/40" />
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-secondary-500/15 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header Responsivo */}
        <nav className="flex items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <img src="/image.png" alt="FreelaAgora" className="h-10 w-auto max-w-[160px] object-contain sm:h-16 sm:max-w-[260px]" />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {showInstallBtn && (
              <Button size="sm" variant="outline" onClick={handleInstallClick} className="border-accent-400/50 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20 text-xs">
                <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Instalar App</span>
              </Button>
            )}
            <button onClick={onNavigateTerms} className="text-xs sm:text-sm font-medium text-neutral-400 transition hover:text-white">Termos</button>
            <Button size="sm" onClick={() => setAuthModal('login')} className="bg-primary-500 text-white hover:bg-primary-600 shadow-glow text-xs sm:text-sm"><LogIn className="h-3.5 w-3.5" /> Entrar</Button>
          </div>
        </nav>

        {/* Main sem carrossel, layout limpo */}
        <main className="flex flex-1 flex-col items-center justify-start px-4 pt-12 pb-12 text-center sm:px-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-neutral-300 backdrop-blur">
            <Shield className="h-3.5 w-3.5 text-secondary-400" />
            Pagamento seguro com garantia (escrow)
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Precisa de alguém?<br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Chame aqui!</span>
          </h1>
          <p className="mt-4 max-w-lg text-xs text-neutral-400 sm:text-sm">
            O marketplace de contratação emergencial de freelancers para bares, restaurantes, buffets, eventos, serviços gerais, saúde, oficinas e logística.
          </p>

          {/* Botões de Ação na Hero */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => setAuthModal('register')} className="bg-primary-500 text-white hover:bg-primary-600 shadow-glow text-sm sm:text-base px-6">
              <UserPlus className="h-4 w-4" /> Cadastrar-se agora
            </Button>
            <Button size="lg" variant="outline" onClick={() => setAuthModal('login')} className="border-white/20 text-white hover:bg-white/10 text-sm sm:text-base px-6">
              <LogIn className="h-4 w-4" /> Já tenho conta (Entrar)
            </Button>
          </div>

          <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
            <FeatureCard icon={Wallet} title="Garantia (Escrow)" desc="Pagamento retido até a conclusão do serviço. Segurança para os dois lados." />
            <FeatureCard icon={Calendar} title="Agenda de turnos" desc="Freelancers definem disponibilidade por manhã, tarde e noite." />
            <FeatureCard icon={MapPin} title="Busca por proximidade" desc="Só aparecem profissionais da sua cidade e região metropolitana." />
          </div>
        </main>

        <footer className="px-5 py-4 text-center text-xs text-neutral-500 sm:px-8">
          FreelaAgora · Plataforma fintech de freelancers · {new Date().getFullYear()}
        </footer>
      </div>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={(m) => setAuthModal(m)} onNavigateTerms={onNavigateTerms} />}
    </div>
  );
}

// Restante dos componentes (FeatureCard, AuthModal, LoginForm, RegisterForm, TypeCard, etc.) permanecem iguais
function FeatureCard({ icon: Icon, title, desc }: { icon: typeof Shield; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left backdrop-blur transition hover:border-white/20">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/15"><Icon className="h-4 w-4 text-primary-400" /></div>
      <h3 className="font-display font-bold text-xs sm:text-sm text-white">{title}</h3>
      <p className="mt-1 text-[11px] sm:text-xs text-neutral-400">{desc}</p>
    </div>
  );
}

function AuthModal({ mode, onClose, onSwitch, onNavigateTerms }: { mode: 'login' | 'register'; onClose: () => void; onSwitch: (m: 'login' | 'register') => void; onNavigateTerms?: () => void }) {
  return mode === 'login' ? <LoginForm onClose={onClose} onSwitch={onSwitch} /> : <RegisterForm onClose={onClose} onSwitch={onSwitch} onNavigateTerms={onNavigateTerms} />;
}

// ... (LoginForm, RegisterForm, TypeCard, etc. mantidos inalterados) ...
