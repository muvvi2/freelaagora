import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Job, Urgency, User } from '@/types';
import { uid, urgencyLabel } from '@/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Textarea, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { CATEGORIES } from '@/mockData'; // Certifique-se de que exporta o formato correto

export function JobFormModal({ open, onClose, editing, establishment }: { open: boolean; onClose: () => void; editing: Job | null; establishment: User }) {
  const { addJob, updateJob } = useApp();
  const { notify } = useToast();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState(editing?.category ?? 'garcom');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(editing?.startTime ?? '18:00');
  const [hours, setHours] = useState(String(editing?.hours ?? 6));
  const [value, setValue] = useState(String(editing?.value ?? 200));
  const [urgency, setUrgency] = useState<Urgency>(editing?.urgency ?? 'hoje');

  const handleSave = () => {
    if (!title.trim()) { notify('Informe um título para a vaga', 'warning'); return; }
    if (editing) {
      updateJob(editing.id, { title, category, description, date: new Date(date).toISOString(), startTime, hours: Number(hours) || 1, value: Number(value) || 0, urgency });
      notify('Vaga atualizada');
    } else {
      const job: Job = {
        id: uid('job'),
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        establishmentPhoto: establishment.photo,
        category,
        title,
        description,
        date: new Date(date).toISOString(),
        startTime,
        hours: Number(hours) || 1,
        value: Number(value) || 0,
        urgency,
        status: 'active',
        city: establishment.address.city,
        state: establishment.address.state,
        applicants: [],
        createdAt: new Date().toISOString(),
      };
      addJob(job);
      notify('Vaga urgente publicada no feed!');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar vaga' : 'Publicar vaga urgente'} subtitle="Aparece instantaneamente no feed dos freelancers" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={handleSave}><Check className="h-4 w-4" /> {editing ? 'Salvar' : 'Publicar'}</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Título da vaga" placeholder="Ex: Cobertura de sexta à noite" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        
        {/* Campo de Categoria Atualizado com suporte a Grupos se aplicável */}
        <Select label="Categoria da Vaga" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((cat) => {
            // Se o seu mock usa estrutura de grupo com subcategorias:
            if (cat.subcategories) {
              return (
                <optgroup key={cat.id || cat.name} label={cat.name || cat.label}>
                  {cat.subcategories.map((sub) => (
                    <option key={sub.id || sub} value={sub.id || sub}>
                      {sub.label || sub}
                    </option>
                  ))}
                </optgroup>
              );
            }
            // Fallback para lista simples plana
            return <option key={cat.id} value={cat.id}>{cat.label}</option>;
          })}
        </Select>

        <Select label="Urgência" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
          {(['hoje', 'amanha', 'esta_semana'] as Urgency[]).map((u) => <option key={u} value={u}>{urgencyLabel(u)}</option>)}
        </Select>
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Horário" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <Input label="Duração (horas)" type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} />
        <Input label="Valor (R$)" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
        <div className="sm:col-span-2"><Textarea label="Descrição" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>
    </Modal>
  );
}
