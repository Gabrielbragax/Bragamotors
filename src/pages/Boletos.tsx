import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { differenceInDays } from 'date-fns'
import { AlertCircle, CheckCircle, Clock, Edit2, Save, Plus, FileText, X, User, Car, ChevronDown, ChevronUp, MessageCircle, Trophy, Printer } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import type { Boleto } from '../types'
import NumInput from '../components/NumInput'

type StatusFiltro = 'todos' | 'vencido' | 'hoje' | 'aberto' | 'pago'

/** Link do WhatsApp já com a mensagem pronta — limpa o telefone e garante o DDI 55. */
function linkWhatsapp(telefone: string, mensagem: string): string {
  const digitos = telefone.replace(/\D/g, '')
  const comDDI = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`
}

/** Cor do badge escala conforme os dias de atraso — atraso longo chama mais atenção. */
function corAtraso(dias: number): string {
  if (dias > 30) return 'bg-red-900 text-white'
  if (dias > 10) return 'bg-red-600 text-white'
  return 'bg-red-100 text-red-700'
}

export default function Boletos() {
  const { veiculos, clientes, updateVeiculo } = useStore()
  const [filtro, setFiltro] = useState<StatusFiltro>('todos')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [editValor, setEditValor] = useState(0)
  const [editVencimento, setEditVencimento] = useState('')
  const [obsAlteracao, setObsAlteracao] = useState('')
  const [mostrarRanking, setMostrarRanking] = useState(false)

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)

  const getBoletoStatus = (b: Boleto): StatusFiltro => {
    if (b.pago) return 'pago'
    const d = new Date(b.vencimento); d.setHours(0, 0, 0, 0)
    if (d < hoje) return 'vencido'
    if (d.getTime() === hoje.getTime()) return 'hoje'
    const diasRestantes = differenceInDays(d, hoje)
    if (diasRestantes <= 5) return 'aberto'
    return 'aberto'
  }

  const getDiasRestantes = (b: Boleto): number | null => {
    if (b.pago) return null
    const d = new Date(b.vencimento); d.setHours(0, 0, 0, 0)
    if (d <= hoje) return null
    return differenceInDays(d, hoje)
  }

  // Agrupa por veículo
  type VeiculoItem = {
    veiculoId: string
    veiculo: string
    placa: string
    clienteNome: string
    clienteCpf: string
    clienteTelefone: string
    boletos: Boleto[]
    saldoDevedor: number
    temVencido: boolean
    temHoje: boolean
    diasAtrasoMax: number
    urgencia: number
    contratoArquivo?: string
    contratoArquivoNome?: string
  }

  const porVeiculo: VeiculoItem[] = veiculos
    .filter(v => (v.venda?.boletos || []).length > 0)
    .map(v => {
      const boletos = v.venda?.boletos || []
      const clienteVenda = v.venda?.cliente
      const clienteCad = clientes.find(c => c.cpf === clienteVenda?.cpf)
      const nomeCliente = clienteVenda?.nome || clienteCad?.nome || 'Cliente não informado'
      const cpfCliente = clienteVenda?.cpf || clienteCad?.cpf || ''
      const telefoneCliente = clienteCad?.telefone || ''
      const saldoDevedor = boletos.filter(b => !b.pago).reduce((a, b) => a + b.valor, 0)
      const temVencido = boletos.some(b => getBoletoStatus(b) === 'vencido')
      const temHoje = boletos.some(b => getBoletoStatus(b) === 'hoje')

      // Urgência: quanto mais negativo, mais urgente. Vencido = -dias de atraso (mais
      // atrasado primeiro). Em aberto = +dias até vencer (mais próximo primeiro).
      // Quitado (sem boleto em aberto) sempre por último.
      const abertos = boletos.filter(b => !b.pago && b.vencimento)
      const diasAtrasoMax = abertos.length
        ? Math.max(0, ...abertos.map(b => differenceInDays(hoje, new Date(b.vencimento))))
        : 0
      const urgencia = abertos.length
        ? Math.min(...abertos.map(b => differenceInDays(new Date(b.vencimento), hoje)))
        : Infinity

      return {
        veiculoId: v.id,
        veiculo: `${v.marca} ${v.modelo} ${v.ano}`,
        placa: v.placa,
        clienteNome: nomeCliente,
        clienteCpf: cpfCliente,
        clienteTelefone: telefoneCliente,
        boletos,
        saldoDevedor,
        temVencido,
        temHoje,
        diasAtrasoMax,
        urgencia,
        contratoArquivo: v.venda?.contratoArquivo,
        contratoArquivoNome: v.venda?.contratoArquivoNome,
      }
    })
    .sort((a, b) => a.urgencia - b.urgencia)

  // Counts para os filtros (por boleto individual)
  const todosBoletosFlat = porVeiculo.flatMap(v => v.boletos)
  const counts = {
    vencido: todosBoletosFlat.filter(b => getBoletoStatus(b) === 'vencido').length,
    hoje: todosBoletosFlat.filter(b => getBoletoStatus(b) === 'hoje').length,
    aberto: todosBoletosFlat.filter(b => getBoletoStatus(b) === 'aberto').length,
    pago: todosBoletosFlat.filter(b => getBoletoStatus(b) === 'pago').length,
  }

  const filtrados = porVeiculo.filter(item => {
    const matchBusca = !busca ||
      item.veiculo.toLowerCase().includes(busca.toLowerCase()) ||
      item.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      item.clienteCpf.includes(busca) ||
      item.placa.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todos' || item.boletos.some(b => getBoletoStatus(b) === filtro)
    return matchBusca && matchFiltro
  })

  // Ranking de inadimplência — agrupa por cliente (não por veículo), somando todos os
  // carros financiados que a mesma pessoa tenha. Sempre considera todos os dados, não
  // só o que está filtrado na tela.
  type RankingCliente = { chave: string; nome: string; cpf: string; saldoDevedor: number; boletosVencidos: number; veiculos: string[] }
  const rankingInadimplencia: RankingCliente[] = (() => {
    const mapa: Record<string, RankingCliente> = {}
    for (const item of porVeiculo) {
      if (item.saldoDevedor <= 0) continue
      const chave = item.clienteCpf || item.clienteNome
      if (!mapa[chave]) mapa[chave] = { chave, nome: item.clienteNome, cpf: item.clienteCpf, saldoDevedor: 0, boletosVencidos: 0, veiculos: [] }
      mapa[chave].saldoDevedor += item.saldoDevedor
      mapa[chave].boletosVencidos += item.boletos.filter(b => getBoletoStatus(b) === 'vencido').length
      mapa[chave].veiculos.push(item.veiculo)
    }
    return Object.values(mapa).sort((a, b) => b.saldoDevedor - a.saldoDevedor)
  })()

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

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    vencido: { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} /> },
    hoje: { label: 'Vence hoje', color: 'bg-orange-100 text-orange-700', icon: <Clock size={12} /> },
    aberto: { label: 'Em aberto', color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
    pago: { label: 'Pago', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-800">Boletos</h1>
        <div className="flex gap-2">
          <button onClick={() => setMostrarRanking(m => !m)}
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Trophy size={16} /> {mostrarRanking ? 'Ocultar' : 'Ver'} Ranking
          </button>
          <Link to="/boletos/imprimir" className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Printer size={16} /> Imprimir Lista
          </Link>
        </div>
      </div>

      {/* Ranking de inadimplência */}
      {mostrarRanking && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Trophy size={15} className="text-amber-600" />
            <span className="text-sm font-semibold text-slate-700">Ranking de Inadimplência — quem mais deve</span>
          </div>
          {rankingInadimplencia.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">Ninguém com saldo devedor no momento 🎉</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {rankingInadimplencia.map((r, i) => (
                <div key={r.chave} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-red-600 text-white' : i === 1 ? 'bg-red-400 text-white' : i === 2 ? 'bg-red-200 text-red-800' : 'bg-slate-100 text-slate-500'
                  }`}>{i + 1}º</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{r.nome}</div>
                    <div className="text-xs text-slate-400 truncate">{r.cpf || '—'} • {r.veiculos.join(', ')}</div>
                  </div>
                  {r.boletosVencidos > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold shrink-0">{r.boletosVencidos} vencido{r.boletosVencidos !== 1 ? 's' : ''}</span>
                  )}
                  <div className="font-bold text-red-600 text-sm shrink-0">R$ {r.saldoDevedor.toLocaleString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cabeçalho da lista */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-3">Veículo / Placa</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">CPF</div>
            <div className="col-span-2 text-right">Saldo Devedor</div>
            <div className="col-span-2 text-center">Situação</div>
          </div>

          {filtrados.map((item, idx) => {
            const aberto = expandido === item.veiculoId
            return (
              <div key={item.veiculoId} className={idx !== 0 ? 'border-t border-slate-100' : ''}>
                {/* Linha da lista */}
                <button
                  onClick={() => setExpandido(aberto ? null : item.veiculoId)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Veículo + placa */}
                    <div className="col-span-10 sm:col-span-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Car size={14} className="text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800 text-sm">{item.veiculo}</span>
                      </div>
                      <div className="mt-0.5">
                        <span className="text-xs font-black font-mono tracking-widest border-2 border-slate-800 rounded px-1.5 py-0.5 text-slate-900">{item.placa}</span>
                      </div>
                    </div>

                    {/* Cliente (esconde no mobile) */}
                    <div className="hidden sm:block col-span-3">
                      <div className="flex items-center gap-1">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{item.clienteNome}</span>
                      </div>
                    </div>

                    {/* CPF */}
                    <div className="hidden sm:block col-span-2 text-xs text-slate-500">{item.clienteCpf || '—'}</div>

                    {/* Saldo devedor */}
                    <div className="hidden sm:block col-span-2 text-right">
                      <span className={`font-bold text-sm ${item.saldoDevedor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        R$ {item.saldoDevedor.toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Situação */}
                    <div className="hidden sm:flex col-span-2 justify-center">
                      {item.temVencido ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${corAtraso(item.diasAtrasoMax)}`}>
                          <AlertCircle size={11} /> Vencido {item.diasAtrasoMax > 10 ? `— ${item.diasAtrasoMax}d` : ''}
                        </span>
                      ) : item.temHoje ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          <Clock size={11} /> Vence hoje
                        </span>
                      ) : item.saldoDevedor === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <CheckCircle size={11} /> Quitado
                        </span>
                      ) : (() => {
                        const proxVenc = item.boletos
                          .filter(b => !b.pago && b.vencimento)
                          .map(b => getDiasRestantes(b))
                          .filter((d): d is number => d !== null)
                        const menorDias = proxVenc.length > 0 ? Math.min(...proxVenc) : null
                        if (menorDias !== null && menorDias <= 5) {
                          return (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${menorDias <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              <Clock size={11} /> Vence em {menorDias}d
                            </span>
                          )
                        }
                        return (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            <Clock size={11} /> Em dia
                          </span>
                        )
                      })()}
                    </div>

                    {/* Seta + info mobile */}
                    <div className="col-span-2 sm:hidden flex flex-col items-end gap-1">
                      <span className={`font-bold text-sm ${item.saldoDevedor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        R$ {item.saldoDevedor.toLocaleString('pt-BR')}
                      </span>
                      {item.temVencido && <span className={`text-xs font-semibold px-1.5 rounded ${corAtraso(item.diasAtrasoMax)}`}>Vencido {item.diasAtrasoMax > 10 ? `${item.diasAtrasoMax}d` : ''}</span>}
                    </div>

                    <div className="col-span-12 sm:col-span-12 flex justify-end -mt-1 sm:hidden">
                      {aberto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  {/* Seta desktop */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block" />
                </button>

                {/* Card expandido */}
                {aberto && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 py-5 space-y-4">
                    {/* Info do cliente */}
                    <div className="flex flex-wrap gap-4 items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-500" />
                          <span className="font-semibold text-slate-800">{item.clienteNome}</span>
                          {item.clienteCpf && <span className="text-xs text-slate-500">CPF: {item.clienteCpf}</span>}
                        </div>
                        <div className="text-sm text-slate-500">
                          Saldo devedor: <span className="font-bold text-red-600">R$ {item.saldoDevedor.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.contratoArquivoNome && (
                          <a href={item.contratoArquivo} download={item.contratoArquivoNome}
                            className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100">
                            <FileText size={12} /> Contrato
                          </a>
                        )}
                        <button onClick={() => addBoletoNoVeiculo(item.veiculoId)}
                          className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100">
                          <Plus size={12} /> Novo boleto
                        </button>
                      </div>
                    </div>

                    {/* Lista de boletos */}
                    <div className="space-y-2">
                      {item.boletos.map(b => {
                        const status = getBoletoStatus(b)
                        const isEdit = editando === b.id
                        const diasAtraso = status === 'vencido' ? differenceInDays(hoje, new Date(b.vencimento)) : 0

                        return (
                          <div key={b.id} className={`bg-white rounded-xl border p-4 ${status === 'vencido' ? 'border-red-200' : status === 'hoje' ? 'border-orange-200' : 'border-slate-200'}`}>
                            <div className="flex flex-wrap items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  {(() => {
                                    const diasRestantes = getDiasRestantes(b)
                                    const isProximo = diasRestantes !== null && diasRestantes <= 5
                                    const cfg = isProximo
                                      ? { label: diasRestantes === 0 ? 'Vence hoje' : `Vence em ${diasRestantes}d`, color: diasRestantes <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> }
                                      : status === 'vencido'
                                        ? { ...statusConfig[status], color: corAtraso(diasAtraso) }
                                        : statusConfig[status]
                                    return (
                                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                        {cfg.icon}
                                        {cfg.label}
                                        {status === 'vencido' && ` — ${diasAtraso}d de atraso`}
                                      </span>
                                    )
                                  })()}
                                  {b.alterado && (
                                    <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">ALTERADO</span>
                                  )}
                                </div>

                                {isEdit ? (
                                  <div className="space-y-3">
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
                                      <div className="text-xs text-slate-400 mb-1">Motivo da alteração</div>
                                      <textarea className="input h-14 resize-none text-sm" value={obsAlteracao} onChange={e => setObsAlteracao(e.target.value)} placeholder="Ex: Negociação de prazo..." />
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={() => {
                                        updateBoleto(item.veiculoId, b.id, { valor: editValor, vencimento: editVencimento }, obsAlteracao)
                                        setEditando(null); setObsAlteracao('')
                                      }} className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">
                                        <Save size={12} /> Salvar
                                      </button>
                                      <button onClick={() => { setEditando(null); setObsAlteracao('') }}
                                        className="flex items-center gap-1 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50">
                                        <X size={12} /> Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-6 flex-wrap">
                                    <div>
                                      <div className="text-xs text-slate-400">Valor</div>
                                      <div className="font-bold text-slate-800 text-lg">R$ {b.valor.toLocaleString('pt-BR')}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-400">Vencimento</div>
                                      <div className="font-medium text-slate-700">{b.vencimento ? new Date(b.vencimento + 'T12:00').toLocaleDateString('pt-BR') : '—'}</div>
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
                                <div className="flex items-center gap-2">
                                  {!b.pago && item.clienteTelefone && (
                                    <a
                                      href={linkWhatsapp(item.clienteTelefone, `Olá ${item.clienteNome.split(' ')[0]}, tudo bem? Aqui é da BragaMotors. Identificamos que o boleto de R$ ${b.valor.toLocaleString('pt-BR')} referente ao seu ${item.veiculo} ${status === 'vencido' ? `venceu em ${new Date(b.vencimento + 'T12:00').toLocaleDateString('pt-BR')}` : `vence em ${new Date(b.vencimento + 'T12:00').toLocaleDateString('pt-BR')}`}. Poderia verificar a situação? Qualquer dúvida estou à disposição!`)}
                                      target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold border bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                    >
                                      <MessageCircle size={13} /> Cobrar
                                    </a>
                                  )}
                                  <button
                                    onClick={() => updateBoleto(item.veiculoId, b.id, { pago: !b.pago, dataPagamento: !b.pago ? new Date().toISOString().split('T')[0] : undefined })}
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
                )}
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
