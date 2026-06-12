import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Car, TrendingUp, Clock, DollarSign, AlertCircle, CheckCircle, Target, Edit2, Save, UserCheck, Trophy } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { Link } from 'react-router-dom'
import NumInput from '../components/NumInput'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function Dashboard() {
  const veiculos = useStore(s => s.veiculos)
  const metas = useStore(s => s.metas)
  const upsertMeta = useStore(s => s.upsertMeta)

  const now = new Date()
  const mesAtual = now.getMonth()
  const anoAtual = now.getFullYear()

  const [editandoMeta, setEditandoMeta] = useState(false)
  const metaAtual = metas.find(m => m.mes === mesAtual && m.ano === anoAtual)
  const [metaQtd, setMetaQtd] = useState(metaAtual?.metaQuantidade || 0)
  const [metaFat, setMetaFat] = useState(metaAtual?.metaFaturamento || 0)

  const emEstoque = veiculos.filter(v => v.status === 'estoque')
  const emPreparacao = veiculos.filter(v => v.status === 'preparacao')
  const vendidos = veiculos.filter(v => v.status === 'vendido')

  const totalCustoEstoque = emEstoque.reduce((acc, v) => {
    const cp = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
    return acc + v.valorPago + cp
  }, 0)

  const vendidosMes = vendidos.filter(v => {
    if (!v.venda) return false
    const d = new Date(v.venda.dataVenda)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  })

  const faturamentoMes = vendidosMes.reduce((acc, v) => acc + (v.venda?.valorVenda || 0), 0)
  const lucroMes = vendidosMes.reduce((acc, v) => {
    const cp = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
    return acc + (v.venda?.valorVenda || 0) - v.valorPago - cp
  }, 0)

  const veiculosMaisTempo = [...emEstoque, ...emPreparacao]
    .map(v => ({ ...v, dias: differenceInDays(new Date(), new Date(v.dataEntrada)) }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 5)

  const boletosVencidos = veiculos.flatMap(v =>
    (v.venda?.boletos || []).filter(b => !b.pago && new Date(b.vencimento) < new Date())
  ).length

  // Ranking de vendedores do mês
  const rankingVendedores = (() => {
    const mapa: Record<string, { nome: string; qtd: number; faturamento: number }> = {}
    vendidosMes.forEach(v => {
      const nome = v.venda?.vendedor
      if (!nome) return
      if (!mapa[nome]) mapa[nome] = { nome, qtd: 0, faturamento: 0 }
      mapa[nome].qtd++
      mapa[nome].faturamento += v.venda?.valorVenda || 0
    })
    return Object.values(mapa).sort((a, b) => b.qtd - a.qtd || b.faturamento - a.faturamento).slice(0, 3)
  })()

  const boletosHoje = veiculos.flatMap(v =>
    (v.venda?.boletos || []).filter(b => {
      if (b.pago) return false
      const d = new Date(b.vencimento)
      const n = new Date(); n.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0)
      return d.getTime() === n.getTime()
    })
  ).length

  // Progresso metas
  const pctQtd = metaAtual?.metaQuantidade ? Math.min(100, (vendidosMes.length / metaAtual.metaQuantidade) * 100) : 0
  const pctFat = metaAtual?.metaFaturamento ? Math.min(100, (faturamentoMes / metaAtual.metaFaturamento) * 100) : 0

  const salvarMeta = () => {
    upsertMeta({ ano: anoAtual, mes: mesAtual, metaQuantidade: metaQtd, metaFaturamento: metaFat })
    setEditandoMeta(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="text-sm text-slate-400">{MESES[mesAtual]} {anoAtual}</div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<Car className="text-blue-500" size={22} />} label="Em Estoque" value={emEstoque.length} bg="bg-blue-50" />
        <Card icon={<Clock className="text-yellow-500" size={22} />} label="Em Preparação" value={emPreparacao.length} bg="bg-yellow-50" />
        <Card icon={<CheckCircle className="text-green-500" size={22} />} label="Vendidos no mês" value={vendidosMes.length} bg="bg-green-50" />
        <Card icon={<DollarSign className="text-purple-500" size={22} />} label="Custo do Estoque" value={totalCustoEstoque >= 1000 ? `R$ ${(totalCustoEstoque / 1000).toFixed(0)}k` : `R$ ${totalCustoEstoque.toLocaleString('pt-BR')}`} bg="bg-purple-50" />
      </div>

      {/* Metas do mês */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-blue-500" size={20} />
            <span className="font-semibold text-slate-700">Metas — {MESES[mesAtual]}</span>
          </div>
          {!editandoMeta ? (
            <button onClick={() => { setMetaQtd(metaAtual?.metaQuantidade || 0); setMetaFat(metaAtual?.metaFaturamento || 0); setEditandoMeta(true) }}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Edit2 size={13} /> Editar metas
            </button>
          ) : (
            <button onClick={salvarMeta} className="flex items-center gap-1 text-sm text-green-600 hover:underline">
              <Save size={13} /> Salvar
            </button>
          )}
        </div>

        {editandoMeta ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">Meta de vendas (unidades)</div>
              <NumInput value={metaQtd} onChange={setMetaQtd} placeholder="0" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Meta de faturamento (R$)</div>
              <NumInput value={metaFat} onChange={setMetaFat} placeholder="0" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Meta quantidade */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-slate-400">Vendas</div>
                  <div className="text-2xl font-bold text-slate-800">{vendidosMes.length}
                    {metaAtual?.metaQuantidade ? <span className="text-base font-normal text-slate-400"> / {metaAtual.metaQuantidade}</span> : ''}
                  </div>
                </div>
                <div className={`text-sm font-bold ${pctQtd >= 100 ? 'text-green-600' : pctQtd >= 70 ? 'text-yellow-600' : 'text-slate-500'}`}>
                  {metaAtual?.metaQuantidade ? `${pctQtd.toFixed(0)}%` : 'Sem meta'}
                </div>
              </div>
              {metaAtual?.metaQuantidade ? (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pctQtd >= 100 ? 'bg-green-500' : pctQtd >= 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${pctQtd}%` }} />
                </div>
              ) : (
                <div className="text-xs text-slate-400">Clique em "Editar metas" para definir</div>
              )}
            </div>
            {/* Meta faturamento */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-slate-400">Faturamento</div>
                  <div className="text-2xl font-bold text-slate-800">R$ {(faturamentoMes / 1000).toFixed(0)}k
                    {metaAtual?.metaFaturamento ? <span className="text-base font-normal text-slate-400"> / R$ {(metaAtual.metaFaturamento / 1000).toFixed(0)}k</span> : ''}
                  </div>
                </div>
                <div className={`text-sm font-bold ${pctFat >= 100 ? 'text-green-600' : pctFat >= 70 ? 'text-yellow-600' : 'text-slate-500'}`}>
                  {metaAtual?.metaFaturamento ? `${pctFat.toFixed(0)}%` : 'Sem meta'}
                </div>
              </div>
              {metaAtual?.metaFaturamento ? (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pctFat >= 100 ? 'bg-green-500' : pctFat >= 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${pctFat}%` }} />
                </div>
              ) : (
                <div className="text-xs text-slate-400">Clique em "Editar metas" para definir</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="text-green-500" size={18} /><span className="text-xs font-semibold text-slate-600">Faturamento do Mês</span></div>
          <div className="text-xl font-bold text-slate-800">R$ {faturamentoMes.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="text-emerald-500" size={18} /><span className="text-xs font-semibold text-slate-600">Lucro Líquido do Mês</span></div>
          <div className={`text-xl font-bold ${lucroMes >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>R$ {lucroMes.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-sm font-semibold text-slate-700">Alertas de Boletos</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Vencidos</span>
              <Link to="/boletos" className="text-sm font-bold text-red-600 hover:underline">{boletosVencidos}</Link>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Vencem hoje</span>
              <Link to="/boletos" className="text-sm font-bold text-orange-500 hover:underline">{boletosHoje}</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top Vendedores do Mês */}
      <Link to="/vendedores" className="block bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={18} />
            <h2 className="font-semibold text-slate-700">Top Vendedores — {MESES[mesAtual]}</h2>
          </div>
          <span className="text-xs text-blue-600">Ver todos →</span>
        </div>
        {rankingVendedores.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-400 text-sm">
            <UserCheck className="mx-auto mb-2 text-slate-300" size={28} />
            Nenhuma venda registrada no mês
          </div>
        ) : (
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            {rankingVendedores.map((v, i) => {
              const medalha = i === 0 ? { bg: 'bg-yellow-400', text: 'text-yellow-900', emoji: '🥇' }
                : i === 1 ? { bg: 'bg-slate-300', text: 'text-slate-700', emoji: '🥈' }
                : { bg: 'bg-amber-600', text: 'text-white', emoji: '🥉' }
              return (
                <div key={v.nome} className={`flex-1 rounded-xl p-4 border ${i === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{medalha.emoji}</span>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{v.nome}</div>
                      <div className="text-xs text-slate-400">{i + 1}º lugar</div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{v.qtd}</div>
                      <div className="text-xs text-slate-400">venda{v.qtd !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">R$ {v.faturamento.toLocaleString('pt-BR')}</div>
                      <div className="text-xs text-slate-400">faturado</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Link>

      {/* Veículos mais tempo em estoque */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Veículos há mais tempo em estoque</h2>
          <Link to="/estoque" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
        </div>
        {veiculosMaisTempo.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum veículo em estoque</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {veiculosMaisTempo.map(v => (
              <Link key={v.id} to={`/estoque/${v.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{v.marca} {v.modelo} {v.ano}</div>
                  <div className="text-xs text-slate-400">{v.placa} • {v.cor}</div>
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded-full ${
                  v.dias > 90 ? 'bg-red-100 text-red-700' :
                  v.dias > 45 ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {v.dias}d
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-slate-200 shadow-sm`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-semibold text-slate-600">{label}</span></div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
    </div>
  )
}
