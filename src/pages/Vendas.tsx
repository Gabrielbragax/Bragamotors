import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { TrendingUp, Car, DollarSign, Filter, FileBarChart, Wrench } from 'lucide-react'
import type { Veiculo } from '../types'

/** Lucro líquido de uma venda: desconta boletos (nunca contam como lucro), custo de
 *  aquisição/preparação/tráfego e pós-venda. Se for consignado, aplica a % combinada
 *  por cima — o resto do lucro é do dono do carro, não da loja. */
function lucroLiquidoVenda(v: Veiculo): number {
  const cp = v.servicosPreparacao.reduce((x, s) => x + s.valor, 0)
  const cpv = v.servicosPosVenda.reduce((x, s) => x + s.valor, 0)
  const totalBoletos = (v.venda?.boletos || []).reduce((x, b) => x + b.valor, 0)
  const vendaLiquida = (v.venda?.valorVenda || 0) - totalBoletos
  const lucroTotal = vendaLiquida - v.valorPago - cp - (v.trafegoPago || 0) - cpv
  const pct = v.consignado ? (v.percentualConsignado || 0) : 100
  return lucroTotal * (pct / 100)
}

const FORMA_LABELS: Record<string, string> = {
  troca_financiamento: 'Troca + Financ.',
  entrada_financiamento: 'Entrada + Financ.',
  financiamento: 'Só Financiamento',
  avista: 'À Vista',
  entrada_boleto: 'Entrada + Boleto',
  troca_boleto: 'Troca + Boleto',
  misto: 'Misto',
}

