import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Car, TrendingUp, Clock, DollarSign, AlertCircle, CheckCircle, Target, Edit2, Save, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Mês sendo visualizado no Dashboard — começa no atual, mas dá pra navegar pra meses passados
  const [mesSel, setMesSel] = useState(mesAtual)
  const [anoSel, setAnoSel] = useState(anoAtual)
  const noMesAtual = mesSel === mesAtual && anoSel === anoAtual

  const irParaMesAnterior = () => {
    if (mesSel === 0) { setMesSel(11); setAnoSel(anoSel - 1) }
    else setMesSel(mesSel - 1)
  }
  const irParaProximoMes = () => {
    if (noMesAtual) return
    if (mesSel === 11) { setMesSel(0); setAnoSel(anoSel + 1) }
    else setMesSel(mesSel + 1)
  }
  const voltarParaHoje = () => { setMesSel(mesAtual); setAnoSel(anoAtual) }

  const [editandoMeta, setEditandoMeta] = useState(false)
  const metaAtual = metas.find(m => m.mes === mesSel && m.ano === anoSel)
  const [metaQtd, setMetaQtd] = useState(metaAtual?.metaQuantidade || 0)
  const [metaFat, setMetaFat] = useState(metaAtual?.metaFaturamento || 0)

  // Se o mês visualizado mudar enquanto o formulário de meta está fechado, sincroniza os campos
  useEffect(() => {
    if (!editandoMeta) {
      setMetaQtd(metaAtual?.metaQuantidade || 0)
      setMetaFat(metaAtual?.metaFaturamento || 0)
    }
  }, [mesSel, anoSel]) // eslint-disable-line react-hooks/exhaustive-deps

  const emEstoque = veiculos.filter(v => v.status === 'estoque')
  const emPreparacao = veiculos.filter(v => v.status === 'preparacao')
  const vendidos = veiculos.filter(v => v.status === 'vendido')

  const totalCustoEstoque = emEstoque.reduce((acc, v) => {
    const cp = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
    return acc + v.valorPago + cp + (v.trafegoPago || 0)
  }, 0)

  const vendidosMes = vendidos.filter(v => {
    if (!v.venda) return false
    const d = new Date(v.venda.dataVenda)
    return d.getMonth() === mesSel && d.getFullYear() === anoSel
  })

  const faturamentoMes = vendidosMes.reduce((acc, v) => {
    const totalBoletos = (v.venda?.boletos || []).reduce((a, b) => a + b.valor, 0)
    return acc + (v.venda?.valorVenda || 0) - totalBoletos
  }, 0)
  // Custo pós-venda entra pelo mês em que o SERVIÇO foi feito (não o mês da venda) —
  // mesma lógica de "boletos pagos no mês", já que a despesa acontece quando é gasta de verdade.
  // Se o veículo é consignado, só a % combinada desse custo entra como "meu" gasto.
  const custoPosVendaMes = veiculos.flatMap(v => {
    const pct = v.consignado ? (v.percentualConsignado || 0) / 100 : 1
    return (v.servicosPosVenda || [])
      .filter(s => { const d = new Date(s.data); return d.getMonth() === mesSel && d.getFullYear() === anoSel })
      .map(s => s.valor * pct)
  }).reduce((a, x) => a + x, 0)
  const lucroMes = vendidosMes.reduce((acc, v) => {
    const cp = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
    const totalBoletos = (v.venda?.boletos || []).reduce((a, b) => a + b.valor, 0)
    const lucroBase = (v.venda?.valorVenda || 0) - totalBoletos - v.valorPago - cp - (v.trafegoPago || 0)
    const pct = v.consignado ? (v.percentualConsignado || 0) / 100 : 1
    return acc + lucroBase * pct
  }, 0) - custoPosVendaMes

  const veiculosMaisTempo = [...emEstoque, ...emPreparacao]
    .map(v => ({ ...v, dias: differenceInDays(new Date(), new Date(v.dataEntrada)) }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 5)

  const boletosVencidos = veiculos.flatMap(v =>
    (v.venda?.boletos || []).filter(b => !b.pago && new Date(b.vencimento) < new Date())
  ).length

  // Boletos pendentes (possível lucro) — todos os não pagos
  const boletosPendentes = veiculos.flatMap(v => (v.venda?.boletos || []).filter(b => !b.pago))
  const boletosPendentesValor = boletosPendentes.reduce((a, b) => a + b.valor, 0)

  // Boletos pendentes que vencem no mês visualizado
  const boletosPendentesMes = veiculos.flatMap(v => (v.venda?.boletos || []).filter(b => {
    if (b.pago) return false
    const d = new Date(b.vencimento)
    return d.getMonth() === mesSel && d.getFullYear() === anoSel
  }))
  const boletosPendentesMesValor = boletosPendentesMes.reduce((a, b) => a + b.valor, 0)

  // Boletos pagos no mês visualizado
  const boletosPagosMes = veiculos.flatMap(v => (v.venda?.boletos || []).filter(b => {
    if (!b.pago) return false
    const ref = b.dataPagamento || b.vencimento
    const d = new Date(ref)
    return d.getMonth() === mesSel && d.getFullYear() === anoSel
  }))
  const boletosPagosMesValor = boletosPagosMes.reduce((a, b) => a + b.valor, 0)

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

  const salvarMeta = async () => {
    await upsertMeta({ ano: anoSel, mes: mesSel, metaQuantidade: metaQtd, metaFaturamento: metaFat })
    setEditandoMeta(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex items-center gap-1">
          <button onClick={irParaMesAnterior} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <div className="text-sm font-semibold text-slate-600 w-32 text-center">{MESES[mesSel]} {anoSel}</div>
          <button onClick={irParaProximoMes} disabled={noMesAtual}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed">
            <ChevronRight size={18} />
          </button>
          {!noMesAtual && (
            <button onClick={voltarParaHoje} className="ml-2 text-xs text-blue-600 hover:underline font-medium">
              Hoje
            </button>
          )}
        </div>
      </div>

      {!noMesAtual && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Clock size={13} />
          Vendas, faturamento, lucro e boletos abaixo são de <strong>{MESES[mesSel]}/{anoSel}</strong> — Em Estoque, Em Preparação e Custo do Estoque sempre mostram a situação atual.
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<Car className="text-blue-500" size={22} />} label="Em Estoque" value={emEstoque.length} bg="bg-blue-50" to="/estoque" />
        <Card icon={<Clock className="text-yellow-500" size={22} />} label="Em Preparação" value={emPreparacao.length} bg="bg-yellow-50" to="/estoque" />
        <Card icon={<CheckCircle className="text-green-500" size={22} />} label="Vendidos no mês" value={vendidosMes.length} bg="bg-green-50" to="/vendas" />
        <Card icon={<DollarSign className="text-purple-500" size={22} />} label="Custo do Estoque" value={totalCustoEstoque >= 1000 ? `R$ ${(totalCustoEstoque / 1000).toFixed(0)}k` : `R$ ${totalCustoEstoque.toLocaleString('pt-BR')}`} bg="bg-purple-50" to="/estoque" />
      </div>

      {/* Metas do mês */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="text-blue-500" size={20} />
            <span className="font-semibold text-slate-700">Metas — {MESES[mesSel]}</span>
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
        <Link to="/vendas" className="bg-green-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="text-green-500" size={18} /><span className="text-xs font-semibold text-slate-600">Faturamento do Mês</span></div>
          <div className="text-xl font-bold text-slate-800">R$ {faturamentoMes.toLocaleString('pt-BR')}</div>
        </Link>
        <Link to="/vendas" className="bg-emerald-50 rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="text-emerald-500" size={18} /><span className="text-xs font-semibold text-slate-600">Lucro Líquido do Mês</span></div>
          <div className={`text-xl font-bold ${lucroMes >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>R$ {lucroMes.toLocaleString('pt-BR')}</div>
          {custoPosVendaMes > 0 && (
            <div className="text-xs text-orange-600 mt-1">já descontado R$ {custoPosVendaMes.toLocaleString('pt-BR')} de pós-venda no mês</div>
          )}
        </Link>
        <Link to="/boletos" className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-sm font-semibold text-slate-700">Alertas de Boletos</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Vencidos</span>
              <span className="text-sm font-bold text-red-600">{boletosVencidos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Vencem hoje</span>
              <span className="text-sm font-bold text-orange-500">{boletosHoje}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Boletos — separado do lucro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/boletos" className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="text-yellow-500" size={18} />
            <span className="text-xs font-semibold text-slate-600">Boletos Pendentes <span className="text-yellow-600 font-bold">(Possível Lucro)</span></span>
          </div>
          <div className="text-xl font-bold text-yellow-700">R$ {boletosPendentesValor.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-slate-400 mt-1">{boletosPendentes.length} boleto{boletosPendentes.length !== 1 ? 's' : ''} em aberto — não incluso no lucro</div>
        </Link>
        <Link to="/boletos" className="bg-orange-50 rounded-xl p-4 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="text-orange-500" size={18} />
            <span className="text-xs font-semibold text-slate-600">Boletos a Vencer — {MESES[mesSel]}</span>
          </div>
          <div className="text-xl font-bold text-orange-700">R$ {boletosPendentesMesValor.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-slate-400 mt-1">{boletosPendentesMes.length} boleto{boletosPendentesMes.length !== 1 ? 's' : ''} com vencimento neste mês</div>
        </Link>
        <Link to="/boletos" className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="text-blue-500" size={18} />
            <span className="text-xs font-semibold text-slate-600">Boletos Pagos — {MESES[mesSel]}</span>
          </div>
          <div className="text-xl font-bold text-blue-700">R$ {boletosPagosMesValor.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-slate-400 mt-1">{boletosPagosMes.length} boleto{boletosPagosMes.length !== 1 ? 's' : ''} recebido{boletosPagosMes.length !== 1 ? 's' : ''} no mês</div>
        </Link>
      </div>

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

function Card({ icon, label, value, bg, to }: { icon: React.ReactNode; label: string; value: string | number; bg: string; to?: string }) {
  const inner = (
    <>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-semibold text-slate-600">{label}</span></div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
    </>
  )
  if (to) return <Link to={to} className={`${bg} rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow block`}>{inner}</Link>
  return <div className={`${bg} rounded-xl p-4 border border-slate-200 shadow-sm`}>{inner}</div>
}
