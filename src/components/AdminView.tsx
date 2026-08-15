function VipPlanEditor({ plan, onUpdate, onRemove, isEst }: {
  plan: VipPlan | EstVipPlan;
  onUpdate: (patch: Partial<VipPlan> | Partial<EstVipPlan>) => void;
  onRemove: () => void;
  isEst: boolean;
}) {
  const { notify } = useToast();
  const [expanded, setExpanded] = useState(false);
  const canDelete = plan.tier !== 'free' && plan.tier !== 'trial';
  const estPlan = isEst ? (plan as EstVipPlan) : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-left">
          <Crown className={`h-4 w-4 ${getPlanTierColor(plan.tier)}`} />
          <span className="font-semibold text-neutral-900 dark:text-white">{plan.label}</span>
          <Badge tone={plan.tier === 'free' ? 'neutral' : 'vip'}>{plan.tier.toUpperCase()}</Badge>
        </button>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}><Pencil className="h-3.5 w-3.5" /></Button>
          {canDelete && <Button size="sm" variant="ghost" className="text-error-500" onClick={() => { if (confirm(`Remover o plano ${plan.label}? Usuários neste plano voltarão ao Gratuito.`)) { onRemove(); notify('Plano removido', 'warning'); } }}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nome do plano" value={plan.label} onChange={(e) => onUpdate({ label: e.target.value })} />
            {!isEst && <Input label="Máx. categorias (999 = ilimitado)" type="number" value={String((plan as VipPlan).maxCategories)} onChange={(e) => onUpdate({ maxCategories: Number(e.target.value) || 0 } as Partial<VipPlan>)} />}
            {isEst && (
              <>
                <Input label="Taxa de intermediação (%)" type="number" step="0.5" value={String((plan as EstVipPlan).intermediationFee)} onChange={(e) => onUpdate({ intermediationFee: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
                <Input label="Máx. vagas semanais (999 = ilimitado)" type="number" value={String((plan as EstVipPlan).maxActiveJobs ?? 2)} onChange={(e) => onUpdate({ maxActiveJobs: Number(e.target.value) || 0 } as Partial<EstVipPlan>)} />
              </>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Preço mensal (R$)" type="number" value={String(plan.prices.monthly)} onChange={(e) => onUpdate({ prices: { ...plan.prices, monthly: Number(e.target.value) || 0 } })} />
            <Input label="Preço semestral (R$)" type="number" value={String(plan.prices.semestral)} onChange={(e) => onUpdate({ prices: { ...plan.prices, semestral: Number(e.target.value) || 0 } })} />
            <Input label="Preço anual (R$)" type="number" value={String(plan.prices.annual)} onChange={(e) => onUpdate({ prices: { ...plan.prices, annual: Number(e.target.value) || 0 } })} />
          </div>

          {/* Novos campos para configurar a porcentagem de desconto do Semestral e Anual */}
          <div className="grid gap-3 sm:grid-cols-2 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <Input 
              label="Desconto Semestral (%)" 
              type="number" 
              value={String((plan as EstVipPlan).discountSemestralPercent ?? 0)} 
              onChange={(e) => onUpdate({ discountSemestralPercent: Number(e.target.value) || 0 } as any)} 
              placeholder="Ex: 10"
            />
            <Input 
              label="Desconto Anual (%)" 
              type="number" 
              value={String((plan as EstVipPlan).discountAnnualPercent ?? 0)} 
              onChange={(e) => onUpdate({ discountAnnualPercent: Number(e.target.value) || 0 } as any)} 
              placeholder="Ex: 20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Benefícios (um por linha)</label>
            <textarea value={plan.features.join('\n')} onChange={(e) => onUpdate({ features: e.target.value.split('\n').filter(Boolean) })} rows={4} className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
          </div>
        </div>
      )}
    </div>
  );
}
