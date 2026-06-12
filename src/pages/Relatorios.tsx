import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, X, Users, MessageSquare, Store, DollarSign, Lightbulb } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import type { RelatorioDiario, LeadAtendimento, VendaDiaRelatorio, StatusLead } from '../types'
import { CANAIS_LEAD } from '../types'
import NumInput from '../components/NumInput'

const STATUS_LEAD: Record<StatusLead, { label: string; color: string }> = {
  agendou_visita:  { label: 'Agendou visita',    color: 'bg-blue-100 text-blue-700' },
  nao_respondeu:   { label: 'Não respondeu',      color: 'bg-slate-100 text-slate-600' },
  desistiu:        { label: 'Desistiu',           color: 'bg-red-100 text-red-700' },
  em_negociacao:   { label: 'Em negociação',      color: 'bg-yellow-100 text-yellow-700' },
  fechou:          { label: 'Fechou negócio',     color: 'bg-green-100 text-green-700' },
}

const emptyRelatorio = (): RelatorioDiario => ({
  id: uuid(),
  data: new Date().toISOString().split('T')[0],
  totalLeads: 0,
  canaisLeads: [],
  atendimentos: [],
  totalVisitas: 0,
  visitasFecharam: 0,
  motivosNaoFechamento: '',
  vendasDia: [],
  oQueFuncionou: '',
  oQueNaoFuncionou: '',
  oQueFariaDiferente: '',
})

