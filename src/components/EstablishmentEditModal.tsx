import { useState } from 'react';
import { Check, Upload, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
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

  // Gerenciamento de Anúncios e Links do Estabelecimento (Correção aplicada aqui)
  const [adImages, setAdImages] = useState<string[]>((establishment.homeAds || establishment.adImages) ?? []);
  const [adLinks, setAdLinks] = useState<string[]>(establishment.homeLinks ?? []);
  const nearbyAds = filterAdsByRadius(data.users, establishment);

  // Identificar se o plano atual permite anúncios e qual o limite
  const isOnTrial = establishment.trialEndsAt ? new Date(establishment.trialEndsAt) > new Date() : false;
  const currentTier = isOnTrial ? 'trial' : (establishment.estVipTier ?? 'free');
  const currentPlan = data.estVipPlans.find((p) => p.tier === currentTier);
  const allowAds = currentPlan?.allowAds ?? false;
  const maxAds = currentPlan?.maxAds ?? 0;

  // Função para buscar CEP na API ViaCEP e converter em coordenadas para o raio de 60km
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

          // Busca automática de Lat/Lng via Nominatim (OpenStreetMap) para o raio de 60km funcionar
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${newStreet}, ${newCity}, ${newState}, Brazil`)}`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setLat(parseFloat(geoData[0].lat));
              setLng(parseFloat(geoData[0].lon));
            }
          } catch (geoErr) {
            // Se falhar a geolocalização exata, prossegue sem travar
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

  const handleAddAdImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (adImages.length >= maxAds) {
      notify(`Seu plano atual (${currentPlan?.label ?? currentTier.toUpperCase()}) permite no máximo ${maxAds} anúncio(s). Faça upgrade para VIP superior para adicionar mais!`, 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAdImages((prev) => [...prev, reader.result as string]);
      setAdLinks((prev) => [...prev, '']);
      notify('Imagem de anúncio adicionada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAdImage = (index: number) => {
    setAdImages((prev) => prev.filter((_, i) => i !== index));
    setAdLinks((prev) => prev.filter((_, i) => i !== index));
    notify('Anúncio removido', 'info');
  };

  const handleLinkChange = (index: number, val: string) => {
    setAdLinks((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSave = () => {
    if (allowAds && adImages.length > maxAds) {
      notify(`A quantidade de anúncios excede o limite do seu plano (${maxAds}).`, 'warning');
      return;
    }

    updateUser(establishment.id, { 
      name, 
      photo, 
      establishmentType, 
      address: { ...establishment.address, cep, street, neighborhood, city, state, lat, lng }, 
      phone, 
      whatsapp, 
      email, 
      cnpj,
      homeAds: allowAds ? adImages : [],
      adImages: allowAds ? adImages : [],
      homeLinks: allowAds ? adLinks : []
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
            // Alimentação & Gastronomia
            'Bar & Restaurante', 'Restaurante', 'Bar', 'Lanchonete / Fast Food', 'Buffet & Eventos', 'Padaria & Confeitaria', 'Pizzaria', 'Churrascaria', 'Cafeteria & Barista', 'Cervejaria & Choperia', 'Sorveteria & Gelateria', 'Cozinha Industrial / Coletiva',
            // Hotelaria & Turismo
            'Hotel', 'Pousada', 'Resort', 'Hostel', 'Casa de Shows & Eventos', 'Espaço de Festas',
            // Comércio & Varejo
            'Supermercado & Hipermercado', 'Loja de Shopping / Varejo', 'Farmácia & Perfumaria', 'Comércio de Hortifrúti', 'Loja de E-commerce / Centro de Distribuição', 'Posto de Combustíveis & Conveniência',
            // Saúde, Clínicas & Bem-Estar
            'Clínica Médica / Home Care', 'Clínica Odontológica', 'Salão de Beleza & Barbearia', 'Estúdio de Estética & Spa', 'Academia & Centro Esportivo', 'Clínica Veterinária & Pet Shop',
            // Construção, Reformas & Imobiliário
            'Construtora & Incorporadora', 'Empresa de Engenharia & Arquitetura', 'Loja de Materiais de Construção', 'Condomínio Residencial / Predial', 'Administradora de Imóveis',
            // Escritórios & Serviços Profissionais
            'Escritório de Advocacia', 'Escritório de Contabilidade', 'Agência de Marketing & Publicidade', 'Empresa de TI / Tecnologia', 'Consultoria & Gestão',
            // Logística, Indústria & Agronegócio
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
              <h3 className="font-display font-bold text-neutral-900 dark:text-white">Meus Anúncios / Banners e Links</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {adImages.length} de {maxAds} permitidos ({currentPlan?.label ?? currentTier.toUpperCase()})
            </span>
          </div>

          {allowAds ? (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Adicione imagens verticais (600x900) e os respectivos links de redirecionamento. Ao clicar na arte no carrossel, o link abrirá em outra aba.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adImages.map((imgUrl, index) => (
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
                            value={adLinks[index] || ''}
                            onChange={(e) => handleLinkChange(index, e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 py-1.5 pl-8 pr-2.5 text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <span className="text-[10px] text-neutral-400 block">Insira o link completo onde o cliente deve ir ao clicar.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {adImages.length < maxAds && (
                <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer p-4 transition-colors">
                  <Upload className="h-4 w-4 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Adicionar novo banner de anúncio (600x900)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddAdImage} />
                </label>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40 text-center">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Seu plano atual não inclui o recurso de exibição de anúncios e propagandas.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Faça upgrade para um plano VIP elegível para divulgar seu estabelecimento na página inicial!
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
