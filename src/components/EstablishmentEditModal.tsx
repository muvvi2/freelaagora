import { useState } from 'react';
import { Check } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { maskCNPJ, maskPhone, maskCEP } from '@/utils';

export function EstablishmentEditModal({ establishment, open, onClose }: { establishment: User; open: boolean; onClose: () => void }) {
  const { updateUser } = useApp();
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

  const handleSave = () => {
    updateUser(establishment.id, { 
      name, photo, establishmentType, 
      address: { ...establishment.address, cep, street, neighborhood, city, state }, 
      phone, whatsapp, email, cnpj
    }); 
    onClose(); 
    notify('Estabelecimento atualizado com sucesso!'); 
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
      </div>
    </Modal>
  );
}
