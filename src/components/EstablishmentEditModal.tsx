import { useState } from 'react';
import { Check, Upload, Trash2, Image as ImageIcon, Link as LinkIcon, Lock, Home, Users, Building2 } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { maskCNPJ, maskPhone, maskCEP, filterAdsByRadius } from '@/utils';

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

  // Abas de Gerenciamento por Local dentro do Modal
  const [activeModalTab, setActiveModalTab] = useState<'home' | 'freelancers' | 'establishments'>('home');

  // Permissões de locais contratados no plano VIP
  const hasHomePermission = establishment.includeHomeAd ?? true;
  const hasFreelancerPermission = establishment.includeFreelancerAd ?? false;
  const hasEstablishmentPermission = establishment.includeEstablishmentAd ?? false;

  // Gerenciamento de Anúncios e Links por Local
  const [homeImages, setHomeImages] = useState<string[]>((establishment.homeAds || establishment.adImages) ?? []);
  const [homeLinks, setHomeLinks] = useState<string[]>(establishment.homeLinks ?? []);

  const [freelancerImages, setFreelancerImages] = useState<string[]>(establishment.freelancerAds ?? []);
  const [freelancerLinks, setFreelancerLinks] = useState<string[]>(establishment.freelancerLinks ?? []);

  const [establishmentImages, setEstablishmentImages] = useState<string[]>(establishment.establishmentAds ?? []);
  const [establishmentLinks, setEstablishmentLinks] = useState<string[]>(establishment.establishmentLinks ?? []);

  const nearbyAds = filterAdsByRadius(data.users, establishment);

  // Identificar se o plano atual permite anúncios e qual o limite
  const isOnTrial = establishment.trialEndsAt ? new Date(establishment.trialEndsAt) > new Date() : false;
  const currentTier = isOnTrial ? 'trial' : (establishment.estVipTier ?? 'free');
  const currentPlan = data.estVipPlans.find((p) => p.tier === currentTier);
  const allowAds = currentPlan?.allowAds ?? false;
  const maxAds = currentPlan?.maxAds ?? 0;

  // Selecionar listas ativas com base na aba do modal
  const activeImagesList = activeModalTab === 'home' ? homeImages : activeModalTab === 'freelancers' ? freelancerImages : establishmentImages;
  const activeLinksList = activeModalTab === 'home' ? homeLinks : activeModalTab === 'freelancers' ? freelancerLinks : establishmentLinks;

  const setActiveImages = (newImgs: string[]) => {
    if (activeModalTab === 'home') setHomeImages(newImgs);
    else if (activeModalTab === 'freelancers') setFreelancerImages(newImgs);
    else setEstablishmentImages(newImgs);
  };

  const setActiveLinks = (newLinks: string[]) => {
    if (activeModalTab === 'home') setHomeLinks(newLinks);
    else if (activeModalTab === 'freelancers') setFreelancerLinks(newLinks);
    else setEstablishmentLinks(newLinks);
  };

  // Função para buscar CEP na API ViaCEP
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

          setStreet(newStreet);
          setNeighborhood(newNeighborhood);
          setCity(newCity);
          setState(newState);

          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${newStreet}, ${newCity}, ${newState}, Brazil`)}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setLat(parseFloat(geoData[0].lat));
              setLng(parseFloat(geoData[0].lon));
            }
          } catch (geoErr) {
            // Ignora erro de geolocalização se houver falha
          }

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
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validação estrita de dimensões 600x900 pixels
  const handleAddAdImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeImagesList.length >= maxAds) {
      notify(`Seu plano atual (${currentPlan?.label ?? currentTier.toUpperCase()}) permite no máximo ${maxAds} anúncio(s) por local.`, 'warning');
      return;
    }

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

        setActiveImages([...activeImagesList, reader.result as string]);
        setActiveLinks([...activeLinksList, '']);
        notify('Imagem de anúncio adicionada com sucesso! (600x900px)', 'success');
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        notify('Erro ao processar o arquivo de imagem.', 'error');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAdImage = (index: number) => {
    setActiveImages(activeImagesList.filter((_, i) => i !== index));
    setActiveLinks(activeLinksList.filter((_, i) => i !== index));
    notify('Anúncio removido', 'info');
  };

  const handleLinkChange = (index: number, val: string) => {
    const next = [...activeLinksList];
    next[index] = val;
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
      homeAds: allowAds ? homeImages : [],
      adImages: allowAds ? homeImages : [],
      homeLinks: allowAds ? homeLinks : [],
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
          <Button variant="ghost" fullWidth onClose={() => onClose()}>Cancelar</Button>
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
              <h3 className="font-display font-bold text-neutral-900 dark:text-white">Gerenciamento de Anúncios por Local</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              Limite: {maxAds} por local · Plano: {currentPlan?.label ?? currentTier.toUpperCase()}
            </span>
          </div>

          {allowAds ? (
            <div className="space-y-4">
              {/* Abas de Navegação por Local */}
              <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('home')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeModalTab === 'home' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'}`}
                >
                  <Home className="h-3.5 w-3.5" /> Carrossel Home {hasHomePermission ? '' : '🔒'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('freelancers')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeModalTab === 'freelancers' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'}`}
                >
                  <Users className="h-3.5 w-3.5" /> Pág. Freelancers {hasFreelancerPermission ? '' : '🔒'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('establishments')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeModalTab === 'establishments' ? 'bg-amber-500 text-neutral-950 shadow' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'}`}
                >
                  <Building2 className="h-3.5 w-3.5" /> Pág. Estabelecimentos {hasEstablishmentPermission ? '' : '🔒'}
                </button>
              </div>

              {/* Trava caso não tenha permissão para o local selecionado */}
              {((activeModalTab === 'home' && !hasHomePermission) ||
                (activeModalTab === 'freelancers' && !hasFreelancerPermission) ||
                (activeModalTab === 'establishments' && !hasEstablishmentPermission)) ? (
                <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-6 text-center space-y-2">
                  <Lock className="mx-auto h-8 w-8 text-error-400" />
                  <h4 className="font-bold text-white text-sm">Local não contratado</h4>
                  <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                    Você não adquiriu o direito de exibir anúncios nesta página durante a assinatura do plano. Atualize seu plano para desbloquear.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    📐 Envie imagens estritamente verticais (<strong>600x900 pixels</strong>). Qualquer outra proporção será rejeitada automaticamente.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeImagesList.map((imgUrl, index) => (
                      <div key={index} className="flex flex-col gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-500">Slot #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdImage(index)}
                            className="text-xs text-red-500 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <img src={imgUrl} alt={`Anúncio ${index + 1}`} className="w-20 h-28 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 shrink-0" />
                          <div className="flex-1 space-y-2 w-full">
                            <div className="relative">
                              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                              <input 
                                type="text" 
                                placeholder="Link de redirecionamento (https://...)" 
                                value={activeLinksList[index] || ''}
                                onChange={(e) => handleLinkChange(index, e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 py-1.5 pl-8 pr-2.5 text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <span className="text-[10px] text-neutral-400 block">Link que abre ao clicar no banner.</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeImagesList.length < maxAds && (
                    <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer p-4 transition-colors">
                      <Upload className="h-4 w-4 text-neutral-400" />
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Carregar banner (Exato 600x900px)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAddAdImage} />
                    </label>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40 text-center">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Seu plano atual não inclui o recurso de exibição de anúncios e propagandas.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Faça upgrade para um plano VIP elegível para divulgar seu estabelecimento!
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
