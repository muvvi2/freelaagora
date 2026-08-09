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
      notify('Abra o menu do navegador e selecione "Adicionar à Tela Inicial".', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') notify('Aplicativo instalado!');
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-primary-950/40" />
      
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header limpo - apenas logo e termos */}
        <nav className="flex items-center justify-between px-4 py-3 sm:px-8">
          <img src="/image.png" alt="FreelaAgora" className="h-10 w-auto sm:h-16" />
          <button onClick={onNavigateTerms} className="text-xs sm:text-sm font-medium text-neutral-400 hover:text-white">Termos</button>
        </nav>

        {/* Hero com botões LADO A LADO */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 pt-12 pb-12 text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Precisa de alguém?<br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Chame aqui!</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm text-neutral-400">
            O marketplace de contratação emergencial de freelancers para bares, restaurantes, buffets e eventos.
          </p>

          {/* Botões LADO A LADO */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => setAuthModal('login')} variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
              <LogIn className="h-4 w-4 mr-2" /> Entrar
            </Button>
            <Button size="lg" onClick={() => setAuthModal('register')} className="bg-primary-500 text-white shadow-glow px-8">
              <UserPlus className="h-4 w-4 mr-2" /> Cadastrar-se
            </Button>
          </div>

          <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
            <FeatureCard icon={Wallet} title="Garantia (Escrow)" desc="Pagamento retido até a conclusão do serviço." />
            <FeatureCard icon={Calendar} title="Agenda de turnos" desc="Freelancers definem disponibilidade por turno." />
            <FeatureCard icon={MapPin} title="Busca por proximidade" desc="Profissionais da sua região." />
          </div>
        </main>
      </div>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={(m) => setAuthModal(m)} onNavigateTerms={onNavigateTerms} />}
    </div>
  );
}

// --- Componentes ---

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/15"><Icon className="h-4 w-4 text-primary-400" /></div>
      <h3 className="font-bold text-sm text-white">{title}</h3>
      <p className="mt-1 text-xs text-neutral-400">{desc}</p>
    </div>
  );
}

function AuthModal({ mode, onClose, onSwitch, onNavigateTerms }: { mode: 'login' | 'register'; onClose: () => void; onSwitch: (m: 'login' | 'register') => void; onNavigateTerms?: () => void }) {
  return mode === 'login' ? <LoginForm onClose={onClose} onSwitch={onSwitch} /> : <RegisterForm onClose={onClose} onSwitch={onSwitch} onNavigateTerms={onNavigateTerms} />;
}

function LoginForm({ onClose, onSwitch }: { onClose: () => void; onSwitch: (m: 'login' | 'register') => void }) {
  const { login } = useApp();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!emailValid(email)) { setError('E-mail inválido.'); return; }
    const res = login(email, password);
    if (!res.ok) { setError(res.error ?? 'Erro ao entrar.'); return; }
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="sm" footer={<div className="text-center text-sm">Não tem conta? <button onClick={() => onSwitch('register')} className="font-semibold text-primary-500">Cadastrar-se</button></div>}>
      <h2 className="text-lg font-bold mb-4">Entrar</h2>
      <div className="space-y-3">
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button fullWidth onClick={submit}>Entrar</Button>
      </div>
    </Modal>
  );
}

function RegisterForm({ onClose, onSwitch, onNavigateTerms }: { onClose: () => void; onSwitch: (m: 'login' | 'register') => void; onNavigateTerms?: () => void }) {
  const { register } = useApp();
  const { notify } = useToast();
  const [accountType, setAccountType] = useState<AccountType>('freelancer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name || !email || !password) { setError('Preencha os campos obrigatórios.'); return; }
    if (!acceptedTerms) { setError('Aceite os termos.'); return; }
    
    const base = { accountType, name, email, password, address: { city: 'Pitangueiras', state: 'SP' }, termsAcceptance: { timestamp: new Date().toISOString(), ip: '0.0.0.0', legalVersion: '1.9' } };
    const extra = accountType === 'freelancer' ? { cpf: cpfCnpj } : { cnpj: cpfCnpj, establishmentType: 'Bar & Restaurante' };
    
    const res = register({ ...base, ...extra } as User);
    if (res.ok) { notify('Conta criada!'); onClose(); }
    else setError(res.error ?? 'Erro no cadastro.');
  };

  return (
    <Modal open onClose={onClose} size="lg" footer={<Button fullWidth onClick={submit} disabled={!acceptedTerms}>Criar Conta</Button>}>
      <h2 className="text-lg font-bold mb-4">Cadastrar-se</h2>
      <div className="flex gap-2 mb-4">
        <button className={`flex-1 p-2 rounded border ${accountType === 'freelancer' ? 'bg-primary-100' : ''}`} onClick={() => setAccountType('freelancer')}>Freelancer</button>
        <button className={`flex-1 p-2 rounded border ${accountType === 'establishment' ? 'bg-primary-100' : ''}`} onClick={() => setAccountType('establishment')}>Estabelecimento</button>
      </div>
      <div className="space-y-3">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label={accountType === 'freelancer' ? 'CPF' : 'CNPJ'} value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} /> Aceito os termos.</label>
      </div>
    </Modal>
  );
}