const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function Vendas() {
  const veiculos = useStore(s => s.veiculos)
  const now = new Date()
  const [filtroTipo, setFiltroTipo] = useState<'mes' | 'ano' | 'total' | 'relatorio'>('mes')
  const [anoSel, setAnoSel] = useState(now.getFullYear())
  const [mesSel, setMesSel] = useState(now.getMonth())
  const [mesesRelatorio, setMesesRelatorio] = useState<number[]>([now.getMonth()])
  const [vendedorSel, setVendedorSel] = useState('todos')

  const toggleMesRelatorio = (m: number) => {
    setMesesRelatorio(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b))
  }

  const todos = veiculos.filter(v => v.status === 'vendido' && v.venda)
    .sort((a, b) => new Date(b.venda!.dataVenda).getTime() - new Date(a.venda!.dataVenda).getTime())

  const nomesVendedores = [...new Set(todos.map(v => v.venda!.vendedor).filter(Boolean))]

  const filtrados = todos.filter(v => {
    const d = new Date(v.venda!.dataVenda)
    const matchPeriodo =
      filtroTipo === 'total' ? true :
      filtroTipo === 'ano' ? d.getFullYear() === anoSel :
      filtroTipo === 'relatorio' ? d.getFullYear() === anoSel && mesesRelatorio.includes(d.getMonth()) :
      d.getFullYear() === anoSel && d.getMonth() === mesSel
    const matchVendedor = vendedorSel === 'todos' || v.venda!.vendedor === vendedorSel
    return matchPeriodo && matchVendedor
  })

  const totalFaturamento = filtrados.reduce((a, v) => a + (v.venda?.valorVenda || 0), 0)
  const totalLucro = filtrados.reduce((a, v) => a + lucroLiquidoVenda(v), 0)
  const totalPosVenda = filtrados.reduce((a, v) => a + v.servicosPosVenda.reduce((x, s) => x + s.valor, 0), 0)

  const periodoLabel =
    filtroTipo === 'mes' ? `${MESES_CURTOS[mesSel]}/${anoSel}` :
    filtroTipo === 'ano' ? String(anoSel) :
    filtroTipo === 'relatorio' ? (mesesRelatorio.length ? `${mesesRelatorio.map(m => MESES_CURTOS[m]).join(' + ')}/${anoSel}` : 'Selecione os meses') :
    'Todos os tempos'

  // Comparativo mês a mês, só no modo Relatório
  const breakdownMensal = filtroTipo === 'relatorio' ? mesesRelatorio.map(m => {
    const doMes = todos.filter(v => {
      const d = new Date(v.venda!.dataVenda)
      const matchVendedor = vendedorSel === 'todos' || v.venda!.vendedor === vendedorSel
      return d.getFullYear() === anoSel && d.getMonth() === m && matchVendedor
    })
    const fat = doMes.reduce((a, v) => a + (v.venda?.valorVenda || 0), 0)
    const luc = doMes.reduce((a, v) => a + lucroLiquidoVenda(v), 0)
    const posVenda = doMes.reduce((a, v) => a + v.servicosPosVenda.reduce((x, s) => x + s.valor, 0), 0)
    return { mes: m, qtd: doMes.length, faturamento: fat, lucro: luc, posVenda }
  }) : []

  const anos = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Vendas</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Filter size={15} /> Filtros
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Tipo */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {([['mes','Por Mês'],['ano','Por Ano'],['total','Total'],['relatorio','Relatório']] as const).map(([k,l]) => (
              <button key={k} onClick={() => setFiltroTipo(k)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${filtroTipo === k ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}>
                {k === 'relatorio' && <FileBarChart size={12} />}
                {l}
              </button>
            ))}
          </div>

          {/* Ano */}
          {filtroTipo !== 'total' && (
            <div className="flex gap-1">
              {anos.map(a => (
                <button key={a} onClick={() => setAnoSel(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${anoSel === a ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {a}
                </button>
              ))}
            </div>
          )}

          {/* Mês (seleção única) */}
          {filtroTipo === 'mes' && (
            <div className="flex flex-wrap gap-1">
              {MESES_CURTOS.map((m, i) => (
                <button key={i} onClick={() => setMesSel(i)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${mesSel === i ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Meses (multi-seleção, modo Relatório) */}
          {filtroTipo === 'relatorio' && (
            <div className="flex flex-wrap gap-1">
              {MESES_CURTOS.map((m, i) => {
                const sel = mesesRelatorio.includes(i)
                return (
                  <button key={i} onClick={() => toggleMesRelatorio(i)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${sel ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {m}
                  </button>
                )
              })}
            </div>
          )}

          {/* Vendedor */}
          {nomesVendedores.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Vendedor:</span>
              <select
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={vendedorSel}
                onChange={e => setVendedorSel(e.target.value)}
              >
                <option value="todos">Todos</option>
                {nomesVendedores.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>
        {filtroTipo === 'relatorio' && (
          <div className="text-xs text-slate-400">Clique nos meses para adicionar ou remover do relatório (pode combinar meses de qualquer parte do ano)</div>
        )}
        <div className="text-xs text-slate-500">Exibindo: <span className="font-semibold text-blue-600">{periodoLabel}</span> — {filtrados.length} venda{filtrados.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Car className="text-blue-500" size={18} /><span className="text-xs font-semibold text-slate-500">Vendas no período</span></div>
          <div className="text-2xl font-bold text-slate-800">{filtrados.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="text-green-500" size={18} /><span className="text-xs font-semibold text-slate-500">Faturamento</span></div>
          <div className="text-2xl font-bold text-slate-800">R$ {totalFaturamento.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="text-emerald-500" size={18} /><span className="text-xs font-semibold text-slate-500">Lucro líquido</span></div>
          <div className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>R$ {totalLucro.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Wrench className="text-orange-500" size={18} /><span className="text-xs font-semibold text-slate-500">Pós-venda</span></div>
          <div className="text-2xl font-bold text-orange-600">R$ {totalPosVenda.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-slate-400 mt-0.5">já descontado do lucro líquido</div>
        </div>
      </div>

      {/* Comparativo mês a mês — só no modo Relatório */}
      {filtroTipo === 'relatorio' && breakdownMensal.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileBarChart size={15} className="text-purple-600" />
            <span className="text-sm font-semibold text-slate-700">Comparativo mês a mês</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Mês','Vendas','Faturamento','Pós-Venda','Lucro Líquido'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {breakdownMensal.map(b => (
                  <tr key={b.mes} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{MESES_CURTOS[b.mes]}/{anoSel}</td>
                    <td className="px-4 py-2.5 text-slate-600">{b.qtd}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">R$ {b.faturamento.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2.5 text-orange-600 whitespace-nowrap">R$ {b.posVenda.toLocaleString('pt-BR')}</td>
                    <td className={`px-4 py-2.5 font-bold whitespace-nowrap ${b.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {b.lucro.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                  <td className="px-4 py-2.5 text-slate-700">Total</td>
                  <td className="px-4 py-2.5 text-slate-700">{filtrados.length}</td>
                  <td className="px-4 py-2.5 text-slate-800 whitespace-nowrap">R$ {totalFaturamento.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2.5 text-orange-600 whitespace-nowrap">R$ {totalPosVenda.toLocaleString('pt-BR')}</td>
                  <td className={`px-4 py-2.5 whitespace-nowrap ${totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {totalLucro.toLocaleString('pt-BR')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-sm">Nenhuma venda no período</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Data','Veículo','Vendedor','Forma','Venda','Custo','Pós-Venda','Lucro Bruto','Lucro Líq.','%'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map(v => {
                  const cp = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
                  const cpv = v.servicosPosVenda.reduce((a, s) => a + s.valor, 0)
                  const totalBoletos = (v.venda?.boletos || []).reduce((a, b) => a + b.valor, 0)
                  const vendaLiquida = v.venda!.valorVenda - totalBoletos
                  const custo = v.valorPago + cp + (v.trafegoPago || 0)
                  const lb = vendaLiquida - v.valorPago
                  const ll = lucroLiquidoVenda(v)
                  const pct = (ll / v.venda!.valorVenda) * 100
                  return (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(v.venda!.dataVenda).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/estoque/${v.id}`} className="font-medium text-blue-600 hover:underline">
                          {v.marca} {v.modelo}{v.versao ? ` ${v.versao}` : ''} {v.ano}
                        </Link>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          {v.placa}
                          {v.consignado && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">Consig. {v.percentualConsignado || 0}%</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{v.venda!.vendedor || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {FORMA_LABELS[v.venda!.formaPagamento] || v.venda!.formaPagamento}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">R$ {v.venda!.valorVenda.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">R$ {custo.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cpv > 0 ? (
                          <div className="group relative inline-block">
                            <span className="font-semibold text-orange-600 border-b border-dotted border-orange-400 cursor-help">R$ {cpv.toLocaleString('pt-BR')}</span>
                            <div className="hidden group-hover:block absolute z-20 top-full left-0 mt-1 w-64 bg-slate-800 text-white text-xs rounded-lg shadow-lg p-3 space-y-1.5">
                              <div className="font-semibold text-slate-300 uppercase text-[10px] tracking-wide mb-1">Serviços pós-venda</div>
                              {v.servicosPosVenda.map(s => (
                                <div key={s.id} className="flex justify-between gap-3">
                                  <span className="truncate">{s.local || 'Local não informado'}{s.servico ? ` — ${s.servico}` : ''}</span>
                                  <span className="font-semibold whitespace-nowrap">R$ {s.valor.toLocaleString('pt-BR')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">R$ 0</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap ${lb >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {lb.toLocaleString('pt-BR')}</td>
                      <td className={`px-4 py-3 font-bold whitespace-nowrap ${ll >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {ll.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${pct >= 10 ? 'bg-green-100 text-green-700' : pct >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
