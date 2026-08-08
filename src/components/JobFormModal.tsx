import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Job, Urgency, User } from '@/types';
import { uid, urgencyLabel } from '@/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Textarea, Select } from './ui/Field';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { CATEGORIES } from '@/mockData';

export function JobFormModal({ open, onClose, editing, establishment }: { open: boolean; onClose: () => void; editing: Job | null; establishment: User }) {
  const { data, addJob, updateJob } = useApp();
  const { notify } = useToast();

  const currentEstablishment = data.users.find((u) => u.id === establishment.id) ?? establishment;

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
      onClose();
    } else {
      // 1. Identifica o tier atual do estabelecimento (ex: 'free', 'vip1', 'vip2', 'vip3')
      const tierKey = currentEstablishment.estVipTier ?? 'free';

      // 2. Busca o limite de vagas diretamente no array global de planos do app para evitar falhas do utilitário
      const matchedPlan = data.estVipPlans?.find((p) => p.tier === tierKey);
      const planMaxJobs = matchedPlan ? matchedPlan.maxActiveJobs : (tierKey === 'free' ? 2 : tierKey === 'vip1' ? 5 : tierKey === 'vip2' ? 10 : 999);

      // 3. Período de teste (Trial) — restringe a 10 vagas no trial
      const isOnTrial = currentEstablishment.trialEndsAt && new Date(currentEstablishment.trialEndsAt) > new Date();
      const effectiveMaxJobs = isOnTrial ? 10 : planMaxJobs;

      // 4. Conta quantas vagas ativas o estabelecimento possui (tudo que não estiver fechado)
      const activeJobsCount = data.jobs.filter((j) => j.establishmentId === currentEstablishment.id && j.status !== 'closed').length;

      // 5. BLOQUEIO SE O LIMITE FOR ATINGIDO
      if (activeJobsCount >= effectiveMaxJobs) {
        notify(`Limite atingido! ${isOnTrial ? 'Seu período de teste permite até 10 vagas ativas.' : `Seu plano atual permite até ${effectiveMaxJobs} vagas ativas.`} Faça um upgrade para o VIP para publicar mais.`, 'error');
        return; 
      }

      const job: Job = {
        id: uid('job'),
        establishmentId: currentEstablishment.id,
        establishmentName: currentEstablishment.name,
        establishmentPhoto: currentEstablishment.photo,
        category,
        title,
        description,
        date: new Date(date).toISOString(),
        startTime,
        hours: Number(hours) || 1,
        value: Number(value) || 0,
        urgency,
        status: 'active',
        city: currentEstablishment.address.city,
        state: currentEstablishment.address.state,
        applicants: [],
        createdAt: new Date().toISOString(),
      };

      addJob(job);
      notify('Vaga urgente publicada no feed!');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar vaga' : 'Publicar vaga urgente'} subtitle="Aparece instantaneamente no feed dos freelancers" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={handleSave}><Check className="h-4 w-4" /> {editing ? 'Salvar' : 'Publicar'}</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Título da vaga" placeholder="Ex: Cobertura de sexta à noite" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        
        <Select label="Categoria da Vaga" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((cat: any) => {
            if (cat.subcategories) {
              return (
                <optgroup key={cat.id || cat.name} label={cat.name || cat.label}>
                  {cat.subcategories.map((sub: any) => (
                    <option key={sub.id || sub} value={sub.id || sub}>
                      {sub.label || sub}
                    </option>
                  ))}
                </optgroup>
              );
            }
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
