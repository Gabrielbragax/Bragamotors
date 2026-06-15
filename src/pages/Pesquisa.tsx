import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Search, Trash2, X, ExternalLink, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import type { SessaoPesquisa, VeiculoPesquisa, InteressePesquisa } from '../types'
import NumInput from '../components/NumInput'

const emptyVeiculo = (): VeiculoPesquisa => ({
  id: uuid(), marca: '', modelo: '', ano: new Date().getFullYear(),
  km: 0, valor: 0, cidade: '', portal: '', link: '', interesse: 'pendente'
})

const emptySessao = (): SessaoPesquisa => ({
  id: uuid(),
  data: new Date().toISOString().split('T')[0],
  titulo: '',
  veiculos: [emptyVeiculo()]
})

const PORTAIS = ['OLX','Webmotors','iCarros','Mercado Livre','Facebook','Instagram','Indica','Outro']

export default function Pesquisa() {
  const { pesquisas, addPesquisa, updatePesquisa, deletePesquisa } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<SessaoPesquisa | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [aba, setAba] = useState<'interesse' | 'sem_interesse'>('interesse')
  const [deletando, setDeletando] = useState<string | null>(null)

  const sorted = [...pesquisas].sort((a, b) => b.data.localeCompare(a.data))

  const abrirNovo = () => { setEditando(emptySessao()); setShowForm(true) }
  const abrirEditar = (s: SessaoPesquisa) => { setEditando({ ...s, veiculos: [...s.veiculos] }); setShowForm(true) }

  const salvar = async () => {
    if (!editando) return
    const existe = pesquisas.find(p => p.id === editando.id)
    if (existe) await updatePesquisa(editando)
    else await addPesquisa(editando)
    setShowForm(false); setEditando(null)
  }

  const marcarInteresse = async (sessaoId: string, veiculoId: string, interesse: InteressePesquisa) => {
    const sessao = pesquisas.find(p => p.id === sessaoId)
    if (!sessao) return
    const updated = {
      ...sessao,
      veiculos: sessao.veiculos.map(v => v.id === veiculoId ? { ...v, interesse } : v)
    }
    await updatePesquisa(updated)
  }

  // Separar veículos por interesse em todas as sessões
  const veiculosInteresse = sorted.flatMap(s =>
    s.veiculos.filter(v => v.interesse === 'interesse').map(v => ({ ...v, sessao: s }))
  )
  const veiculosSemInteresse = sorted.flatMap(s =>
    s.veiculos.filter(v => v.interesse === 'sem_interesse').map(v => ({ ...v, sessao: s }))
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Pesquisa de Veículos</h1>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nova Pesquisa
        </button>
      </div>

      {/* Abas interesse / sem interesse */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        <button onClick={() => setAba('interesse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aba === 'interesse' ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <ThumbsUp size={14} /> Com Interesse
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${aba === 'interesse' ? 'bg-white/20' : 'bg-slate-100'}`}>{veiculosInteresse.length}</span>
        </button>
        <button onClick={() => setAba('sem_interesse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aba === 'sem_interesse' ? 'bg-red-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <ThumbsDown size={14} /> Sem Interesse
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${aba === 'sem_interesse' ? 'bg-white/20' : 'bg-slate-100'}`}>{veiculosSemInteresse.length}</span>
        </button>
      </div>

      {aba === 'interesse' ? (
        /* PÁGINA PRINCIPAL — sessões com veículos pendentes e de interesse */
        <div className="space-y-4">
          {sorted.length === 0 ? (
            <EmptyState onNew={abrirNovo} />
          ) : (
            sorted.map(sessao => {
              const visiveis = sessao.veiculos.filter(v => v.interesse !== 'sem_interesse')
              if (visiveis.length === 0) return null
              const aberto = expandido === sessao.id
              return (
                <SessaoCard key={sessao.id} sessao={sessao} veiculos={visiveis}
                  aberto={aberto} onToggle={() => setExpandido(aberto ? null : sessao.id)}
                  onEditar={() => abrirEditar(sessao)}
                  onDeletar={() => setDeletando(sessao.id)}
                  onMarcar={marcarInteresse}
                />
              )
            })
          )}
        </div>
      ) : (
        /* SEM INTERESSE */
        <div className="space-y-4">
          {veiculosSemInteresse.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 text-slate-400 text-sm">
              Nenhum veículo marcado como sem interesse
            </div>
          ) : (
            sorted.map(sessao => {
              const visiveis = sessao.veiculos.filter(v => v.interesse === 'sem_interesse')
              if (visiveis.length === 0) return null
              const aberto = expandido === sessao.id + '_si'
              return (
                <SessaoCard key={sessao.id} sessao={sessao} veiculos={visiveis}
                  aberto={aberto} onToggle={() => setExpandido(aberto ? null : sessao.id + '_si')}
                  onEditar={() => abrirEditar(sessao)}
                  onDeletar={() => setDeletando(sessao.id)}
                  onMarcar={marcarInteresse}
                />
              )
            })
          )}
        </div>
      )}

      {/* Modal exclusão */}
      {deletando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="font-bold text-slate-800">Excluir pesquisa?</div>
            <div className="text-sm text-slate-500">Todos os veículos desta pesquisa serão removidos.</div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletando(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
              <button onClick={async () => { await deletePesquisa(deletando!); setDeletando(null) }} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal formulário */}
      {showForm && editando && (
        <PesquisaForm sessao={editando} onChange={setEditando} onSave={salvar} onClose={() => { setShowForm(false); setEditando(null) }} />
      )}
    </div>
  )
}

function SessaoCard({ sessao, veiculos, aberto, onToggle, onEditar, onDeletar, onMarcar }: {
  sessao: SessaoPesquisa
  veiculos: VeiculoPesquisa[]
  aberto: boolean
  onToggle: () => void
  onEditar: () => void
  onDeletar: () => void
  onMarcar: (sessaoId: string, veiculoId: string, i: InteressePesquisa) => void
}) {
  const pendentes = veiculos.filter(v => v.interesse === 'pendente').length
  const interesse = veiculos.filter(v => v.interesse === 'interesse').length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={onToggle}>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
          <Search className="text-blue-600" size={18} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-800">
            {sessao.titulo || `Pesquisa de ${new Date(sessao.data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </div>
          <div className="flex gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(sessao.data + 'T12:00').toLocaleDateString('pt-BR')}</span>
            <span>•</span>
            <span>{veiculos.length} veículo{veiculos.length !== 1 ? 's' : ''}</span>
            {interesse > 0 && <><span>•</span><span className="text-green-600 font-semibold">{interesse} com interesse</span></>}
            {pendentes > 0 && <><span>•</span><span className="text-amber-600 font-semibold">{pendentes} pendente{pendentes !== 1 ? 's' : ''}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); onEditar() }} className="text-xs text-blue-600 hover:underline px-2 py-1">Editar</button>
          <button onClick={e => { e.stopPropagation(); onDeletar() }} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
          {aberto ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </div>

      {aberto && (
        <div className="border-t border-slate-100">
          {veiculos.map(v => (
            <div key={v.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-slate-50 last:border-0 ${
              v.interesse === 'interesse' ? 'bg-green-50/50' : v.interesse === 'sem_interesse' ? 'bg-red-50/50' : ''
            }`}>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{v.marca} {v.modelo} {v.ano}</div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                  <span>{v.km > 0 ? v.km.toLocaleString('pt-BR') + ' km' : 'km n/d'}</span>
                  {v.cidade && <><span>•</span><span>{v.cidade}</span></>}
                  {v.portal && <><span>•</span><span className="text-blue-600">{v.portal}</span></>}
                  {v.link && (
                    <a href={v.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:underline"
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink size={10} /> Ver anúncio
                    </a>
                  )}
                </div>
                {v.observacoes && <div className="text-xs text-slate-400 mt-1 italic">{v.observacoes}</div>}
              </div>
              <div className="text-lg font-bold text-green-700 shrink-0">
                {v.valor > 0 ? `R$ ${v.valor.toLocaleString('pt-BR')}` : '—'}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onMarcar(sessao.id, v.id, v.interesse === 'interesse' ? 'pendente' : 'interesse')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    v.interesse === 'interesse'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}>
                  <ThumbsUp size={12} /> Interesse
                </button>
                <button
                  onClick={() => onMarcar(sessao.id, v.id, v.interesse === 'sem_interesse' ? 'pendente' : 'sem_interesse')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    v.interesse === 'sem_interesse'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'border-red-300 text-red-500 hover:bg-red-50'
                  }`}>
                  <ThumbsDown size={12} /> Sem interesse
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
      <Search className="mx-auto text-slate-300 mb-3" size={48} />
      <p className="text-slate-500 font-medium">Nenhuma pesquisa ainda</p>
      <p className="text-slate-400 text-sm mt-1">Clique em "Nova Pesquisa" para registrar veículos encontrados</p>
      <button onClick={onNew} className="mt-4 inline-flex items-center gap-2 text-blue-600 text-sm hover:underline">
        <Plus size={14} /> Nova Pesquisa
      </button>
    </div>
  )
}

function PesquisaForm({ sessao, onChange, onSave, onClose }: {
  sessao: SessaoPesquisa
  onChange: (s: SessaoPesquisa) => void
  onSave: () => void
  onClose: () => void
}) {
  const set = <K extends keyof SessaoPesquisa>(k: K, v: SessaoPesquisa[K]) => onChange({ ...sessao, [k]: v })

  const addVeiculo = () => onChange({ ...sessao, veiculos: [...sessao.veiculos, emptyVeiculo()] })
  const remVeiculo = (id: string) => onChange({ ...sessao, veiculos: sessao.veiculos.filter(v => v.id !== id) })
  const updVeiculo = (id: string, k: keyof VeiculoPesquisa, v: unknown) =>
    onChange({ ...sessao, veiculos: sessao.veiculos.map(x => x.id === id ? { ...x, [k]: v } : x) })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg">Pesquisa de Veículos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Data e título */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Data da pesquisa</label>
              <input className="input" type="date" value={sessao.data} onChange={e => set('data', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Título (opcional)</label>
              <input className="input" placeholder="Ex: Celta 2010-2012..." value={sessao.titulo || ''} onChange={e => set('titulo', e.target.value)} />
            </div>
          </div>

          {/* Veículos */}
          <div className="space-y-4">
            <div className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-2">Veículos encontrados</div>
            {sessao.veiculos.map((v, i) => (
              <div key={v.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Veículo #{i + 1}</span>
                  {sessao.veiculos.length > 1 && (
                    <button onClick={() => remVeiculo(v.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Marca</label>
                    <input className="input text-sm" value={v.marca} onChange={e => updVeiculo(v.id, 'marca', e.target.value)} placeholder="Ex: Fiat" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Modelo</label>
                    <input className="input text-sm" value={v.modelo} onChange={e => updVeiculo(v.id, 'modelo', e.target.value)} placeholder="Ex: Uno" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Ano</label>
                    <NumInput className="input" value={v.ano} onChange={val => updVeiculo(v.id, 'ano', val)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">KM</label>
                    <NumInput className="input" value={v.km} onChange={val => updVeiculo(v.id, 'km', val)} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Valor (R$)</label>
                    <NumInput className="input" value={v.valor} onChange={val => updVeiculo(v.id, 'valor', val)} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Cidade</label>
                    <input className="input text-sm" value={v.cidade} onChange={e => updVeiculo(v.id, 'cidade', e.target.value)} placeholder="Ex: São Paulo" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Portal</label>
                    <select className="input text-sm" value={v.portal} onChange={e => updVeiculo(v.id, 'portal', e.target.value)}>
                      <option value="">Selecionar...</option>
                      {PORTAIS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Link do anúncio</label>
                    <input className="input text-sm" value={v.link} onChange={e => updVeiculo(v.id, 'link', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Observações</label>
                  <input className="input text-sm" value={v.observacoes || ''} onChange={e => updVeiculo(v.id, 'observacoes', e.target.value)} placeholder="Detalhes adicionais..." />
                </div>
              </div>
            ))}
            <button onClick={addVeiculo} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-2.5 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Adicionar veículo
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={onSave} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Salvar Pesquisa</button>
        </div>
      </div>
    </div>
  )
}
