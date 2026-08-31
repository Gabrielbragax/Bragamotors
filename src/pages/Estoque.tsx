import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Plus, Car, Clock, Search, CheckCircle, Printer } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { useState } from 'react'

type Aba = 'ativos' | 'vendidos'

export default function Estoque() {
  const veiculos = useStore(s => s.veiculos)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'estoque' | 'preparacao'>('todos')
  const [aba, setAba] = useState<Aba>('ativos')

  const ativos = veiculos.filter(v => v.status !== 'vendido')
  const vendidos = veiculos.filter(v => v.status === 'vendido')

  const filtrados = (aba === 'ativos' ? ativos : vendidos).filter(v => {
    const matchStatus = aba === 'vendidos' || filtroStatus === 'todos' || v.status === filtroStatus
    const matchBusca = !busca || [v.marca, v.modelo, v.placa, v.cor, String(v.ano)].some(
      f => f.toLowerCase().includes(busca.toLowerCase())
    )
    return matchStatus && matchBusca
  })

  const statusColor: Record<string, string> = {
    estoque: 'bg-green-100 text-green-700',
    preparacao: 'bg-yellow-100 text-yellow-700',
    vendido: 'bg-blue-100 text-blue-700',
  }
  const statusLabel: Record<string, string> = {
    estoque: 'Em Estoque',
    preparacao: 'Em Preparação',
    vendido: 'Vendido',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Estoque de Veículos</h1>
        <div className="flex gap-2">
          <Link to="/estoque/imprimir" className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Printer size={16} /> Imprimir Lista
          </Link>
          <Link to="/estoque/novo" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Cadastrar Veículo
          </Link>
        </div>
      </div>

      {/* Abas principais */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        <button
          onClick={() => setAba('ativos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aba === 'ativos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Car size={14} />
          Em Estoque / Preparação
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${aba === 'ativos' ? 'bg-white/20' : 'bg-slate-100'}`}>{ativos.length}</span>
        </button>
        <button
          onClick={() => setAba('vendidos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aba === 'vendidos' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <CheckCircle size={14} />
          Vendidos
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${aba === 'vendidos' ? 'bg-white/20' : 'bg-slate-100'}`}>{vendidos.length}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por marca, modelo, placa..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        {aba === 'ativos' && (
          <div className="flex gap-2">
            {(['todos', 'estoque', 'preparacao'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFiltroStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  filtroStatus === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s === 'todos' ? 'Todos' : s === 'estoque' ? 'Em Estoque' : 'Em Preparação'}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <Car className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-400 text-sm">
            {aba === 'ativos' ? 'Nenhum veículo em estoque' : 'Nenhum veículo vendido'}
          </p>
          {aba === 'ativos' && (
            <Link to="/estoque/novo" className="mt-4 inline-flex items-center gap-2 text-blue-600 text-sm hover:underline">
              <Plus size={14} /> Cadastrar primeiro veículo
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filtrados.map((v, idx) => {
            const diasTotal = differenceInDays(new Date(), new Date(v.dataEntrada))
            const custoPrep = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
            const custoTotal = v.valorPago + custoPrep + (v.trafegoPago || 0)
            const lucro = v.venda ? v.venda.valorVenda - custoTotal : null
            return (
              <Link
                key={v.id}
                to={`/estoque/${v.id}`}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors ${idx !== 0 ? 'border-t border-slate-100' : ''}`}
              >
                {/* Foto pequena */}
                {v.fotos.length > 0 ? (
                  <img src={v.fotos[0]} alt={v.modelo} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Car className="text-slate-300" size={20} />
                  </div>
                )}

                {/* Nome e info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">
                    {v.marca} {v.modelo}{v.versao ? ` ${v.versao}` : ''}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {v.ano}/{v.anoModelo} • {v.cor} • {v.km > 0 ? v.km.toLocaleString('pt-BR') + ' km' : 'km n/d'}
                  </div>
                </div>

                {/* Placa */}
                <div className="shrink-0 border-2 border-slate-800 rounded-md px-2 py-0.5 text-center" style={{ minWidth: 72 }}>
                  <div className="text-xs font-black font-mono tracking-widest text-slate-900 leading-tight">{v.placa}</div>
                </div>

                {/* Status */}
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 hidden md:inline ${statusColor[v.status]}`}>
                  {statusLabel[v.status]}
                </span>

                {/* Custo + Preços + Lucro potencial */}
                {v.status !== 'vendido' && (
                  <div className="shrink-0 hidden lg:flex gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Custo Total</div>
                      <div className="text-sm font-bold text-slate-600">R$ {custoTotal.toLocaleString('pt-BR')}</div>
                    </div>
                    {v.precoAvista ? (
                      <div className="text-right border-l border-slate-100 pl-4">
                        <div className="text-xs text-slate-400">À Vista</div>
                        <div className="text-sm font-bold text-green-700">R$ {v.precoAvista.toLocaleString('pt-BR')}</div>
                        <div className={`text-xs font-semibold ${v.precoAvista - custoTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {v.precoAvista - custoTotal >= 0 ? '+' : ''}R$ {(v.precoAvista - custoTotal).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ) : null}
                    {v.precoTroca ? (
                      <div className="text-right border-l border-slate-100 pl-4">
                        <div className="text-xs text-slate-400">Troca</div>
                        <div className="text-sm font-bold text-amber-700">R$ {v.precoTroca.toLocaleString('pt-BR')}</div>
                        <div className={`text-xs font-semibold ${v.precoTroca - custoTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {v.precoTroca - custoTotal >= 0 ? '+' : ''}R$ {(v.precoTroca - custoTotal).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Dias / Lucro */}
                <div className="shrink-0 text-right">
                  {v.status !== 'vendido' ? (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      diasTotal > 90 ? 'bg-red-100 text-red-700' :
                      diasTotal > 45 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      <Clock size={10} />
                      {diasTotal}d
                    </div>
                  ) : lucro !== null ? (
                    <div>
                      <div className="text-xs text-slate-400">Lucro</div>
                      <div className={`text-sm font-bold ${lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {lucro.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
