import { Shield, ArrowLeft, FileText, ScrollText, Fingerprint, Lock, Scale, Gavel } from 'lucide-react';
import { useApp } from '@/AppContext';
import type { VipPlan, EstVipPlan } from '@/types';

export function TermsPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          {onBack && (
            <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-500" />
            <h1 className="font-display text-lg font-bold text-neutral-900 dark:text-white">Termos de Uso</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-500/15">
              <Shield className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-neutral-900 dark:text-white">FreelaAgora</h2>
              <p className="text-sm text-neutral-400">Termos e Condições de Uso da Plataforma — Versão 1.9</p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            <Clause icon={ScrollText} title="CLÁUSULA PRIMEIRA – DO OBJETO">
              <p><strong>1.1.</strong> O FreelaAgora é um software de aproximação logística e de negócios entre Estabelecimentos e Freelancers.</p>
            </Clause>

            <Clause icon={Fingerprint} title="CLÁUSULA SEGUNDA – REGISTRO E DOCUMENTOS">
              <p><strong>2.1.</strong> O acesso exige cadastro completo com CPF/CNPJ e endereço comercial válidos.</p>
            </Clause>

            <Clause icon={Lock} title="CLÁUSULA TERCEIRA – PRIVACIDADE">
              <p><strong>3.1.</strong> Dados de contato permanecem ocultos até a confirmação do pagamento de custódia pelo gateway parceiro.</p>
            </Clause>

            <Clause icon={Scale} title="CLÁUSULA QUARTA – DOS PLANOS DE ASSINATURA, RECURSOS E TAXAS">
              <p><strong>4.1.</strong> Parametrização Dinâmica: mensalidades, taxas de intermediação, limites de categorias e níveis de destaque são definidos e alterados dinamicamente via Painel Administrativo, integrando-se automaticamente a este contrato conforme os valores vigentes no ato da transação.</p>
              <p className="mt-2"><strong>4.2.</strong> O desbloqueio de contatos exige a compensação bancária integral pelo gateway.</p>
              <p className="mt-2"><strong>4.3.</strong> Cancelamentos por falta do Freelancer geram estorno integral na carteira do Estabelecimento em até 24h úteis.</p>
              <p className="mt-2"><strong>4.4.</strong> Tentativas de burlar o sistema de pagamentos geram bloqueio imediato e multa.</p>
              <p className="mt-2"><strong>4.5.</strong> A plataforma é isenta de responsabilidade por falhas técnicas, instabilidades ou atrasos operados pelo gateway de pagamento.</p>
              <div className="mt-4">
                <DynamicPlansTable />
              </div>
            </Clause>

            <Clause icon={Shield} title="CLÁUSULA QUINTA – ISENÇÃO DE RESPONSABILIDADE TRABALHISTA E CIVIL">
              <p><strong>5.1.</strong> A relação entre as partes é estritamente civil, sem qualquer vínculo empregatício ou subordinação.</p>
              <p className="mt-2"><strong>5.2.</strong> O FreelaAgora é isento de qualquer responsabilidade por atos, omissões, litígios, acidentes ou danos causados por usuários.</p>
              <p className="mt-2"><strong>5.3.</strong> A plataforma emite Nota Fiscal apenas sobre a sua taxa de intermediação. O valor da diária é de responsabilidade tributária do prestador.</p>
              <p className="mt-2"><strong>5.4.</strong> O usuário causador de litígio judicial obriga-se a requerer a exclusão da plataforma do polo passivo ou arcar com todos os custos de defesa.</p>
            </Clause>

            <Clause icon={Gavel} title="CLÁUSULA SEXTA – ASSINATURA ELETRÔNICA">
              <p><strong>6.1.</strong> O clique em 'Aceito' registra o IP e metadados como assinatura digital vinculante e jurídica.</p>
            </Clause>
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800">
              <Fingerprint className="h-4 w-4 text-neutral-400" />
              <p className="text-xs text-neutral-500">
                Versão <strong>v1.9</strong> · FreelaAgora Tecnologia Ltda. · Assinatura digital auditável.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DynamicPlansTable() {
  const { data } = useApp();
  return (
    <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <h3 className="font-display text-lg font-bold mb-4 text-neutral-900 dark:text-white">TABELA VIGENTE DE BENEFÍCIOS E PLANOS</h3>
      <p className="text-xs text-neutral-500 mb-6">
        Os benefícios abaixo são carregados em tempo real conforme a configuração ativa no Painel Administrativo.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h4 className="font-display text-base font-bold text-primary-600 dark:text-primary-400 mb-3">Freelancers</h4>
          <div className="space-y-4">
            {data.vipPlans.map((plan: VipPlan) => (
              <div key={plan.tier} className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="font-bold text-neutral-900 dark:text-white">{plan.label}</p>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 list-disc list-inside space-y-1">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <h4 className="font-display text-base font-bold text-primary-600 dark:text-primary-400 mb-3">Estabelecimentos</h4>
          <div className="space-y-4">
            {data.estVipPlans.map((plan: EstVipPlan) => (
              <div key={plan.tier} className="p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <p className="font-bold text-neutral-900 dark:text-white">{plan.label}</p>
                <ul className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 list-disc list-inside space-y-1">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Clause({ icon: Icon, title, children }: { icon: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Icon className="h-4 w-4 text-primary-500" />
        </div>
        <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      <div className="ml-10 space-y-1">{children}</div>
    </section>
  );
}
