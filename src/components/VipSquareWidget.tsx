import { Crown } from 'lucide-react';

export function VipSquareWidget({ pageType = 'freelancers' }: { pageType?: 'freelancers' | 'establishments' }) {
  // Componente agora é estático. 
  // Sem chamadas ao data.users ou logic de anúncios, economizando banda.
  
  return (
    <div className="relative block w-full aspect-[4/1] max-h-[160px] overflow-hidden rounded-2xl border border-primary-500/20 bg-gradient-to-r from-primary-900 to-primary-700 shadow-lg p-6 flex items-center justify-between">
      <div>
        <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Crown className="h-6 w-6 text-warning-400" />
          Destaque seu perfil
        </h3>
        <p className="text-sm text-primary-100">
          {pageType === 'freelancers' 
            ? 'Aumente suas chances de ser contratado com o plano VIP.' 
            : 'Ganhe visibilidade e reduza taxas com nossa assinatura empresarial.'}
        </p>
      </div>
      <div className="hidden sm:block">
        <span className="text-white/50 font-bold text-4xl">VIP</span>
      </div>
    </div>
  );
}
