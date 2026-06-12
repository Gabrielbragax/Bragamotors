import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, User, X, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import type { Vendedor } from '../types'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function Vendedores() {
  const { vendedores, veiculos, addVendedor, updateVendedor } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')

  const now = new Date()
  const [anoSel, setAnoSel] = useState(now.getFullYear())
  const [mesSel, setMesSel] = useState(now.getMonth())
  const [filtroTipo, setFiltroTipo] = useState<'mes' | 'ano' | 'total'>('mes')

  const vendidosVeiculos = veiculos.filter(v => v.status === 'vendido' && v.venda)

  const getVendasVendedor = (nomeVendedor: string) => {
    return vendidosVeiculos.filter(v => {
      const d = new Date(v.venda!.dataVenda)
      if (filtroTipo === 'mes') return v.venda!.vendedor === nomeVendedor && d.getMonth() === mesSel && d.getFullYear() === anoSel
      if (filtroTipo === 'ano') return v.venda!.vendedor === nomeVendedor && d.getFullYear() === anoSel
      return v.venda!.vendedor === nomeVendedor
    })
  }

  // Combina vendedores cadastrados + nomes que aparecem nas vendas mas não estão cadastrados
  const nomesEmVendas = [...new Set(vendidosVeiculos.map(v => v.venda!.vendedor).filter(Boolean))]
  const nomesNaoCadastrados = nomesEmVendas.filter(n => !vendedores.some(v => v.nome === n))
  const todosVendedores = [
    ...vendedores.filter(v => v.ativo),
    ...nomesNaoCadastrados.map(n => ({ id: n, nome: n, ativo: true } as Vendedor)),
  ]

  const salvarVendedor = () => {
    if (!nomeNovo.trim()) return
    addVendedor({ id: uuid(), nome: nomeNovo.trim(), ativo: true })
    setNomeNovo('')
    setShowModal(false)
  }

  const toggleAtivo = (vend: Vendedor) => {
    const cadastrado = vendedores.find(x => x.id === vend.id)
    if (cadastrado) updateVendedor({ ...cadastrado, ativo: !cadastrado.ativo })
  }

  const anos = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2]

  // Ranking para exibir
  const rankingData = todosVendedores
    .map(vend => {
      const vendas = getVendasVendedor(vend.nome)
      const faturamento = vendas.reduce((a, v) => a + (v.venda?.valorVenda || 0), 0)
      const lucro = vendas.reduce((a, v) => {
        const cp = v.servicosPreparacao.reduce((x, s) => x + s.valor, 0)
        return a + (v.venda?.valorVenda || 0) - v.valorPago - cp
      }, 0)
      return { vend, vendas, faturamento, lucro }
    })
    .sort((a, b) => b.vendas.length - a.vendas.length || b.faturamento - a.faturamento)

  const periodoLabel = filtroTipo === 'mes'
    ? `${MESES[mesSel]} / ${anoSel}`
    : filtroTipo === 'ano' ? String(anoSel) : 'Todos os tempos'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Vendedores</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Vendedor
        </button>
      </div>

      {/* Filtro de período */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Período de análise</div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Toggle Mês/Ano/Total */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {([['mes', 'Por Mês'], ['ano', 'Por Ano'], ['total', 'Total Geral']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFiltroTipo(k)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  filtroTipo === k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Seletor de Ano */}
          {filtroTipo !== 'total' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Ano:</span>
              <div className="flex gap-1">
                {anos.map(a => (
                  <button
                    key={a}
                    onClick={() => setAnoSel(a)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      anoSel === a ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seletor de Mês */}
          {filtroTipo === 'mes' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Mês:</span>
              <div className="flex flex-wrap gap-1">
                {MESES_CURTOS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMesSel(i)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      mesSel === i ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-600">
          Exibindo: <span className="text-blue-600">{periodoLabel}</span>
        </div>
      </div>

      {/* Ranking visual */}
      {rankingData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
            Ranking — {periodoLabel}
          </div>
          <div className="divide-y divide-slate-50">
            {rankingData.map(({ vend, vendas, faturamento, lucro }, i) => (
              <div key={vend.id} className={`flex items-center gap-4 px-5 py-3 ${i === 0 ? 'bg-yellow-50/50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-yellow-400 text-white' :
                  i === 1 ? 'bg-slate-300 text-slate-700' :
                  i === 2 ? 'bg-amber-600 text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {i + 1}º
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 font-semibold text-slate-800">{vend.nome}</div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800">{vendas.length}</div>
                  <div className="text-xs text-slate-400">venda{vendas.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-700">R$ {faturamento.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-slate-400">faturado</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {lucro.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-slate-400">lucro líq.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards individuais */}
      {todosVendedores.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <User className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">Nenhum vendedor cadastrado</p>
          <p className="text-slate-400 text-sm mt-1">Clique em "Novo Vendedor" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankingData.map(({ vend, vendas, faturamento, lucro }, i) => (
            <div key={vend.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${i === 0 && vendas.length > 0 ? 'border-yellow-300' : 'border-slate-200'}`}>
              {i === 0 && vendas.length > 0 && (
                <div className="bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">🏆 Melhor do período</div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {vend.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{vend.nome}</div>
                      <div className={`text-xs font-medium ${vend.ativo ? 'text-green-600' : 'text-slate-400'}`}>
                        {vend.ativo ? '● Ativo' : '○ Inativo'}
                      </div>
                    </div>
                  </div>
                  {vendedores.find(x => x.id === vend.id) && (
                    <button
                      onClick={() => toggleAtivo(vend)}
                      className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50"
                    >
                      {vend.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2.5 bg-blue-50 rounded-xl">
                    <ShoppingCart className="mx-auto text-blue-500 mb-1" size={15} />
                    <div className="text-xl font-bold text-slate-800">{vendas.length}</div>
                    <div className="text-xs text-slate-400">Vendas</div>
                  </div>
                  <div className="text-center p-2.5 bg-green-50 rounded-xl">
                    <DollarSign className="mx-auto text-green-500 mb-1" size={15} />
                    <div className="text-sm font-bold text-slate-800">R$ {(faturamento / 1000).toFixed(0)}k</div>
                    <div className="text-xs text-slate-400">Faturado</div>
                  </div>
                  <div className="text-center p-2.5 bg-emerald-50 rounded-xl">
                    <TrendingUp className="mx-auto text-emerald-500 mb-1" size={15} />
                    <div className={`text-sm font-bold ${lucro >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      R$ {(lucro / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-slate-400">Lucro</div>
                  </div>
                </div>

                {vendas.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 font-semibold uppercase mb-1.5">Últimas vendas</div>
                    {vendas.slice(0, 3).map(v => (
                      <div key={v.id} className="flex justify-between items-center text-xs bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-slate-600 truncate">{v.marca} {v.modelo} {v.ano}</span>
                        <span className="font-bold text-green-600 shrink-0 ml-2">R$ {v.venda!.valorVenda.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {vendas.length === 0 && (
                  <div className="text-center py-3 text-slate-400 text-xs">Sem vendas no período</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal novo vendedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Novo Vendedor</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Nome completo</div>
              <input
                className="input"
                value={nomeNovo}
                onChange={e => setNomeNovo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarVendedor()}
                placeholder="Ex: João Silva"
                autoFocus
              />
            </div>
            <div className="px-5 pb-5 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
              <button onClick={salvarVendedor} disabled={!nomeNovo.trim()} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">Cadastrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
