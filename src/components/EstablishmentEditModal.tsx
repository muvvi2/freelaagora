import { useState } from 'react';
import { Check } from 'lucide-react';
import type { User } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { maskCNPJ, maskPhone } from '@/utils';

export function EstablishmentEditModal({ establishment, open, onClose }: { establishment: User; open: boolean; onClose: () => void }) {
  const { updateUser } = useApp();
  const { notify } = useToast();
  const [name, setName] = useState(establishment.name);
  const [photo, setPhoto] = useState(establishment.photo);
  const [establishmentType, setEstablishmentType] = useState(establishment.establishmentType ?? 'Bar & Restaurante');
  const [street, setStreet] = useState(establishment.address.street);
  const [city, setCity] = useState(establishment.address.city);
  const [state, setState] = useState(establishment.address.state);
  const [phone, setPhone] = useState(establishment.phone);
  const [whatsapp, setWhatsapp] = useState(establishment.whatsapp);
  const [email, setEmail] = useState(establishment.email);
  const [cnpj, setCnpj] = useState(establishment.cnpj ?? '');

  return (
    <Modal open={open} onClose={onClose} title="Editar estabelecimento" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={() => { updateUser(establishment.id, { name, photo, establishmentType, address: { ...establishment.address, street, city, state }, phone, whatsapp, email, cnpj }); onClose(); notify('Estabelecimento atualizado'); }}><Check className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <Select label="Tipo" value={establishmentType} onChange={(e) => setEstablishmentType(e.target.value)}>
          {['Bar & Restaurante', 'Buffet & Eventos', 'Restaurante', 'Bar', 'Lanchonete', 'Padaria', 'Casa de Shows', 'Hotel'].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} />
        <div className="sm:col-span-2"><Input label="Logradouro" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} />
        <Input label="Telefone (oculto)" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp (oculto)" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />
        <div className="sm:col-span-2"><Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="sm:col-span-2"><Input label="URL da foto" value={photo} onChange={(e) => setPhoto(e.target.value)} /></div>
      </div>
    </Modal>
  );
}
