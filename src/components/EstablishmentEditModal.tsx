import { useState } from 'react';
import { Check, Upload, Trash2, ImageIcon, Lock, Users, Building2 } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
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

  const [activeModalTab, setActiveModalTab] = useState<'freelancers' | 'establishments'>('freelancers');

  // Lógica: Se tem plano, anúncios estão liberados.
  const isOnTrial = establishment.trialEndsAt ? new Date(establishment.trialEndsAt) > new Date() : false;
  const currentPlan = data.estVipPlans.find((p) => p.tier === (isOnTrial ? 'trial' : (establishment.estVipTier ?? 'free'))) ?? data.estVipPlans[0];
  const allowAds = (currentPlan?.allowAds ?? false) || isOnTrial;

  // Armazenamento global (sempre 3 slots)
  const [freelancerImg, setFreelancerImg] = useState(establishment.freelancerAds?.[0] ?? '');
  const [establishmentImg, setEstablishmentImg] = useState(establishment.establishmentAds?.[0] ?? '');

  const activeImg = activeModalTab === 'freelancers' ? freelancerImg : establishmentImg;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isFreelancerTab: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        if (img.width !== 600 || img.height !== 900) {
          notify('Erro: O banner deve ter 600x900px.', 'error');
          return;
        }
        if (isFreelancerTab) setFreelancerImg(reader.result as string);
        else setEstablishmentImg(reader.result as string);
        notify('Anúncio atualizado para todas as posições!', 'success');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Aplica a mesma imagem para os 3 slots obrigatórios
    const fAds = allowAds && freelancerImg ? [freelancerImg, freelancerImg, freelancerImg] : [];
    const eAds = allowAds && establishmentImg ? [establishmentImg, establishmentImg, establishmentImg] : [];

    updateUser(establishment.id, { 
      name, photo, establishmentType, 
      address: { ...establishment.address, cep, street, neighborhood, city, state }, 
      phone, whatsapp, email, cnpj,
      includeFreelancerAd: allowAds,
      includeEstablishmentAd: allowAds,
      allowedFreelancerSlots: allowAds ? [1, 2, 3] : [],
      allowedEstablishmentSlots: allowAds ? [1, 2, 3] : [],
      freelancerAds: fAds,
      establishmentAds: eAds
    }); 
    onClose(); 
    notify('Estabelecimento atualizado com sucesso!'); 
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar estabelecimento" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={handleSave}><Check className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} />
        {/* ... manter outros campos de texto ... */}

        <div className="sm:col-span-2 border-t border-neutral-200 pt-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-amber-500" /> Gerenciamento de Anúncios (600x900px)</h3>
          
          {allowAds ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setActiveModalTab('freelancers')} className={`px-4 py-2 rounded-lg ${activeModalTab === 'freelancers' ? 'bg-amber-500 text-white' : 'bg-neutral-100'}`}>Freelancers</button>
                <button onClick={() => setActiveModalTab('establishments')} className={`px-4 py-2 rounded-lg ${activeModalTab === 'establishments' ? 'bg-amber-500 text-white' : 'bg-neutral-100'}`}>Estabelecimentos</button>
              </div>

              <div className="p-4 border border-amber-500 rounded-xl bg-neutral-50 text-center">
                <p className="text-xs font-bold mb-2">Banner Principal (Aparecerá no Topo, Centro e Rodapé)</p>
                {activeImg ? (
                  <div className="relative inline-block">
                    <img src={activeImg} className="h-32 w-24 object-cover border-2 border-amber-500 rounded" />
                    <button onClick={() => activeModalTab === 'freelancers' ? setFreelancerImg('') : setEstablishmentImg('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 w-24 border-2 border-dashed border-neutral-300 rounded cursor-pointer hover:border-amber-500">
                    <Upload className="h-6 w-6 text-neutral-400" />
                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, activeModalTab === 'freelancers')} />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Plano não permite anúncios.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
