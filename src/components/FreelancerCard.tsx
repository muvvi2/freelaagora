import { useState } from 'react';
import { MapPin, Clock, Crown, Pencil, Trash2, Check, DollarSign, Briefcase, Lock, Eye } from 'lucide-react';
import { useApp } from '@/AppContext';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Rating } from './ui/Rating';
import { Input, Textarea } from './ui/Field';
import { formatCurrency, getPlan, countAvailableSlots, maskCPF, maskPhone } from '@/utils';
import { CATEGORIES } from '@/mockData';
import type { User } from '@/types';

interface Props {
  freelancer: User;
  onHire?: (f: User) => void;
  onView?: (f: User) => void;
  showAdminActions?: boolean;
  showEdit?: boolean;
  distanceKm?: number;
}

export function FreelancerCard({ freelancer: f, onHire, onView, showAdminActions, showEdit = true, distanceKm }: Props) {
  const { updateUser, deleteEntity, data, currentUser } = useApp();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const plan = getPlan(f.vipTier ?? 'free', data.vipPlans);

  // Verifica se o usuário atual (estabelecimento) possui contrato pago, em serviço ou concluído com este freelancer
  const hasActiveContract = currentUser ? data.contracts.some(
    (c) => c.freelancerId === f.id && c.establishmentId === currentUser.id && (c.status === 'paid' || c.status === 'checked_in' || c.status === 'completed')
  ) : false;

  // Se for o próprio freelancer vendo seu card, ou se for admin, ou se houver contrato pago, mostra a identidade. Caso contrário, oculta.
  const isSelf = currentUser?.id === f.id;
  const showIdentity = isSelf || showAdminActions || hasActiveContract;

  return (
    <>
      <div className={`group relative flex flex-col gap-4 rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:bg-neutral-900 ${f.vipTier === 'vip3' ? 'border-warning-300/60 shadow-glow-vip dark:border-warning-500/30' : f.vipTier === 'vip2' ? 'border-secondary-300/50 dark:border-secondary-500/30' : f.vipTier === 'vip1' ? 'border-primary-200 dark:border-primary-500/30' : 'border-neutral-200 dark:border-neutral-800'}`}>
        {f.vipTier && f.vipTier !== 'free' && (
          <div className="absolute -top-2.5 left-4">
            <Badge tone="vip"><Crown className="h-3 w-3" /> {plan.label}</Badge>
          </div>
        )}

        <div className="flex items-start gap-4">
          {showIdentity ? (
            <Avatar src={f.photo} alt={f.name} size={64} ring={f.vipTier && f.vipTier !== 'free' ? 'vip' : 'neutral'} vipBadge={f.vipTier === 'vip2' || f.vipTier === 'vip3'} />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
              <Lock className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-neutral-900 dark:text-white">
              {showIdentity ? f.name : 'Profissional Confidencial'}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Rating value={f.rating ?? 0} count={f.reviewsCount ?? 0} />
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400"><Briefcase className="h-3.5 w-3.5" /> {f.completedShifts ?? 0} turnos</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> 
                {showIdentity ? `${f.address.city}${distanceKm != null && distanceKm < 9999 ? ` · ${distanceKm < 1 ? '<1' : Math.round(distanceKm)}km` : ''}` : 'Região Metropolitana'}
              </span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {countAvailableSlots(f.availability)} horários</span>
            </div>
          </div>
        </div>

        {f.categories && f.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.categories.slice(0, 4).map((cid) => {
              const cat = CATEGORIES.find((c) => c.id === cid);
              return <Badge key={cid} tone="primary">{cat?.label ?? cid}</Badge>;
            })}
            {f.categories.length > 4 && <Badge tone="neutral">+{f.categories.length - 4}</Badge>}
          </div>
        )}

        <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">{f.bio ?? 'Sem descrição.'}</p>

        {/* Locked contact preview */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Lock className="h-3.5 w-3.5" /> {showIdentity ? 'Contato liberado' : 'Nome e contato liberados após contratação e pagamento'}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div>
            <p className="text-xs text-neutral-400">Diária</p>
            <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(f.dailyRate ?? 0)}</p>
            <p className="text-xs text-neutral-400">ou {formatCurrency(f.hourlyRate ?? 0)}/h</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {onView && <Button size="sm" variant="outline" onClick={() => onView(f)}><Eye className="h-3.5 w-3.5" /> Ver perfil</Button>}
            {onHire && <Button size="sm" onClick={() => onHire(f)}><DollarSign className="h-4 w-4" /> Contratar</Button>}
            {showEdit && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>}
          </div>
        </div>

        {showAdminActions && (
          <div className="flex items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <Button size="sm" variant="ghost" className="text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10" onClick={() => setConfirmDelete(true)}><Trash2 className="h-3.5 w-3.5" /> Excluir</Button>
          </div>
        )}
      </div>

      {editing && (
        <FreelancerEditModal freelancer={f} open={editing} onClose={() => setEditing(false)} onSave={(patch) => { updateUser(f.id, patch); setEditing(false); notify('Perfil atualizado'); }} />
      )}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir freelancer" size="sm"
        footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>Cancelar</Button><Button variant="danger" fullWidth onClick={() => { deleteEntity(f.id); setConfirmDelete(false); notify('Freelancer excluído', 'warning'); }}><Trash2 className="h-4 w-4" /> Excluir</Button></div>}>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Excluir <strong>{f.name}</strong>?</p>
      </Modal>
    </>
  );
}

export function FreelancerEditModal({ freelancer, open, onClose, onSave }: { freelancer: User; open: boolean; onClose: () => void; onSave: (patch: Partial<User>) => void }) {
  const [name, setName] = useState(freelancer.name);
  const [photo, setPhoto] = useState(freelancer.photo);
  const [bio, setBio] = useState(freelancer.bio ?? '');
  const [dailyRate, setDailyRate] = useState(String(freelancer.dailyRate ?? 0));
  const [hourlyRate, setHourlyRate] = useState(String(freelancer.hourlyRate ?? 0));
  const [pixKey, setPixKey] = useState(freelancer.pixKey ?? '');
  const [city, setCity] = useState(freelancer.address.city);
  const [state, setState] = useState(freelancer.address.state);
  const [cpf, setCpf] = useState(freelancer.cpf ?? '');
  const [phone, setPhone] = useState(freelancer.phone);
  const [whatsapp, setWhatsapp] = useState(freelancer.whatsapp);

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" subtitle="Todos os campos são editáveis em tempo real" size="lg"
      footer={<div className="flex gap-2"><Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button><Button fullWidth onClick={() => onSave({ name, photo, bio, dailyRate: Number(dailyRate) || 0, hourlyRate: Number(hourlyRate) || 0, pixKey, address: { ...freelancer.address, city, state }, cpf, phone, whatsapp })}><Check className="h-4 w-4" /> Salvar</Button></div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} />
        <Input label="CPF" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} />
        <Input label="Telefone (oculto)" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        <Input label="WhatsApp (oculto)" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} />
        <Input label="Diária (R$)" type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
        <Input label="Hora (R$)" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
        <div className="sm:col-span-2"><Input label="Chave PIX" value={pixKey} onChange={(e) => setPixKey(e.target.value)} /></div>
        <div className="sm:col-span-2"><Input label="URL da foto" value={photo} onChange={(e) => setPhoto(e.target.value)} /></div>
        <div className="sm:col-span-2"><Textarea label="Biografia" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      </div>
    </Modal>
  );
}
