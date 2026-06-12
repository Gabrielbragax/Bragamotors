import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { Car, Check, AlertCircle, DollarSign, Globe, Edit2, Save } from 'lucide-react'
import { PORTAIS_DISPONIVEIS } from '../types'
import NumInput from '../components/NumInput'

export default function Marketing() {
  const veiculos = useStore(s => s.veiculos)
  const updateVeiculo = useStore(s => s.updateVeiculo)
  const [portalFiltro, setPortalFiltro] = useState<string>('todos')
  const [editandoTrafego, setEditandoTrafego] = useState<string | null>(null)
  const [trafegoTemp, setTrafegoTemp] = useState(0)

  const ativos = veiculos.filter(v => v.status !== 'vendido')
  const semAnuncio = ativos.filter(v => (v.portaisAnunciado || []).length === 0)
  const totalTrafego = ativos.reduce((a, v) => a + (v.trafegoPago || 0), 0)
  const contagemPortal = PORTAIS_DISPONIVEIS.map(p => ({
    portal: p,
    count: ativos.filter(v => (v.portaisAnunciado || []).includes(p)).length,
  })).sort((a, b) => b.count - a.count)

  const filtrados = portalFiltro === 'todos'
    ? ativos
    : portalFiltro === 'sem_anuncio'
    ? semAnuncio
    : ativos.filter(v => (v.portaisAnunciado || []).includes(portalFiltro))

  const togglePortal = (veiculoId: string, portal: string) => {
    const veiculo = veiculos.find(x => x.id === veiculoId)
    if (!veiculo) return
    const arr = veiculo.portaisAnunciado || []
    updateVeiculo({
      ...veiculo,
      portaisAnunciado: arr.includes(portal) ? arr.filter(p => p !== portal) : [...arr, portal],
    })
  }

  const salvarTrafego = (veiculoId: string) => {
    const veiculo = veiculos.find(x => x.id === veiculoId)
    if (!veiculo) return
    updateVeiculo({ ...veiculo, trafegoPago: trafegoTemp })
    setEditandoTrafego(null)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Marketing</h1>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Car className="text-blue-500" size={18} /><span className="text-xs font-semibold text-slate-500">Em estoque</span></div>
          <div className="text-2xl font-bold text-slate-800">{ativos.length}</div>
        </div>
        <div className={`rounded-xl p-4 border shadow-sm ${semAnuncio.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={semAnuncio.length > 0 ? 'text-red-500' : 'text-green-500'} size={18} />
            <span className="text-xs font-semibold text-slate-500">Sem anúncio</span>
          </div>
          <div className={`text-2xl font-bold ${semAnuncio.length > 0 ? 'text-red-700' : 'text-green-700'}`}>{semAnuncio.length}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="text-purple-500" size={18} /><span className="text-xs font-semibold text-slate-500">Invest. tráfego</span></div>
          <div className="text-xl font-bold text-purple-700">R$ {totalTrafego.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Globe className="text-green-500" size={18} /><span className="text-xs font-semibold text-slate-500">Portais usados</span></div>
          <div className="text-2xl font-bold text-slate-800">{contagemPortal.filter(p => p.count > 0).length}</div>
        </div>
      </div>

      {/* Portais em uso — clique para filtrar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">Veículos por portal <span className="text-xs text-slate-400 font-normal">(clique para filtrar)</span></div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPortalFiltro('todos')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${portalFiltro === 'todos' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Todos ({ativos.length})
          </button>
          {contagemPortal.map(({ portal, count }) => (
            <button
              key={portal}
              onClick={() => setPortalFiltro(portalFiltro === portal ? 'todos' : portal)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${portalFiltro === portal ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {portal} ({count})
            </button>
          ))}
          <button
            onClick={() => setPortalFiltro(portalFiltro === 'sem_anuncio' ? 'todos' : 'sem_anuncio')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${portalFiltro === 'sem_anuncio' ? 'bg-red-600 text-white border-red-600' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
          >
            ⚠ Sem anúncio ({semAnuncio.length})
          </button>
        </div>
      </div>

      {/* Lista de veículos */}
      {ativos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <Car className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-400 text-sm mb-3">Nenhum veículo em estoque</p>
          <Link to="/estoque/novo" className="text-sm text-blue-600 hover:underline">Cadastrar veículo →</Link>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400 text-sm">
          Nenhum veículo neste filtro
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(v => {
            const isEditTrafego = editandoTrafego === v.id
            return (
              <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  {v.fotos[0] ? (
                    <img src={v.fotos[0]} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Car className="text-slate-300" size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <div>
                        <Link to={`/estoque/${v.id}`} className="font-bold text-slate-800 hover:text-blue-600">
                          {v.marca} {v.modelo} {v.ano} — {v.placa}
                        </Link>
                        <div className="text-xs text-slate-400 mt-0.5">{v.cor} • {v.km.toLocaleString('pt-BR')} km</div>
                      </div>
                      {/* Tráfego pago — editável inline */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-xs text-slate-400">Tráfego pago:</div>
                        {isEditTrafego ? (
                          <div className="flex items-center gap-1">
                            <NumInput
                              className="input !w-28 text-sm"
                              value={trafegoTemp}
                              onChange={setTrafegoTemp}
                              prefix="R$"
                            />
                            <button onClick={() => salvarTrafego(v.id)} className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                              <Save size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditandoTrafego(v.id); setTrafegoTemp(v.trafegoPago || 0) }}
                            className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full hover:bg-purple-100"
                          >
                            R$ {(v.trafegoPago || 0).toLocaleString('pt-BR')}
                            <Edit2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Alert sem anúncio */}
                    {(v.portaisAnunciado || []).length === 0 && (
                      <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mb-2 inline-flex items-center gap-1">
                        <AlertCircle size={12} /> Não está anunciado em nenhum portal!
                      </div>
                    )}

                    {/* Portais — checkboxes clicáveis */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PORTAIS_DISPONIVEIS.map(portal => {
                        const ativo = (v.portaisAnunciado || []).includes(portal)
                        return (
                          <button
                            key={portal}
                            onClick={() => togglePortal(v.id, portal)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                              ativo
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {ativo && <Check size={10} />}
                            {portal}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
