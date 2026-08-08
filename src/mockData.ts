import type { AppData, Category, MacroCategory, VipPlan, EstVipPlan, MetroMap, User, WeekAvailability, Job, Contract, WalletTx, AppNotification, Address } from './types';

// ============================================================
// MACRO-CATEGORIES
// ============================================================
export const MACRO_CATEGORIES: MacroCategory[] = [
  { id: 'alimentacao', label: 'Alimentação e Gastronomia', icon: 'ChefHat', color: '#f97316' },
  { id: 'domesticos', label: 'Domésticos e Cuidados', icon: 'Home', color: '#22c55e' },
  { id: 'eventos', label: 'Eventos, Entretenimento e Estética', icon: 'PartyPopper', color: '#ec4899' },
  { id: 'manutencao', label: 'Manutenção, Reformas e Emergências', icon: 'Wrench', color: '#f59e0b' },
  { id: 'varejo', label: 'Varejo, Comércio e Atendimento', icon: 'Store', color: '#0891b2' },
  { id: 'logistica', label: 'Logística, Segurança e Serviços Gerais', icon: 'Truck', color: '#3b82f6' },
  { id: 'tecnico', label: 'Técnico, Saúde e Educação', icon: 'Stethoscope', color: '#8b5cf6' },
];

// ============================================================
// CATEGORIES — Full national catalog (7 macro-categories)
// ============================================================
export const CATEGORIES: Category[] = [
  // Alimentação e Gastronomia
  { id: 'cozinha', label: 'Cozinheiro(a) / Auxiliar', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'garcom', label: 'Garçom / Garçonete', icon: 'Utensils', color: '#14b8a6', macro: 'alimentacao' },
  { id: 'cumim', label: 'Cumim', icon: 'Utensils', color: '#0d9488', macro: 'alimentacao' },
  { id: 'barista', label: 'Barista', icon: 'Coffee', color: '#a16207', macro: 'alimentacao' },
  { id: 'bartender', label: 'Bartender / Barman', icon: 'Wine', color: '#a855f7', macro: 'alimentacao' },
  { id: 'padeiro', label: 'Padeiro(a)', icon: 'Wheat', color: '#d4a373', macro: 'alimentacao' },
  { id: 'confeiteiro', label: 'Confeiteiro(a)', icon: 'Cake', color: '#fb7185', macro: 'alimentacao' },
  { id: 'pizzaiolo', label: 'Pizzaiolo(a)', icon: 'Pizza', color: '#ef4444', macro: 'alimentacao' },
  { id: 'churrasqueiro', label: 'Churrasqueiro(a)', icon: 'Flame', color: '#ea580c', macro: 'alimentacao' },
  { id: 'acougueiro', label: 'Açougueiro(a)', icon: 'Beef', color: '#dc2626', macro: 'alimentacao' },
  { id: 'sushiman', label: 'Sushiman', icon: 'Fish', color: '#06b6d4', macro: 'alimentacao' },
  { id: 'atendente_lanchonete', label: 'Atendente de Lanchonete', icon: 'Sandwich', color: '#f97316', macro: 'alimentacao' },
  { id: 'passador_carnes', label: 'Passador de Carnes', icon: 'Beef', color: '#b91c1c', macro: 'alimentacao' },
  // Domésticos e Cuidados
  { id: 'baba', label: 'Babá / Cuidador Infantil', icon: 'Baby', color: '#22c55e', macro: 'domesticos' },
  { id: 'cuidador_idosos', label: 'Cuidador de Idosos', icon: 'HeartHandshake', color: '#16a34a', macro: 'domesticos' },
  { id: 'caseiro', label: 'Caseiro(a)', icon: 'Home', color: '#15803d', macro: 'domesticos' },
  { id: 'diarista', label: 'Diarista / Limpeza Residencial', icon: 'Sparkles', color: '#22c55e', macro: 'domesticos' },
  { id: 'passadeiro', label: 'Passadeiro(a)', icon: 'Shirt', color: '#65a30d', macro: 'domesticos' },
  { id: 'cozinheiro_domestico', label: 'Cozinheiro(a) Doméstico', icon: 'ChefHat', color: '#84cc16', macro: 'domesticos' },
  { id: 'jardineiro', label: 'Jardineiro(a)', icon: 'Trees', color: '#15803d', macro: 'domesticos' },
  { id: 'piscineiro', label: 'Piscineiro(a)', icon: 'Waves', color: '#0891b2', macro: 'domesticos' },
  { id: 'pet_sitter', label: 'Pet Sitter / Passeador de Cães', icon: 'PawPrint', color: '#16a34a', macro: 'domesticos' },
  // Eventos, Entretenimento e Estética
  { id: 'promotor_eventos', label: 'Promotor(a) de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'recreador', label: 'Recreador(a)', icon: 'PartyPopper', color: '#f472b6', macro: 'eventos' },
  { id: 'recepcionista', label: 'Recepcionista / Cerimonialista', icon: 'ConciergeBell', color: '#f43f5e', macro: 'eventos' },
  { id: 'dj', label: 'DJ', icon: 'Music', color: '#8b5cf6', macro: 'eventos' },
  { id: 'sonoplasta', label: 'Sonoplasta', icon: 'Volume2', color: '#7c3aed', macro: 'eventos' },
  { id: 'iluminador', label: 'Iluminador', icon: 'Lightbulb', color: '#eab308', macro: 'eventos' },
  { id: 'fotografo', label: 'Fotógrafo(a)', icon: 'Camera', color: '#d946ef', macro: 'eventos' },
  { id: 'videomaker', label: 'Videomaker', icon: 'Video', color: '#c026d3', macro: 'eventos' },
  { id: 'montador_palco', label: 'Montador(a) de Palco / Roadie', icon: 'HardHat', color: '#f59e0b', macro: 'eventos' },
  { id: 'cabeleireiro', label: 'Cabeleireiro(a)', icon: 'Scissors', color: '#be185d', macro: 'eventos' },
  { id: 'barbeiro', label: 'Barbeiro', icon: 'Scissors', color: '#9f1239', macro: 'eventos' },
  { id: 'manicure', label: 'Manicure / Pedicure', icon: 'Hand', color: '#db2777', macro: 'eventos' },
  { id: 'maquiador', label: 'Maquiador(a)', icon: 'Brush', color: '#e11d48', macro: 'eventos' },
  // Manutenção, Reformas e Emergências
  { id: 'montador_moveis', label: 'Montador(a) de Móveis', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'pintor', label: 'Pintor(a)', icon: 'PaintRoller', color: '#ea580c', macro: 'manutencao' },
  { id: 'gesseiro', label: 'Gesseiro(a)', icon: 'Trowel', color: '#ca8a04', macro: 'manutencao' },
  { id: 'eletricista', label: 'Eletricista', icon: 'Zap', color: '#eab308', macro: 'manutencao' },
  { id: 'encanador', label: 'Encanador(a)', icon: 'Wrench', color: '#d97706', macro: 'manutencao' },
  { id: 'pedreiro', label: 'Pedreiro(a) / Ajudante', icon: 'Trowel', color: '#b45309', macro: 'manutencao' },
  { id: 'marceneiro', label: 'Marceneiro(a)', icon: 'Hammer', color: '#92400e', macro: 'manutencao' },
  { id: 'serralheiro', label: 'Serralheiro(a)', icon: 'Wrench', color: '#78350f', macro: 'manutencao' },
  { id: 'tecnico_ac', label: 'Técnico de Ar-Condicionado', icon: 'Wind', color: '#0ea5e9', macro: 'manutencao' },
  { id: 'chaveiro', label: 'Chaveiro', icon: 'Key', color: '#a16207', macro: 'manutencao' },
  { id: 'vidraceiro', label: 'Vidraceiro', icon: 'Square', color: '#0891b2', macro: 'manutencao' },
  { id: 'desentupidor', label: 'Desentupidor', icon: 'Waves', color: '#0d9488', macro: 'manutencao' },
  // Varejo, Comércio e Atendimento
  { id: 'balconista', label: 'Balconista / Atendente', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'caixa', label: 'Operador(a) de Caixa', icon: 'Calculator', color: '#0d9488', macro: 'varejo' },
  { id: 'repositor', label: 'Repositor(a) de Estoque', icon: 'PackageCheck', color: '#6d28d9', macro: 'varejo' },
  { id: 'panfleteiro', label: 'Panfleteiro(a) / Divulgador(a)', icon: 'Megaphone', color: '#2563eb', macro: 'varejo' },
  { id: 'fiscal_loja', label: 'Fiscal de Loja', icon: 'ShieldCheck', color: '#1d4ed8', macro: 'varejo' },
  { id: 'inventariante', label: 'Inventariante', icon: 'ClipboardList', color: '#1e40af', macro: 'varejo' },
  // Logística, Segurança e Serviços Gerais
  { id: 'motoboy', label: 'Motoboy / Entregador', icon: 'Truck', color: '#eab308', macro: 'logistica' },
  { id: 'motorista', label: 'Motorista Particular / Frete', icon: 'Car', color: '#3b82f6', macro: 'logistica' },
  { id: 'carregador', label: 'Carregador / Chapa (Carga e Descarga)', icon: 'Package', color: '#6366f1', macro: 'logistica' },
  { id: 'seguranca', label: 'Segurança Privada', icon: 'ShieldCheck', color: '#3b82f6', macro: 'logistica' },
  { id: 'controlador_acesso', label: 'Controlador de Acesso', icon: 'DoorOpen', color: '#4f46e5', macro: 'logistica' },
  { id: 'portaria', label: 'Portaria / Vigia', icon: 'ConciergeBell', color: '#4338ca', macro: 'logistica' },
  { id: 'lavador_carros', label: 'Lavador de Carros / Estética Automotiva', icon: 'Car', color: '#0ea5e9', macro: 'logistica' },
  { id: 'borracharia', label: 'Borracharia Móvel', icon: 'Circle', color: '#1d4ed8', macro: 'logistica' },
  { id: 'mecanico_emergencia', label: 'Mecânico de Emergência', icon: 'Wrench', color: '#3730a3', macro: 'logistica' },
  { id: 'guincho', label: 'Guincho', icon: 'Truck', color: '#312e81', macro: 'logistica' },
  // Técnico, Saúde e Educação
  { id: 'ti', label: 'Suporte de TI / Infraestrutura', icon: 'Laptop', color: '#06b6d4', macro: 'tecnico' },
  { id: 'assistencia_tecnica', label: 'Assistência Técnica (Celulares/Eletros)', icon: 'Smartphone', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'enfermeiro', label: 'Enfermeiro(a) Particular / Home Care', icon: 'Stethoscope', color: '#7c3aed', macro: 'tecnico' },
  { id: 'massoterapeuta', label: 'Massoterapeuta', icon: 'Hand', color: '#9333ea', macro: 'tecnico' },
  { id: 'personal_trainer', label: 'Personal Trainer', icon: 'Dumbbell', color: '#a855f7', macro: 'tecnico' },
  { id: 'professor_particular', label: 'Professor(a) Particular / Reforço', icon: 'GraduationCap', color: '#6d28d9', macro: 'tecnico' },
];

// ============================================================
// FREELANCER VIP PLANS
// ============================================================
export const VIP_PLANS: VipPlan[] = [
  { tier: 'free', label: 'Free', maxCategories: 2, features: ['Até 2 categorias ativas', 'Aparição padrão nas buscas'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'vip1', label: 'VIP 1', maxCategories: 4, features: ['Até 4 categorias ativas', 'Impulso leve nas buscas'], prices: { monthly: 14.90, semestral: 59.90, annual: 99.90 }, boost: 'light' },
  { tier: 'vip2', label: 'VIP 2', maxCategories: 5, features: ['Até 5 categorias ativas', 'Selo verificado', 'Ranking superior nas buscas'], prices: { monthly: 24.90, semestral: 99.90, annual: 169.90 }, badge: 'verified', boost: 'top' },
  { tier: 'vip3', label: 'VIP 3', maxCategories: 999, features: ['Categorias ilimitadas', 'Destaque visual máximo', 'Suporte prioritário', 'Ranking máximo'], prices: { monthly: 39.90, semestral: 159.90, annual: 279.90 }, badge: 'diamond', boost: 'max' },
];

// ============================================================
// ESTABLISHMENT VIP PLANS
// ============================================================
export const EST_VIP_PLANS: EstVipPlan[] = [
  { tier: 'free', label: 'Plano Gratuito', intermediationFee: 15.0, maxActiveJobs: 2, features: ['Até 2 vagas por semana', 'Taxa de intermediação de 15,0%', 'Gratuito', 'Acesso completo ao marketplace'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'vip1', label: 'Plano VIP 1', intermediationFee: 7.5, maxActiveJobs: 5, features: ['Até 5 vagas por semana', 'Taxa reduzida de 7,5%', 'Prioridade no suporte'], prices: { monthly: 29.90, semestral: 149.90, annual: 249.90 } },
  { tier: 'vip2', label: 'Plano VIP 2', intermediationFee: 5.0, maxActiveJobs: 20, features: ['Até 20 vagas por semana', 'Taxa reduzida de 5,0%', 'Prioridade no suporte', 'Destaque nas buscas'], prices: { monthly: 59.90, semestral: 299.90, annual: 499.90 } },
  { tier: 'vip3', label: 'Plano VIP 3', intermediationFee: 0.0, maxActiveJobs: 999, features: ['Vagas ilimitadas por semana', 'Isenção total (0%) de taxas', 'Suporte prioritário VIP', 'Destaque máximo'], prices: { monthly: 119.90, semestral: 549.00, annual: 949.00 } },
];

export const LEGAL_VERSION = 'v1.9';

export const tierLabel: Record<string, string> = { free: 'Free', vip1: 'VIP 1', vip2: 'VIP 2', vip3: 'VIP 3' };
export const estTierLabel: Record<string, string> = { free: 'Gratuito', vip1: 'VIP 1', vip2: 'VIP 2', vip3: 'VIP 3' };

// ============================================================
// METRO MAP — São Paulo (legacy, kept for fallback)
// ============================================================
export const METRO_MAP: MetroMap = {
  'São Paulo': ['Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul', 'Diadema', 'Taboão da Serra', 'Embu das Artes'],
  'Guarulhos': ['São Paulo'],
  'Osasco': ['São Paulo', 'Barueri'],
  'Santo André': ['São Paulo', 'São Bernardo do Campo', 'São Caetano do Sul', 'Mauá'],
  'São Bernardo do Campo': ['São Paulo', 'Santo André', 'São Caetano do Sul', 'Diadema'],
  'São Caetano do Sul': ['São Paulo', 'Santo André', 'São Bernardo do Campo'],
  'Diadema': ['São Paulo', 'São Bernardo do Campo'],
  'Taboão da Serra': ['São Paulo', 'Embu das Artes'],
  'Embu das Artes': ['São Paulo', 'Taboão da Serra'],
  'Barueri': ['Osasco', 'Carapicuíba'],
  'Carapicuíba': ['Osasco', 'Barueri'],
  'Mauá': ['Santo André', 'Ribeirão Pires'],
  'Ribeirão Pires': ['Mauá', 'Santo André'],
};

export function metroNearby(city: string): string[] {
  const nearby = METRO_MAP[city] ?? [];
  return [city, ...nearby];
}

// ============================================================
// AVAILABILITY helpers
// ============================================================
export function emptyAvailability(): WeekAvailability {
  const days: WeekAvailability = {} as WeekAvailability;
  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    days[d] = { manha: false, tarde: false, noite: false };
  }
  return days;
}

export function fullAvailability(): WeekAvailability {
  const days: WeekAvailability = {} as WeekAvailability;
  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    days[d] = { manha: true, tarde: true, noite: true };
  }
  return days;
}

export const DAY_LABELS: { key: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'; label: string; short: string }[] = [
  { key: 'seg', label: 'Segunda', short: 'Seg' },
  { key: 'ter', label: 'Terça', short: 'Ter' },
  { key: 'qua', label: 'Quarta', short: 'Qua' },
  { key: 'qui', label: 'Quinta', short: 'Qui' },
  { key: 'sex', label: 'Sexta', short: 'Sex' },
  { key: 'sab', label: 'Sábado', short: 'Sáb' },
  { key: 'dom', label: 'Domingo', short: 'Dom' },
];

export const SHIFT_LABELS: { key: 'manha' | 'tarde' | 'noite'; label: string; icon: string }[] = [
  { key: 'manha', label: 'Manhã', icon: 'Sunrise' },
  { key: 'tarde', label: 'Tarde', icon: 'Sun' },
  { key: 'noite', label: 'Noite', icon: 'Moon' },
];

// ============================================================
// DEMO USERS
// ============================================================
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

const addrSP = (street: string, num: string, bairro: string, lat = -23.56, lng = -46.65): Address => ({ cep: '01310-100', street, number: num, neighborhood: bairro, city: 'São Paulo', state: 'SP', lat, lng });

export const SEED_USERS: User[] = [
  {
    id: 'admin1', accountType: 'freelancer', isAdmin: true, adminRole: 'super',
    email: 'admin@freelaagora.com', password: 'admin123', name: 'Administrador FreelaAgora',
    photo: 'https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 90000-0000', whatsapp: '(11) 90000-0000', address: addrSP('R. Augusta', '100', 'Consolação'),
    walletBalance: 0, createdAt: daysAgo(120),
    termsAcceptance: { timestamp: daysAgo(120), ip: '189.45.22.10', userAgent: 'Mozilla/5.0 FreelaAgora', legalVersion: 'v1.0' },
  },
  {
    id: 'admin2', accountType: 'freelancer', isAdmin: true, adminRole: 'regular',
    email: 'moderador@freelaagora.com', password: 'mod123', name: 'Moderador FreelaAgora',
    photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 90000-0001', whatsapp: '(11) 90000-0001', address: addrSP('R. Augusta', '200', 'Consolação'),
    walletBalance: 0, createdAt: daysAgo(60),
    termsAcceptance: { timestamp: daysAgo(60), ip: '189.45.22.11', userAgent: 'Mozilla/5.0 FreelaAgora', legalVersion: 'v1.0' },
  },
  {
    id: 'fl1', accountType: 'freelancer', email: 'marcos@freelaagora.com', password: '123456',
    name: 'Marcos "Tigrão" Araújo', nickname: 'Tigrão', photo: 'https://images.pexels.com/photos/26621714/pexels-photo-26621714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 98888-1111', whatsapp: '(11) 98888-1111', address: addrSP('R. dos Pinheiros', '842', 'Pinheiros', -23.57, -46.70),
    cpf: '111.444.777-35', bio: '15 anos de brasa na chapa. Especialista em costela fogo de chão e buffet para grandes eventos.',
    specialties: ['Churrasqueiro', 'Cozinheiro'], hourlyRate: 45, dailyRate: 320, pixKey: 'marcos.tigrao@pix.com',
    rating: 4.9, reviewsCount: 47, completedShifts: 142, vipTier: 'vip2',
    vipExpiresAt: new Date(now + 20 * 86400000).toISOString(), categories: ['churrasqueiro', 'cozinha', 'garcom', 'bartender', 'promotor_eventos'],
    availability: fullAvailability(), walletBalance: 1240, documentVerified: true, createdAt: daysAgo(90),
    serviceRadiusKm: 25, acceptsInterstate: true,
    termsAcceptance: { timestamp: daysAgo(90), ip: '201.55.33.22', userAgent: 'Mozilla/5.0 Chrome', legalVersion: 'v1.0' },
  },
  {
    id: 'fl2', accountType: 'freelancer', email: 'juliana@freelaagora.com', password: '123456',
    name: 'Juliana Mendes', nickname: 'Ju', photo: 'https://images.pexels.com/photos/28945105/pexels-photo-28945105.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 97777-2222', whatsapp: '(11) 97777-2222', address: { cep: '02011-000', street: 'R. Voluntários da Pátria', number: '500', neighborhood: 'Santana', city: 'São Paulo', state: 'SP', lat: -23.50, lng: -46.62 },
    cpf: '222.333.444-05', bio: 'Garçonete de evento desde 2018. Atendo casamentos, confraternizações e jantares corporativos.',
    specialties: ['Garçonete', 'Recepcionista'], hourlyRate: 32, dailyRate: 220, pixKey: 'ju.mendes@pix.com',
    rating: 4.8, reviewsCount: 63, completedShifts: 98, vipTier: 'free',
    categories: ['garcom', 'recepcionista'],
    availability: { ...emptyAvailability(), seg: { manha: false, tarde: true, noite: true }, qua: { manha: false, tarde: true, noite: true }, sex: { manha: false, tarde: false, noite: true }, sab: { manha: true, tarde: true, noite: true }, dom: { manha: true, tarde: true, noite: false } },
    walletBalance: 860, createdAt: daysAgo(60), serviceRadiusKm: 10, acceptsInterstate: false,
    termsAcceptance: { timestamp: daysAgo(60), ip: '189.22.44.55', userAgent: 'Mozilla/5.0 Safari', legalVersion: 'v1.0' },
  },
  {
    id: 'fl3', accountType: 'freelancer', email: 'diego@freelaagora.com', password: '123456',
    name: 'Diego Santos', photo: 'https://images.pexels.com/photos/14164521/pexels-photo-14164521.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 96666-3333', whatsapp: '(11) 96666-3333', address: { cep: '07041-050', street: 'R. Felício Marcondes', number: '123', neighborhood: 'Centro', city: 'Guarulhos', state: 'SP', lat: -23.45, lng: -46.53 },
    cpf: '333.222.111-04', bio: 'Auxiliar de cozinha ágil e organizado. Disponível para plantões de fim de semana e coberturas.',
    specialties: ['Auxiliar de Cozinha', 'Copeiro'], hourlyRate: 24, dailyRate: 160, pixKey: 'diegosantos@pix.com',
    rating: 4.7, reviewsCount: 29, completedShifts: 54, vipTier: 'free', categories: ['cozinha'],
    availability: { ...emptyAvailability(), sab: { manha: true, tarde: true, noite: true }, dom: { manha: true, tarde: true, noite: true } },
    walletBalance: 320, createdAt: daysAgo(45), serviceRadiusKm: 15, acceptsInterstate: false,
    termsAcceptance: { timestamp: daysAgo(45), ip: '177.33.55.66', userAgent: 'Mozilla/5.0 Firefox', legalVersion: 'v1.0' },
  },
  {
    id: 'fl4', accountType: 'freelancer', email: 'rafael@freelaagora.com', password: '123456',
    name: 'Rafael "Rafa" Costa', nickname: 'Rafa', photo: 'https://images.pexels.com/photos/19652091/pexels-photo-19652091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 95555-4444', whatsapp: '(11) 95555-4444', address: addrSP('Al. Santos', '2000', 'Jardim Paulista', -23.58, -46.67),
    cpf: '444.555.666-07', bio: 'Bartender premiado em duas edições da São Paulo Cocktail Week. Levo minha própria estação.',
    specialties: ['Bartender', 'Somelier'], hourlyRate: 40, dailyRate: 280, pixKey: 'rafa.cocktails@pix.com',
    rating: 5.0, reviewsCount: 41, completedShifts: 87, vipTier: 'vip3',
    vipExpiresAt: new Date(now + 60 * 86400000).toISOString(), categories: ['bartender', 'promotor_eventos', 'cozinha', 'dj', 'garcom'],
    availability: fullAvailability(), walletBalance: 2100, documentVerified: true, createdAt: daysAgo(80),
    serviceRadiusKm: 50, acceptsInterstate: true,
    termsAcceptance: { timestamp: daysAgo(80), ip: '201.44.66.77', userAgent: 'Mozilla/5.0 Chrome Mobile', legalVersion: 'v1.0' },
  },
  {
    id: 'es1', accountType: 'establishment', email: 'contato@bardoze.com.br', password: '123456',
    name: 'Bar do Zé', photo: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 98888-1234', whatsapp: '(11) 98888-1234', address: addrSP('R. dos Pinheiros', '842', 'Pinheiros', -23.57, -46.70),
    cnpj: '12.345.678/0001-90', establishmentType: 'Bar & Restaurante',
    estVipTier: 'vip2', rating: 4.6, reviewsCount: 124, walletBalance: 500, createdAt: daysAgo(100),
    termsAcceptance: { timestamp: daysAgo(100), ip: '189.55.77.88', userAgent: 'Mozilla/5.0 Chrome', legalVersion: 'v1.0' },
  },
  {
    id: 'es2', accountType: 'establishment', email: 'eventos@lumiere.com.br', password: '123456',
    name: 'Casa de Eventos Lumière', photo: 'https://images.pexels.com/photos/13869884/pexels-photo-13869884.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 97777-5678', whatsapp: '(11) 97777-5678', address: { cep: '04547-000', street: 'Av. das Nações', number: '1500', neighborhood: 'Itaim Bibi', city: 'São Paulo', state: 'SP', lat: -23.59, lng: -46.68 },
    cnpj: '98.765.432/0001-10', establishmentType: 'Buffet & Eventos',
    estVipTier: 'vip3', estVipExpiresAt: new Date(now + 90 * 86400000).toISOString(),
    rating: 4.8, reviewsCount: 89, walletBalance: 1200, createdAt: daysAgo(95),
    termsAcceptance: { timestamp: daysAgo(95), ip: '201.66.88.99', userAgent: 'Mozilla/5.0 Safari', legalVersion: 'v1.0' },
  },
];

export const SEED_JOBS: Job[] = [
  { id: 'job1', establishmentId: 'es1', establishmentName: 'Bar do Zé', establishmentPhoto: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'garcom', title: 'Cobertura de sexta à noite', description: 'Preciso de 1 garçom para a noite de sexta. Casa lotada por causa do show.', date: new Date(now + 2 * 86400000).toISOString(), startTime: '18:00', hours: 6, value: 210, urgency: 'hoje', status: 'active', city: 'São Paulo', state: 'SP', applicants: ['fl2'], createdAt: daysAgo(1) },
  { id: 'job2', establishmentId: 'es2', establishmentName: 'Casa de Eventos Lumière', establishmentPhoto: 'https://images.pexels.com/photos/13869884/pexels-photo-13869884.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'bartender', title: 'Casamento sábado — bar de drinks', description: 'Casamento para 180 convidados. Bartender com experiência em drinks autorais.', date: new Date(now + 4 * 86400000).toISOString(), startTime: '16:00', hours: 8, value: 380, urgency: 'esta_semana', status: 'active', city: 'São Paulo', state: 'SP', applicants: ['fl4'], createdAt: daysAgo(2) },
  { id: 'job3', establishmentId: 'es1', establishmentName: 'Bar do Zé', establishmentPhoto: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'cozinha', title: 'Churrasco de domingo — urgente', description: 'Churrasqueiro escalado faltou. Rodízio de carnes das 12h às 17h.', date: new Date(now + 1 * 86400000).toISOString(), startTime: '11:00', hours: 7, value: 350, urgency: 'hoje', status: 'active', city: 'São Paulo', state: 'SP', applicants: ['fl1'], createdAt: daysAgo(1) },
];

export const SEED_CONTRACTS: Contract[] = [
  { id: 'ct1', jobId: null, establishmentId: 'es1', establishmentName: 'Bar do Zé', freelancerId: 'fl1', freelancerName: 'Marcos "Tigrão" Araújo', freelancerPhoto: 'https://images.pexels.com/photos/26621714/pexels-photo-26621714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', freelancerPhone: '(11) 98888-1111', freelancerWhatsapp: '(11) 98888-1111', category: 'cozinha', date: daysAgo(12), hours: 7, freelancerFee: 380, platformFeePercentage: 5.0, platformFee: 19, total: 399, status: 'completed', createdAt: daysAgo(15), history: [{ status: 'requested', at: daysAgo(15) }, { status: 'confirmed', at: daysAgo(15) }, { status: 'paid', at: daysAgo(14) }, { status: 'checked_in', at: daysAgo(12) }, { status: 'completed', at: daysAgo(12) }], reviewFromEstablishment: { id: 'rv1', fromId: 'es1', fromName: 'Bar do Zé', toId: 'fl1', rating: 5, comment: 'Tigrão salvou nosso domingo. Brasa no ponto!', date: daysAgo(12) }, reviewFromFreelancer: { id: 'rv2', fromId: 'fl1', fromName: 'Marcos "Tigrão" Araújo', toId: 'es1', rating: 5, comment: 'Estrutura impecável, pagamento no mesmo dia.', date: daysAgo(12) } },
  { id: 'ct2', jobId: 'job2', establishmentId: 'es2', establishmentName: 'Casa de Eventos Lumière', freelancerId: 'fl4', freelancerName: 'Rafael "Rafa" Costa', freelancerPhoto: 'https://images.pexels.com/photos/19652091/pexels-photo-19652091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', freelancerPhone: '(11) 95555-4444', freelancerWhatsapp: '(11) 95555-4444', category: 'bartender', date: daysAgo(3), hours: 8, freelancerFee: 340, platformFeePercentage: 0.0, platformFee: 0, total: 340, status: 'paid', createdAt: daysAgo(6), coraInvoiceId: 'cora-inv-002', history: [{ status: 'requested', at: daysAgo(6) }, { status: 'confirmed', at: daysAgo(5) }, { status: 'paid', at: daysAgo(3) }] },
];

export const SEED_WALLET_TXS: WalletTx[] = [
  { id: 'wt1', userId: 'fl1', type: 'escrow_release', amount: 380, description: 'Repasse do turno — Bar do Zé', contractId: 'ct1', date: daysAgo(12) },
  { id: 'wt2', userId: 'fl1', type: 'platform_fee', amount: -19, description: 'Taxa de intermediação FreelaAgora (5%)', contractId: 'ct1', date: daysAgo(12) },
  { id: 'wt3', userId: 'fl4', type: 'escrow_hold', amount: 0, description: 'Garantia retida — Casa de Eventos Lumière', contractId: 'ct2', date: daysAgo(3) },
  { id: 'wt4', userId: 'es1', type: 'escrow_hold', amount: -399, description: 'Pagamento em garantia — Marcos Tigrão', contractId: 'ct1', date: daysAgo(14) },
  { id: 'wt5', userId: 'es2', type: 'escrow_hold', amount: -340, description: 'Pagamento em garantia — Rafael Costa (0% taxa)', contractId: 'ct2', date: daysAgo(3) },
  { id: 'wt6', userId: 'admin1', type: 'platform_fee', amount: 19, description: 'Taxa de intermediação recebida — contrato ct1 (5%)', contractId: 'ct1', date: daysAgo(12) },
  { id: 'wt7', userId: 'es1', type: 'vip_charge_est', amount: -59.90, description: 'Assinatura VIP 2 (mensal)', date: daysAgo(30) },
  { id: 'wt8', userId: 'fl1', type: 'vip_charge', amount: -24.90, description: 'Assinatura VIP 2 (mensal)', date: daysAgo(30) },
  { id: 'wt9', userId: 'es2', type: 'vip_charge_est', amount: -119.90, description: 'Assinatura VIP 3 (mensal)', date: daysAgo(30) },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', userId: 'fl1', type: 'contract_update', title: 'Repasse realizado', body: 'Seu pagamento de R$ 380,00 foi liberado para sua carteira.', read: true, date: daysAgo(12), contractId: 'ct1' },
  { id: 'n2', userId: 'fl4', type: 'hire_request', title: 'Nova solicitação de contratação', body: 'Casa de Eventos Lumière quer te contratar. Confirme sua disponibilidade.', read: false, date: daysAgo(6), contractId: 'ct2' },
  { id: 'n3', userId: 'es2', type: 'contract_update', title: 'Freelancer confirmou disponibilidade', body: 'Rafael Costa confirmou. Realize o pagamento para liberar o contato.', read: false, date: daysAgo(5), contractId: 'ct2' },
  { id: 'n4', userId: 'admin1', type: 'payment', title: 'Taxa arrecadada', body: 'Taxa de intermediação de R$ 19,00 creditada (5%).', read: true, date: daysAgo(12), contractId: 'ct1' },
];

export const SEED_COUPONS = [
  { id: 'cp1', code: 'BEMVINDO10', discountPercentage: 10, isActive: true, createdAt: daysAgo(30) },
  { id: 'cp2', code: 'FREELA20', discountPercentage: 20, isActive: true, createdAt: daysAgo(15) },
  { id: 'cp3', code: 'VIPMAX15', discountPercentage: 15, isActive: true, createdAt: daysAgo(5) },
];

export const SEED_AUDIT_LOGS = [
  { id: 'al1', adminId: 'admin1', action: 'Sistema iniciado — dados de demonstração carregados', createdAt: daysAgo(120) },
];

export const initialData: AppData = {
  users: SEED_USERS,
  jobs: SEED_JOBS,
  contracts: SEED_CONTRACTS,
  walletTxs: SEED_WALLET_TXS,
  notifications: SEED_NOTIFICATIONS,
  reviews: [
    { id: 'rv1', fromId: 'es1', fromName: 'Bar do Zé', toId: 'fl1', rating: 5, comment: 'Tigrão salvou nosso domingo. Brasa no ponto!', date: daysAgo(12) },
    { id: 'rv2', fromId: 'fl1', fromName: 'Marcos "Tigrão" Araújo', toId: 'es1', rating: 5, comment: 'Estrutura impecável, pagamento no mesmo dia.', date: daysAgo(12) },
  ],
  coupons: SEED_COUPONS,
  adminAuditLogs: SEED_AUDIT_LOGS,
  config: { defaultFeePercent: 15.0 },
  paymentSettings: { activeProvider: 'asaas', configs: {} },
  currentUserId: null,
  vipPlans: VIP_PLANS,
  estVipPlans: EST_VIP_PLANS,
};