export default function Relatorios() {
  const { relatorios, addRelatorio, updateRelatorio, deleteRelatorio } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<RelatorioDiario | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [deletando, setDeletando] = useState<string | null>(null)

  const abrirNovo = () => {
    setEditando(emptyRelatorio())
    setShowForm(true)
  }

  const abrirEditar = (r: RelatorioDiario) => {
    setEditando({ ...r })
    setShowForm(true)
  }

  const salvar = () => {
    if (!editando) return
    const existe = relatorios.find(r => r.id === editando.id)
    if (existe) updateRelatorio(editando)
    else addRelatorio(editando)
    setShowForm(false)
    setEditando(null)
  }

  const sorted = [...relatorios].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Criar Relatório
        </button>
      </div>

      {relatorios.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <FileText className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">Nenhum relatório criado</p>
          <p className="text-slate-400 text-sm mt-1">Clique em "Criar Relatório" para registrar o dia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(r => {
            const aberto = expandido === r.id
            const fechados = r.atendimentos.filter(a => a.status === 'fechou').length
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">
                      {new Date(r.data + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      <span>{r.totalLeads} lead{r.totalLeads !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{r.atendimentos.length} atendimento{r.atendimentos.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{r.totalVisitas} visita{r.totalVisitas !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="font-semibold text-green-600">{r.vendasDia.length} venda{r.vendasDia.length !== 1 ? 's' : ''}</span>
                      {fechados > 0 && <><span>•</span><span className="font-semibold text-green-600">{fechados} lead{fechados !== 1 ? 's' : ''} fechado{fechados !== 1 ? 's' : ''}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => abrirEditar(r)} className="text-xs text-blue-600 hover:underline px-2 py-1">Editar</button>
                    <button onClick={() => setDeletando(r.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
                    <button onClick={() => setExpandido(aberto ? null : r.id)} className="text-slate-400 hover:text-slate-700 p-1">
                      {aberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {aberto && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-5">
                    {/* Leads */}
                    <Section icon={<MessageSquare size={15} />} title="Leads Recebidos">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Stat label="Total de leads" value={r.totalLeads} />
                        <div className="col-span-2 sm:col-span-3">
                          <div className="text-xs text-slate-400 mb-1">Canais</div>
                          <div className="flex flex-wrap gap-1">
                            {r.canaisLeads.length > 0
                              ? r.canaisLeads.map(c => <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>)
                              : <span className="text-xs text-slate-400">Não informado</span>}
                          </div>
                        </div>
                      </div>
                    </Section>

                    {/* Atendimentos */}
                    {r.atendimentos.length > 0 && (
                      <Section icon={<Users size={15} />} title={`Atendimentos (${r.atendimentos.length})`}>
                        <div className="space-y-2">
                          {r.atendimentos.map(a => (
                            <div key={a.id} className="flex flex-wrap items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                              <span className="font-semibold text-slate-700">{a.nomeCliente || '—'}</span>
                              <span className="text-xs text-slate-400">{a.canalOrigem}</span>
                              {a.carroInteresse && <span className="text-xs text-blue-600">{a.carroInteresse}</span>}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_LEAD[a.status].color}`}>{STATUS_LEAD[a.status].label}</span>
                              {a.motivoNaoConversao && <span className="text-xs text-red-500">{a.motivoNaoConversao}</span>}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Visitas */}
                    <Section icon={<Store size={15} />} title="Visitas na Loja">
                      <div className="grid grid-cols-3 gap-3">
                        <Stat label="Vieram" value={r.totalVisitas} />
                        <Stat label="Fecharam" value={r.visitasFecharam} green />
                        <Stat label="Não fecharam" value={r.totalVisitas - r.visitasFecharam} />
                      </div>
                      {r.motivosNaoFechamento && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mt-2">{r.motivosNaoFechamento}</p>
                      )}
                    </Section>

                    {/* Vendas */}
                    {r.vendasDia.length > 0 && (
                      <Section icon={<DollarSign size={15} />} title={`Vendas do Dia (${r.vendasDia.length})`}>
                        <div className="space-y-2">
                          {r.vendasDia.map(vd => (
                            <div key={vd.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 text-sm">
                              <span className="font-semibold text-slate-700">{vd.carro}</span>
                              <span className="text-xs text-slate-500">{vd.formaPagamento}</span>
                              <span className="font-bold text-green-700">R$ {vd.valor.toLocaleString('pt-BR')}</span>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Reflexão */}
                    {(r.oQueFuncionou || r.oQueNaoFuncionou || r.oQueFariaDiferente) && (
                      <Section icon={<Lightbulb size={15} />} title="Reflexão do Dia">
                        {r.oQueFuncionou && <ReflexItem label="✅ O que funcionou" text={r.oQueFuncionou} />}
                        {r.oQueNaoFuncionou && <ReflexItem label="❌ O que não funcionou" text={r.oQueNaoFuncionou} />}
                        {r.oQueFariaDiferente && <ReflexItem label="💡 O que faria diferente" text={r.oQueFariaDiferente} />}
                      </Section>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmação exclusão */}
      {deletando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="font-bold text-slate-800">Excluir relatório?</div>
            <div className="text-sm text-slate-500">Esta ação não pode ser desfeita.</div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletando(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
              <button onClick={() => { deleteRelatorio(deletando); setDeletando(null) }} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulário */}
      {showForm && editando && (
        <RelatorioForm
          relatorio={editando}
          onChange={setEditando}
          onSave={salvar}
          onClose={() => { setShowForm(false); setEditando(null) }}
        />
      )}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
        <span className="text-slate-400">{icon}</span> {title}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, green }: { label: string; value: number; green?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
      <div className={`text-xl font-bold ${green ? 'text-green-600' : 'text-slate-800'}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

function ReflexItem({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-2">
      <div className="text-xs font-semibold text-slate-500 mb-1">{label}</div>
      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{text}</p>
    </div>
  )
}

// ── FORMULÁRIO ──────────────────────────────────────────────────────────────

function RelatorioForm({ relatorio, onChange, onSave, onClose }: {
  relatorio: RelatorioDiario
  onChange: (r: RelatorioDiario) => void
  onSave: () => void
  onClose: () => void
}) {
  const set = <K extends keyof RelatorioDiario>(k: K, v: RelatorioDiario[K]) =>
    onChange({ ...relatorio, [k]: v })

  const toggleCanal = (c: string) => {
    const arr = relatorio.canaisLeads
    set('canaisLeads', arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c])
  }

  const addAtendimento = () => {
    const novo: LeadAtendimento = { id: uuid(), nomeCliente: '', canalOrigem: '', carroInteresse: '', status: 'em_negociacao' }
    set('atendimentos', [...relatorio.atendimentos, novo])
  }
  const updAtend = (id: string, k: keyof LeadAtendimento, v: string) =>
    set('atendimentos', relatorio.atendimentos.map(a => a.id === id ? { ...a, [k]: v } : a))
  const remAtend = (id: string) =>
    set('atendimentos', relatorio.atendimentos.filter(a => a.id !== id))

  const addVenda = () => {
    const nova: VendaDiaRelatorio = { id: uuid(), carro: '', valor: 0, formaPagamento: '' }
    set('vendasDia', [...relatorio.vendasDia, nova])
  }
  const updVenda = (id: string, k: keyof VendaDiaRelatorio, v: string | number) =>
    set('vendasDia', relatorio.vendasDia.map(vd => vd.id === id ? { ...vd, [k]: v } : vd))
  const remVenda = (id: string) =>
    set('vendasDia', relatorio.vendasDia.filter(vd => vd.id !== id))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg">Relatório Diário de Atendimento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-7 max-h-[80vh] overflow-y-auto">
          {/* Data */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</label>
            <input className="input mt-1 max-w-xs" type="date" value={relatorio.data} onChange={e => set('data', e.target.value)} />
          </div>

          {/* LEADS RECEBIDOS */}
          <FormSection icon={<MessageSquare size={16} />} title="Leads Recebidos">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Quantos leads chegaram hoje?</label>
              <NumInput className="input max-w-xs" value={relatorio.totalLeads} onChange={v => set('totalLeads', v)} placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">De qual canal?</label>
              <div className="flex flex-wrap gap-2">
                {CANAIS_LEAD.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCanal(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      relatorio.canaisLeads.includes(c)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* ATENDIMENTOS */}
          <FormSection icon={<Users size={16} />} title="Atendimentos">
            {relatorio.atendimentos.map((a, i) => (
              <div key={a.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Lead #{i + 1}</span>
                  <button onClick={() => remAtend(a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Nome do cliente</label>
                    <input className="input text-sm" value={a.nomeCliente} onChange={e => updAtend(a.id, 'nomeCliente', e.target.value)} placeholder="Nome..." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Canal de origem</label>
                    <select className="input text-sm" value={a.canalOrigem} onChange={e => updAtend(a.id, 'canalOrigem', e.target.value)}>
                      <option value="">Selecionar...</option>
                      {CANAIS_LEAD.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Carro de interesse</label>
                    <input className="input text-sm" value={a.carroInteresse} onChange={e => updAtend(a.id, 'carroInteresse', e.target.value)} placeholder="Ex: Onix LT 2020..." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Status</label>
                    <select className="input text-sm" value={a.status} onChange={e => updAtend(a.id, 'status', e.target.value as StatusLead)}>
                      {(Object.keys(STATUS_LEAD) as StatusLead[]).map(k => (
                        <option key={k} value={k}>{STATUS_LEAD[k].label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(a.status === 'desistiu' || a.status === 'nao_respondeu') && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Motivo de não conversão</label>
                    <input className="input text-sm" value={a.motivoNaoConversao || ''} onChange={e => updAtend(a.id, 'motivoNaoConversao', e.target.value)} placeholder="Ex: Achou caro, preferiu outro carro..." />
                  </div>
                )}
              </div>
            ))}
            <button onClick={addAtendimento} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-2.5 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Adicionar atendimento
            </button>
          </FormSection>

          {/* VISITAS NA LOJA */}
          <FormSection icon={<Store size={16} />} title="Visitas na Loja">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Quantos clientes vieram?</label>
                <NumInput className="input" value={relatorio.totalVisitas} onChange={v => set('totalVisitas', v)} placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Quantos fecharam?</label>
                <NumInput className="input" value={relatorio.visitasFecharam} onChange={v => set('visitasFecharam', v)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Quem não fechou — por quê?</label>
              <textarea className="input resize-none h-20" value={relatorio.motivosNaoFechamento} onChange={e => set('motivosNaoFechamento', e.target.value)} placeholder="Descreva os motivos de não fechamento..." />
            </div>
          </FormSection>

          {/* VENDAS DO DIA */}
          <FormSection icon={<DollarSign size={16} />} title="Vendas do Dia">
            {relatorio.vendasDia.map((vd, i) => (
              <div key={vd.id} className="bg-green-50 rounded-xl border border-green-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-green-700">Venda #{i + 1}</span>
                  <button onClick={() => remVenda(vd.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Carro vendido</label>
                    <input className="input text-sm" value={vd.carro} onChange={e => updVenda(vd.id, 'carro', e.target.value)} placeholder="Ex: Fiesta Sedan 2013..." />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Valor (R$)</label>
                    <NumInput className="input" value={vd.valor} onChange={v => updVenda(vd.id, 'valor', v)} placeholder="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Forma de pagamento</label>
                    <input className="input text-sm" value={vd.formaPagamento} onChange={e => updVenda(vd.id, 'formaPagamento', e.target.value)} placeholder="Ex: Financiamento, À Vista, Troca..." />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addVenda} className="w-full border-2 border-dashed border-green-200 rounded-xl py-2.5 text-sm text-green-600 hover:border-green-400 transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Adicionar venda
            </button>
          </FormSection>

          {/* REFLEXÃO */}
          <FormSection icon={<Lightbulb size={16} />} title="Reflexão do Dia">
            {[
              { key: 'oQueFuncionou' as const, label: '✅ O que funcionou?' },
              { key: 'oQueNaoFuncionou' as const, label: '❌ O que não funcionou?' },
              { key: 'oQueFariaDiferente' as const, label: '💡 O que faria diferente?' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                <textarea
                  className="input resize-none h-20"
                  value={relatorio[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder="Escreva sua reflexão..."
                />
              </div>
            ))}
          </FormSection>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={onSave} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Salvar Relatório</button>
        </div>
      </div>
    </div>
  )
}

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-semibold text-slate-700 pb-2 border-b border-slate-100">
        <span className="text-blue-500">{icon}</span> {title}
      </div>
      {children}
    </div>
  )
}
