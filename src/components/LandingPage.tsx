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
      notify('Para instalar no celular, abra o menu do navegador e selecione "Adicionar à Tela Inicial".', 'info');
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
        {/* Header Limpo */}
        <nav className="flex items-center justify-between px-4 py-3 sm:px-8">
          <img src="/image.png" alt="FreelaAgora" className="h-10 w-auto max-w-[160px] object-contain sm:h-16 sm:max-w-[260px]" />
          <div className="flex items-center gap-3">
            {showInstallBtn && (
              <Button size="sm" variant="outline" onClick={handleInstallClick} className="border-accent-400/50 bg-accent-500/10 text-accent-300 text-xs hidden sm:flex">
                <Download className="h-3.5 w-3.5" /> Instalar App
              </Button>
            )}
            <button onClick={onNavigateTerms} className="text-xs sm:text-sm font-medium text-neutral-400 hover:text-white">Termos</button>
            <Button size="sm" onClick={() => setAuthModal('login')} className="bg-primary-500 text-white text-xs sm:text-sm"><LogIn className="h-3.5 w-3.5" /> Entrar</Button>
          </div>
        </nav>

        {/* Hero limpa (sem carrossel) */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 pt-12 pb-12 text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Precisa de alguém?<br />
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Chame aqui!</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm text-neutral-400">
            O marketplace de contratação emergencial de freelancers para bares, restaurantes, buffets, eventos e logística.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => setAuthModal('register')} className="bg-primary-500 text-white shadow-glow px-8">
              <UserPlus className="h-4 w-4" /> Cadastrar-se agora
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

// --- Componentes Auxiliares ---

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

function TypeCard({ active, onClick, icon: Icon, label, desc }: { active: boolean; onClick: () => void; icon: any; label: string; desc: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${active ? 'border-primary-400 bg-primary-50' : 'border-neutral-200'}`}>
      <Icon className={`h-7 w-7 ${active ? 'text-primary-500' : 'text-neutral-400'}`} />
      <p className="text-sm font-bold">{label}</p>
    </button>
  );
}

function defaultPhoto(type: AccountType): string {
  return 'https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
}
