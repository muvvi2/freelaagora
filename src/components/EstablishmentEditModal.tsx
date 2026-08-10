import { MapPin, Lock, Briefcase, Crown, ShieldCheck, Diamond, MessageCircle, Phone, DollarSign, User as UserIcon, Globe } from 'lucide-react';
import { useApp } from '@/AppContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { Rating } from './ui/Rating';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { formatCurrency, getPlan, countAvailableSlots } from '@/utils';
import type { User } from '@/types';

const badgeIcon: Record<string, typeof Crown> = { verified: ShieldCheck, gold: Crown, diamond: Diamond };

export function FreelancerDetailModal({ freelancer: f, open, onClose, onHire }: { freelancer: User; open: boolean; onClose: () => void; onHire: (f: User) => void }) {
  const { reviewsFor, categoryById, data, currentUser } = useApp();
  const reviews = reviewsFor(f.id);
  const plan = getPlan(f.vipTier ?? 'free', data.vipPlans);
  const BadgeIcon = plan.badge ? badgeIcon[plan.badge] : null;

  // Verifica se o estabelecimento logado já possui contrato pago/confirmado com este profissional
  const hasActiveContract = currentUser ? data.contracts.some(
    (c) => c.freelancerId === f.id && c.establishmentId === currentUser.id && (c.status === 'paid' || c.status === 'checked_in' || c.status === 'completed')
  ) : false;

  const isSelf = currentUser?.id === f.id;
  const showIdentity = isSelf || hasActiveContract;

  return (
    <Modal open={open} onClose={onClose} title="Perfil do profissional" size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={onClose}>Fechar</Button>
          <Button fullWidth onClick={() => { onHire(f); onClose(); }}>
            <DollarSign className="h-4 w-4" /> Contratar
          </Button>
        </div>
      }
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        {showIdentity ? (
          <Avatar src={f.photo} alt={f.name} size={80} ring={f.vipTier && f.vipTier !== 'free' ? 'vip' : 'neutral'} vipBadge={f.vipTier === 'vip2' || f.vipTier === 'vip3'} />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
            <Lock className="h-8 w-8" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">
              {showIdentity ? f.name : 'Profissional Confidencial'}
            </h2>
            {showIdentity && BadgeIcon && <BadgeIcon className={`h-5 w-5 ${plan.badge === 'diamond' ? 'text-warning-500' : 'text-secondary-500'}`} />}
          </div>
          
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={f.rating ?? 0} count={f.reviewsCount ?? 0} />
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400"><Briefcase className="h-3.5 w-3.5" /> {f.completedShifts ?? 0} turnos</span>
            {f.gender && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md"><UserIcon className="h-3 w-3" /> {f.gender}</span>}
          </div>
          
          <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1">
              {f.unlimitedKm ? <Globe className="h-3.5 w-3.5 text-primary-500" /> : <MapPin className="h-3.5 w-3.5" />} 
              {showIdentity ? (f.unlimitedKm ? 'KM Livre / Disponível para viagens' : `${f.address?.city}, ${f.address?.state}`) : 'Região Metropolitana'}
            </span>
          </div>
        </div>
      </div>

      {/* VIP badge */}
      {showIdentity && f.vipTier && f.vipTier !== 'free' && (
        <div className="mt-4">
          <Badge tone="vip"><Crown className="h-3 w-3" /> {plan.label}</Badge>
        </div>
      )}

      {/* Bio */}
      {f.bio && <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{f.bio}</p>}

      {/* Categories */}
      {f.categories && f.categories.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Categorias</p>
          <div className="flex flex-wrap gap-1.5">
            {f.categories.map((cid) => {
              const cat = categoryById(cid);
              return <Badge key={cid} tone="primary">{cat?.label ?? cid}</Badge>;
            })}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
          <p className="text-xs text-neutral-400">Diária</p>
          <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(f.dailyRate ?? 0)}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
          <p className="text-xs text-neutral-400">Por hora</p>
          <p className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(f.hourlyRate ?? 0)}</p>
        </div>
      </div>

      {/* Availability grid */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Disponibilidade no calendário</p>
          <span className="text-xs text-neutral-400">{countAvailableSlots(f.availability)} turnos padrão</span>
        </div>
        <AvailabilityCalendar dateAvailability={f.dateAvailability} />
      </div>

      {/* Locked contact */}
      <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-neutral-400" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Contato protegido</p>
        </div>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {showIdentity ? 'Contato liberado para este contrato.' : `O WhatsApp e telefone de ${f.gender === 'Feminino' ? 'a profissional' : 'o profissional'} ficam ocultos até que você confirme uma contratação com pagamento em garantia.`}
        </p>
        <div className="mt-3 flex gap-2 opacity-50">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-400 dark:border-neutral-700">
            <MessageCircle className="h-4 w-4" /> ••••••••••
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-400 dark:border-neutral-700">
            <Phone className="h-4 w-4" /> ••••••••••
          </span>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Avaliações recebidas</p>
          <div className="space-y-2">
            {reviews.slice(0, 4).map((r) => (
              <div key={r.id} className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{r.fromName}</span>
                  <Rating value={r.rating} />
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
