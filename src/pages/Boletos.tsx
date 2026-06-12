import { useState } from 'react'
import { useStore } from '../store/useStore'
import { differenceInDays } from 'date-fns'
import { AlertCircle, CheckCircle, Clock, Edit2, Save, Plus, FileText, X, User, Car } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import type { Boleto } from '../types'
import NumInput from '../components/NumInput'

type StatusFiltro = 'todos' | 'vencido' | 'hoje' | 'aberto' | 'pago'

export default function Boletos() {
  const { veiculos, clientes, updateVeiculo } = useStore()
  const [filtro, setFiltro] = useState<StatusFiltro>('todos')
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [editValor, setEditValor] = useState(0)
  const [editVencimento, setEditVencimento] = useState('')
  const [obsAlteracao, setObsAlteracao] = useState('')

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)

  const getBoletoStatus = (b: Boleto): StatusFiltro => {
    if (b.pago) return 'pago'
    const d = new Date(b.vencimento); d.setHours(0, 0, 0, 0)
    if (d < hoje) return 'vencido'
    if (d.getTime() === hoje.getTime()) return 'hoje'
    return 'aberto'
  }

  type Item = {
    veiculoId: string
    veiculo: string
    placa: string
    clienteNome: string
    clienteCpf: string
    boleto: Boleto
    totalDivida: number
    contratoArquivo?: string
    contratoArquivoNome?: string
  }

  const todos: Item[] = veiculos.flatMap(v => {
    const boletos = v.venda?.boletos || []
    if (boletos.length === 0) return []
    const clienteVenda = v.venda?.cliente
    const clienteCad = clientes.find(c => c.cpf === clienteVenda?.cpf)
    const nomeCliente = clienteVenda?.nome || clienteCad?.nome || 'Cliente não informado'
    const cpfCliente = clienteVenda?.cpf || clienteCad?.cpf || ''
    const totalDivida = boletos.filter(b => !b.pago).reduce((a, b) => a + b.valor, 0)
    return boletos.map(b => ({
      veiculoId: v.id,
      veiculo: `${v.marca} ${v.modelo} ${v.ano}`,
      placa: v.placa,
      clienteNome: nomeCliente,
      clienteCpf: cpfCliente,
      boleto: b,
      totalDivida,
      contratoArquivo: v.venda?.contratoArquivo,
      contratoArquivoNome: v.venda?.contratoArquivoNome,
    }))
  })

  const filtrados = todos.filter(item => {
    const status = getBoletoStatus(item.boleto)
    const matchFiltro = filtro === 'todos' || status === filtro
    const matchBusca = !busca ||
      item.veiculo.toLowerCase().includes(busca.toLowerCase()) ||
      item.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      item.clienteCpf.includes(busca) ||
      item.placa.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  const counts = {
    vencido: todos.filter(i => getBoletoStatus(i.boleto) === 'vencido').length,
    hoje: todos.filter(i => getBoletoStatus(i.boleto) === 'hoje').length,
    aberto: todos.filter(i => getBoletoStatus(i.boleto) === 'aberto').length,
    pago: todos.filter(i => getBoletoStatus(i.boleto) === 'pago').length,
  }

  const updateBoleto = (veiculoId: string, boletoId: string, updates: Partial<Boleto>, obs?: string) => {
    const v = veiculos.find(x => x.id === veiculoId)
    if (!v || !v.venda) return
    const novos = v.venda.boletos?.map(b => b.id === boletoId ? {
      ...b, ...updates,
      alterado: obs ? true : b.alterado,
      obsAlteracao: obs || b.obsAlteracao,
    } : b) || []
    updateVeiculo({ ...v, venda: { ...v.venda, boletos: novos } })
  }

  const addBoletoNoVeiculo = (veiculoId: string) => {
    const v = veiculos.find(x => x.id === veiculoId)
    if (!v || !v.venda) return
    const novo: Boleto = { id: uuid(), valor: 0, vencimento: '', pago: false }
    updateVeiculo({ ...v, venda: { ...v.venda, boletos: [...(v.venda.boletos || []), novo] } })
  }

  const statusConfig: Record<StatusFiltro, { label: string; color: string; icon: React.ReactNode }> = {
    todos: { label: 'Todos', color: 'bg-slate-100 text-slate-700', icon: null },
    vencido: { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} /> },
    hoje: { label: 'Vence hoje', color: 'bg-orange-100 text-orange-700', icon: <Clock size={12} /> },
    aberto: { label: 'Em aberto', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
    pago: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  }

  const veiculoIds = [...new Set(filtrados.map(i => i.veiculoId))]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Boletos</h1>

      {/* Alertas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AlertCard label="Vencidos" count={counts.vencido} color="bg-red-50 border-red-200 text-red-700" onClick={() => setFiltro(filtro === 'vencido' ? 'todos' : 'vencido')} active={filtro === 'vencido'} />
        <AlertCard label="Vencem hoje" count={counts.hoje} color="bg-orange-50 border-orange-200 text-orange-700" onClick={() => setFiltro(filtro === 'hoje' ? 'todos' : 'hoje')} active={filtro === 'hoje'} />
        <AlertCard label="Em aberto" count={counts.aberto} color="bg-blue-50 border-blue-200 text-blue-700" onClick={() => setFiltro(filtro === 'aberto' ? 'todos' : 'aberto')} active={filtro === 'aberto'} />
        <AlertCard label="Pagos" count={counts.pago} color="bg-green-50 border-green-200 text-green-700" onClick={() => setFiltro(filtro === 'pago' ? 'todos' : 'pago')} active={filtro === 'pago'} />
      </div>

      <input
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Buscar por veículo, cliente, CPF, placa..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-sm">Nenhum boleto encontrado</div>
      ) : (
        <div className="space-y-4">
          {veiculoIds.map(vid => {
            const items = filtrados.filter(i => i.veiculoId === vid)
            const first = items[0]
            return (
              <div key={vid} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header do card */}
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      {/* Carro */}
                      <div className="flex items-center gap-2">
                        <Car size={15} className="text-blue-500 shrink-0" />
                        <span className="font-bold text-slate-800">{first.veiculo}</span>
                        <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{first.placa}</span>
                      </div>
                      {/* Cliente */}
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{first.clienteNome}</span>
                        {first.clienteCpf && <span className="text-xs text-slate-400">CPF: {first.clienteCpf}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {first.contratoArquivoNome && (
                        <a href={first.contratoArquivo} download={first.contratoArquivoNome}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline border border-blue-200 bg-blue-50 px-2 py-1 rounded-lg">
                          <FileText size={12} /> Contrato
                        </a>
                      )}
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total devedor</div>
                        <div className="font-bold text-red-600 text-lg">R$ {first.totalDivida.toLocaleString('pt-BR')}</div>
                      </div>
                      <button onClick={() => addBoletoNoVeiculo(vid)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline border border-blue-200 bg-blue-50 px-2 py-1 rounded-lg">
                        <Plus size={12} /> Boleto
                      </button>
                    </div>
                  </div>
                </div>

                {/* Boletos */}
                <div className="divide-y divide-slate-50">
                  {items.map(({ boleto: b }) => {
                    const status = getBoletoStatus(b)
                    const isEdit = editando === b.id
                    const diasAtraso = status === 'vencido' ? differenceInDays(hoje, new Date(b.vencimento)) : 0
                    return (
                      <div key={b.id} className={`px-5 py-4 ${status === 'vencido' ? 'bg-red-50/40' : status === 'hoje' ? 'bg-orange-50/40' : ''}`}>
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[status].color}`}>
                                {statusConfig[status].icon}
                                {statusConfig[status].label}
                                {status === 'vencido' && ` — ${diasAtraso}d de atraso`}
                              </span>
                              {b.alterado && (
                                <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold tracking-wide">ALTERADO</span>
                              )}
                            </div>

                            {isEdit ? (
                              <div className="space-y-3 mt-2">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-xs text-slate-400 mb-1">Novo valor (R$)</div>
                                    <NumInput value={editValor} onChange={setEditValor} />
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-400 mb-1">Novo vencimento</div>
                                    <input className="input" type="date" value={editVencimento} onChange={e => setEditVencimento(e.target.value)} />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-400 mb-1">Motivo da alteração *</div>
                                  <textarea className="input h-14 resize-none text-sm" value={obsAlteracao} onChange={e => setObsAlteracao(e.target.value)} placeholder="Ex: Negociação de prazo, desconto acordado..." />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => {
                                    updateBoleto(vid, b.id, { valor: editValor, vencimento: editVencimento }, obsAlteracao)
                                    setEditando(null); setObsAlteracao('')
                                  }} className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">
                                    <Save size={12} /> Salvar alteração
                                  </button>
                                  <button onClick={() => { setEditando(null); setObsAlteracao('') }}
                                    className="flex items-center gap-1 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50">
                                    <X size={12} /> Cancelar
                                  </button>
                                </div>
                                {b.obsAlteracao && (
                                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                    Obs anterior: {b.obsAlteracao}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-6 flex-wrap">
                                <div>
                                  <div className="text-xs text-slate-400">Valor</div>
                                  <div className="font-bold text-slate-800 text-lg">R$ {b.valor.toLocaleString('pt-BR')}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-400">Vencimento</div>
                                  <div className="font-medium text-slate-700">{b.vencimento ? new Date(b.vencimento + 'T12:00').toLocaleDateString('pt-BR') : '-'}</div>
                                </div>
                                {b.pago && b.dataPagamento && (
                                  <div>
                                    <div className="text-xs text-slate-400">Pago em</div>
                                    <div className="font-medium text-green-600">{new Date(b.dataPagamento + 'T12:00').toLocaleDateString('pt-BR')}</div>
                                  </div>
                                )}
                                {b.obsAlteracao && (
                                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                    {b.obsAlteracao}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {!isEdit && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => updateBoleto(vid, b.id, { pago: !b.pago, dataPagamento: !b.pago ? new Date().toISOString().split('T')[0] : undefined })}
                                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border ${b.pago ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                              >
                                {b.pago ? '✓ Pago' : 'Marcar pago'}
                              </button>
                              <button onClick={() => { setEditando(b.id); setEditValor(b.valor); setEditVencimento(b.vencimento) }}
                                className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50">
                                <Edit2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AlertCard({ label, count, color, onClick, active }: { label: string; count: number; color: string; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} className={`${color} rounded-xl p-5 border text-left transition-all ${active ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md' : 'hover:opacity-90 hover:shadow-sm'}`}>
      <div className="text-3xl font-extrabold leading-none">{count}</div>
      <div className="text-sm font-semibold mt-2">{label}</div>
    </button>
  )
}
