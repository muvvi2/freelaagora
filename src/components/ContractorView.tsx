{/* COLUNA DIREITA: Vagas e Banners intercalados */}
        <aside className="space-y-6">
          
          {/* Cabeçalho e Primeira Vaga */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-bold text-neutral-900 dark:text-white">Minhas vagas</h3>
              <Button size="sm" onClick={() => setJobForm({ open: true, editing: null })}><Plus className="h-4 w-4" /> Publicar</Button>
            </div>
            <div className="space-y-3">
              {myJobs.length === 0 && <p className="py-6 text-center text-sm text-neutral-400">Nenhuma vaga publicada.</p>}
              {myJobs.slice(0, 1).map((j) => <JobCard key={j.id} job={j} variant="manage" />)}
            </div>
          </div>

          {/* SLOT 2: CENTRO (600x500 - Logo após a primeira vaga) */}
          <div className="w-full aspect-[6/5] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <VipSquareWidget pageType="establishments" slot={2} />
          </div>

          {/* Restante das Vagas */}
          {myJobs.length > 1 && (
            <div className="space-y-3">
              {myJobs.slice(1).map((j) => <JobCard key={j.id} job={j} variant="manage" />)}
            </div>
          )}

          {/* SLOT 3: RODAPÉ (600x200 - Fixado no rodapé) */}
          <div className="w-full aspect-[3/1] overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <VipSquareWidget pageType="establishments" slot={3} />
          </div>

          {/* Contratações (opcional, se quiser manter) */}
          {myContracts.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 font-display font-bold text-neutral-900 dark:text-white">Contratações</h3>
              <div className="space-y-2">
                {myContracts.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex w-full items-center gap-2 rounded-lg border border-neutral-100 p-2 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                    <button onClick={() => setEscrowContract(c)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <Avatar src={c.freelancerPhoto} alt={c.freelancerName} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-200">{c.freelancerName}</p>
                        <p className="text-xs text-neutral-400">{formatCurrency(c.total)}</p>
                      </div>
                    </button>
                    <Badge tone={c.status === 'completed' ? 'success' : c.status === 'paid' ? 'warning' : 'primary'}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
