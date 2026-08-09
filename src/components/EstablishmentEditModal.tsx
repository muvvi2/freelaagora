import { useState } from 'react';
import { Check, Upload, Trash2, ImageIcon } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { maskCNPJ, maskPhone, maskCEP } from '@/utils';

export function EstablishmentEditModal({ establishment, open, onClose }: { establishment: User; open: boolean; onClose: () => void }) {
  const { updateUser, data } = useApp();
  const { notify } = useToast();
  
  const [name, setName] = useState(establishment.name);
  const [photo, setPhoto] = useState(establishment.photo);
  const [establishmentType, setEstablishmentType] = useState(establishment.establishmentType ?? 'Bar & Restaurante');
  const [cep, setCep] = useState(establishment.address.cep ?? '');
  const [street, setStreet] = useState(establishment.address.street);
  const [neighborhood, setNeighborhood] = useState(establishment.address.neighborhood ?? '');
  const [city, setCity] = useState(establishment.address.city);
  const [state, setState] = useState(establishment.address.state);
  const [phone, setPhone] = useState(establishment.phone);
  const [whatsapp, setWhatsapp] = useState(establishment.whatsapp);
  const [email, setEmail] = useState(establishment.email);
  const [cnpj, setCnpj] = useState(establishment.cnpj ?? '');

  // Lógica de Anúncios (Plano/Trial)
  const isOnTrial = establishment.trialEndsAt ? new Date(establishment.trialEndsAt) > new Date() : false;
  const currentPlan = data.estVipPlans.find((p) => p.tier === (isOnTrial ? 'trial' : (establishment.estVipTier ?? 'free'))) ?? data.estVipPlans[0];
  const allowAds = (currentPlan?.allowAds ?? false) || isOnTrial;

  // Uma única imagem para os 2 lugares (Freela e Estab)
  const [adImg, setAdImg] = useState(establishment.freelancerAds?.[0] ?? establishment.establishmentAds?.[0] ?? '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        if (img.width !== 600 || img.height !== 900) {
          notify('Erro: O banner deve ter exatamente 600x900px.', 'error');
          return;
        }
        setAdImg(reader.result as string);
        notify('Banner carregado para a Página de Freelancers e Estabelecimentos!', 'success');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUser(establishment.id, { 
      name, photo, establishmentType, 
      address: { ...establishment.address, cep, street, neighborhood, city, state }, 
      phone, whatsapp, email, cnpj,
      // Publica em TODOS os slots dos 2 lugares (Freela e Estab) de uma só vez
      includeFreelancerAd: allowAds,
      includeEstablishmentAd: allowAds,
      allowedFreelancerSlots: allowAds ? [1, 2, 3] : [],
      allowedEstablishmentSlots: allowAds ? [1, 2, 3] : [],
      freelancerAds: allowAds && adImg ? [adImg, adImg, adImg] : [],
      freelancerLinks: allowAds ? ['', '', ''] : [],
      establishmentAds: allowAds && adImg ? [adImg, adImg, adImg] : [],
      establishmentLinks: allowAds ? ['', '', ''] : []
    }); 
    onClose(); 
    notify('Configurações salvas com sucesso!'); 
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar estabelecimento" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={handleSave}><Check className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome do Negócio" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} />
        <div className="sm:col-span-2"><Input label="CEP" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} /></div>
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} />
        <Input label="Telefone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />

        <div className="sm:col-span-2 border-t border-neutral-200 pt-4 mt-2">
          <h3 className="font-bold mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-amber-500" /> Anúncios (Aparecerá na página de Freela e Estabelecimentos - 600x900px)</h3>
          
          {allowAds ? (
            <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50 flex flex-col items-center">
              <p className="text-xs font-bold mb-3 uppercase tracking-wider text-neutral-500 text-center">
                Banner Único (Será publicado automaticamente no Topo, Centro e Rodapé dos DOIS lugares)
              </p>
              
              {adImg ? (
                <div className="relative group">
                  <img src={adImg} className="h-40 w-auto border-2 border-amber-500 rounded object-cover" />
                  <button onClick={() => setAdImg('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
                </div>
              ) : (
                <label className="cursor-pointer border-2 border-dashed border-neutral-300 w-full h-32 flex flex-col items-center justify-center rounded-lg hover:border-amber-500">
                  <Upload className="h-6 w-6 text-neutral-400" />
                  <span className="text-xs mt-2 font-medium">Upload Imagem (600x900)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">Seu plano não inclui anúncios.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
