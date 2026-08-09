import { useState } from 'react';
import { Check, Upload, Trash2, ImageIcon, Link as LinkIcon, Lock, Users, Building2 } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { maskCNPJ, maskPhone, maskCEP, filterAdsByRadius } from '@/utils';

const SLOT_NAMES = ["Topo da Página", "Centro do Feed", "Rodapé da Página"];

export function EstablishmentEditModal({ establishment, open, onClose }: { establishment: User; open: boolean; onClose: () => void }) {
  const { updateUser, data } = useApp();
  const { notify } = useToast();
  
  const [name, setName] = useState(establishment.name);
  const [photo, setPhoto] = useState(establishment.photo);
  const [establishmentType, setEstablishmentType] = useState(establishment.establishmentType ?? 'Bar & Restaurante');
  
  // Endereço
  const [cep, setCep] = useState(establishment.address.cep ?? '');
  const [street, setStreet] = useState(establishment.address.street);
  const [neighborhood, setNeighborhood] = useState(establishment.address.neighborhood ?? '');
  const [city, setCity] = useState(establishment.address.city);
  const [state, setState] = useState(establishment.address.state);
  const [lat, setLat] = useState<number | undefined>(establishment.address.lat);
  const [lng, setLng] = useState<number | undefined>(establishment.address.lng);
  
  const [phone, setPhone] = useState(establishment.phone);
  const [whatsapp, setWhatsapp] = useState(establishment.whatsapp);
  const [email, setEmail] = useState(establishment.email);
  const [cnpj, setCnpj] = useState(establishment.cnpj ?? '');

  const [activeModalTab, setActiveModalTab] = useState<'freelancers' | 'establishments'>('freelancers');

  // --- AUTORIDADE DO PAINEL ADMIN & TRIAL ---
  const isOnTrial = establishment.trialEndsAt ? new Date(establishment.trialEndsAt) > new Date() : false;
  const currentTier = isOnTrial ? 'trial' : (establishment.estVipTier ?? 'free');
  const currentPlan = data.estVipPlans.find((p) => p.tier === currentTier) ?? data.estVipPlans[0];

  // O Painel Admin manda: se allowAds for true no plano, anúncios são permitidos
  const allowAds = currentPlan?.allowAds ?? false;
  const maxAds = currentPlan?.maxAds ?? 0;

  // Se o plano no Admin define maxAds (ex: 1, 2 ou 3), geramos os slots correspondentes automaticamente para o estabelecimento
  const defaultSlots = maxAds > 0 ? Array.from({ length: Math.min(maxAds, 3) }, (_, i) => i + 1) : [];

  const allowedFreelancerSlots = establishment.allowedFreelancerSlots?.length > 0 ? establishment.allowedFreelancerSlots : defaultSlots;
  const allowedEstablishmentSlots = establishment.allowedEstablishmentSlots?.length > 0 ? establishment.allowedEstablishmentSlots : defaultSlots;

  const hasFreelancerPermission = (establishment.includeFreelancerAd || allowedFreelancerSlots.length > 0) && allowAds;
  const hasEstablishmentPermission = (establishment.includeEstablishmentAd || allowedEstablishmentSlots.length > 0) && allowAds;

  // Armazenamento dos banners por slot (1, 2 e 3)
  const [freelancerImages, setFreelancerImages] = useState<string[]>(establishment.freelancerAds ?? []);
  const [freelancerLinks, setFreelancerLinks] = useState<string[]>(establishment.freelancerLinks ?? []);

  const [establishmentImages, setEstablishmentImages] = useState<string[]>(establishment.establishmentAds ?? []);
  const [establishmentLinks, setEstablishmentLinks] = useState<string[]>(establishment.establishmentLinks ?? []);

  const nearbyAds = filterAdsByRadius(data.users, establishment);

  const activeImagesList = activeModalTab === 'freelancers' ? freelancerImages : establishmentImages;
  const activeLinksList = activeModalTab === 'freelancers' ? freelancerLinks : establishmentLinks;
  const allowedSlotsForCurrentTab = activeModalTab === 'freelancers' ? allowedFreelancerSlots : allowedEstablishmentSlots;

  const setActiveImages = (newImgs: string[]) => {
    if (activeModalTab === 'freelancers') setFreelancerImages(newImgs);
    else setEstablishmentImages(newImgs);
  };

  const setActiveLinks = (newLinks: string[]) => {
    if (activeModalTab === 'freelancers') setFreelancerLinks(newLinks);
    else setEstablishmentLinks(newLinks);
  };

  const handleCepChange = async (value: string) => {
    const masked = maskCEP(value);
    setCep(masked);
    const cleanCep = masked.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const dataRes = await response.json();
        if (!dataRes.erro) {
          const newStreet = dataRes.logradouro || street;
          const newNeighborhood = dataRes.bairro || neighborhood;
          const newCity = dataRes.localidade || city;
          const newState = dataRes.uf || state;
          setStreet(newStreet); setNeighborhood(newNeighborhood); setCity(newCity); setState(newState);
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${newStreet}, ${newCity}, ${newState}, Brazil`)}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setLat(parseFloat(geoData[0].lat));
              setLng(parseFloat(geoData[0].lon));
            }
          } catch (geoErr) {}
          notify('Endereço encontrado!', 'success');
        } else {
          notify('CEP não encontrado.', 'warning');
        }
      } catch (error) {
        notify('Erro ao buscar CEP.', 'error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Validação estrita de dimensões 600x900 pixels por slot
  const handleAddOrUpdateAdForSlot = (e: React.ChangeEvent<HTMLInputElement>, slotNumber: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width !== 600 || img.height !== 900) {
          notify(`❌ Dimensões inválidas! O banner precisa ter exatamente 600x900px. A sua imagem tem ${img.width}x${img.height}px.`, 'error');
          return;
        }

        const slotIndex = slotNumber - 1;
        const newImgs = [...activeImagesList];
        newImgs[slotIndex] = reader.result as string;
        setActiveImages(newImgs);

        const newLinks = [...activeLinksList];
        if (!newLinks[slotIndex]) newLinks[slotIndex] = '';
        setActiveLinks(newLinks);

        notify(`${SLOT_NAMES[slotIndex]} atualizado com sucesso! (600x900px)`, 'success');
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        notify('Erro ao processar o arquivo de imagem.', 'error');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAdSlot = (slotNumber: number) => {
    const slotIndex = slotNumber - 1;
    const newImgs = [...activeImagesList];
    newImgs[slotIndex] = '';
    setActiveImages(newImgs);
    notify(`Anúncio do ${SLOT_NAMES[slotIndex]} removido`, 'info');
  };

  const handleLinkChange = (slotNumber: number, val: string) => {
    const slotIndex = slotNumber - 1;
    const next = [...activeLinksList];
    next[slotIndex] = val;
    setActiveLinks(next);
  };

  const handleSave = () => {
    updateUser(establishment.id, { 
      name, 
      photo, 
      establishmentType, 
      address: { ...establishment.address, cep, street, neighborhood, city, state, lat, lng }, 
      phone, 
      whatsapp, 
      email, 
      cnpj,
      homeAds: [],
      adImages: [],
      homeLinks: [],
      includeFreelancerAd: hasFreelancerPermission,
      includeEstablishmentAd: hasEstablishmentPermission,
      allowedFreelancerSlots,
      allowedEstablishmentSlots,
      freelancerAds: allowAds ? freelancerImages : [],
      freelancerLinks: allowAds ? freelancerLinks : [],
      establishmentAds: allowAds ? establishmentImages : [],
      establishmentLinks: allowAds ? establishmentLinks : []
    }); 
    onClose(); 
    notify('Estabelecimento atualizado com sucesso!'); 
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar estabelecimento" size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
          <Button fullWidth onClick={handleSave}>
            <Check className="h-4 w-4" /> Salvar
          </Button>
        </div>
      }>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Nome do Negócio / Empresa" value={name} onChange={(e) => setName(e.target.value)} /></div>
        
        <Select label="Tipo de Estabelecimento / Negócio" value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)}>
          {[
            'Bar & Restaurante', 'Restaurante', 'Bar', 'Lanchonete / Fast Food', 'Buffet & Eventos', 'Padaria & Confeitaria', 'Pizzaria', 'Churrascaria', 'Cafeteria & Barista', 'Cervejaria & Choperia', 'Sorveteria & Gelateria', 'Cozinha Industrial / Coletiva',
            'Hotel', 'Pousada', 'Resort', 'Hostel', 'Casa de Shows & Eventos', 'Espaço de Festas',
            'Supermercado & Hipermercado', 'Loja de Shopping / Varejo', 'Farmácia & Perfumaria', 'Comércio de Hortifrúti', 'Loja de E-commerce / Centro de Distribuição', 'Posto de Combustíveis & Conveniência',
            'Clínica Médica / Home Care', 'Clínica Odontológica', 'Salão de Beleza & Barbearia', 'Estúdio de Estética & Spa', 'Academia & Centro Esportivo', 'Clínica Veterinária & Pet Shop',
            'Construtora & Incorporadora', 'Empresa de Engenharia & Arquitetura', 'Loja de Materiais de Construção', 'Condomínio Residencial / Predial', 'Administradora de Imóveis',
            'Escritório de Advocacia', 'Escritório de Contabilidade', 'Agência de Marketing & Publicidade', 'Empresa de TI / Tecnologia', 'Consultoria & Gestão',
            'Empresa de Logística & Transportes', 'Indústria & Fábrica', 'Fazenda & Produtor Rural', 'Cooperativa Agrícola', 'Oficina Mecânica & Estética Automotiva', 'Outros / Geral'
          ].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        
        <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} />
        
        <div className="sm:col-span-2">
            <Input label="CEP" value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" />
        </div>
        <div className="sm:col-span-2"><Input label="Logradouro" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
        <Input label="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} />
        
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />
        <div className="sm:col-span-2"><Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        
        <div className="sm:col-span-2 flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto do Estabelecimento</label>
          <div className="flex items-center gap-4">
            <img src={photo || "https://via.placeholder.com/150"} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-sm" />
            <label className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Carregar nova foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        <div className="sm:col-span-2 border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-amber-500" />
              <h3 className="font-display font-bold text-neutral-900 dark:text-white">Gerenciamento de Posicionamento de Anúncios (600x900px)</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              Plano: {isOnTrial ? 'TESTE GRATUITO (TRIAL)' : (currentPlan?.label ?? currentTier.toUpperCase())}
            </span>
          </div>

          {allowAds ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('freelancers')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeModalTab === 'freelancers' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'}`}
                >
                  <Users className="h-3.5 w-3.5" /> Página de Freelancers {hasFreelancerPermission ? '' : '🔒'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('establishments')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeModalTab === 'establishments' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'}`}
                >
                  <Building2 className="h-3.5 w-3.5" /> Página de Estabelecimentos {hasEstablishmentPermission ? '' : '🔒'}
                </button>
              </div>

              {((activeModalTab === 'freelancers' && !hasFreelancerPermission) ||
                (activeModalTab === 'establishments' && !hasEstablishmentPermission)) ? (
                <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-6 text-center space-y-2">
                  <Lock className="mx-auto h-8 w-8 text-error-400" />
                  <h4 className="font-bold text-white text-sm">Página não contratada</h4>
                  <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                    Você não selecionou nenhuma posição para esta página durante a assinatura. Atualize seu plano para desbloquear.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    📐 Gerencie abaixo as posições (intervalo automático de 4 segundos). Formato obrigatório: <strong>600x900 pixels</strong>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((slotNum) => {
                      const isSlotAllowed = allowedSlotsForCurrentTab.includes(slotNum);
                      const imgUrl = activeImagesList[slotNum - 1] || '';
                      const linkUrl = activeLinksList[slotNum - 1] || '';
                      const slotLabelName = SLOT_NAMES[slotNum - 1];

                      return (
                        <div key={slotNum} className={`flex flex-col gap-3 p-3 rounded-xl border ${isSlotAllowed ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800' : 'border-neutral-800 bg-neutral-950 opacity-60'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-300">{slotLabelName} {isSlotAllowed ? '' : '(Não contratado)'}</span>
                            {imgUrl && isSlotAllowed && (
                              <button type="button" onClick={() => handleRemoveAdSlot(slotNum)} className="text-xs text-red-500 hover:underline flex items-center gap-1 font-medium">
                                <Trash2 className="h-3 w-3" /> Remover
                              </button>
                            )}
                          </div>

                          {isSlotAllowed ? (
                            <div className="space-y-3">
                              <div className="h-28 w-full rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center overflow-hidden">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={slotLabelName} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-[10px] text-neutral-500">Sem imagem</span>
                                )}
                              </div>

                              <div className="relative">
                                <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                                <input 
                                  type="text" 
                                  placeholder="Link (https://...)" 
                                  value={linkUrl}
                                  onChange={(e) => handleLinkChange(slotNum, e.target.value)}
                                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 py-1 pl-7 pr-2 text-[11px] text-neutral-800 dark:text-neutral-100"
                                />
                              </div>

                              <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-[11px] transition">
                                <Upload className="h-3.5 w-3.5" />
                                <span>{imgUrl ? 'Substituir (600x900)' : 'Carregar (600x900)'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAddOrUpdateAdForSlot(e, slotNum)} />
                              </label>
                            </div>
                          ) : (
                            <div className="py-8 text-center">
                              <Lock className="mx-auto h-6 w-6 text-neutral-600 mb-1" />
                              <span className="text-[10px] text-neutral-500">Posição não incluída no seu plano atual.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40 text-center">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Seu plano atual não inclui o recurso de exibição de anúncios e propagandas.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
