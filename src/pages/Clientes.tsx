import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, User, Search, X } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import type { Cliente } from '../types'

export default function Clientes() {
  const { clientes, veiculos, addCliente, updateCliente } = useStore()
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<Cliente | null | 'novo'>(null)
  const [form, setForm] = useState<Partial<Cliente>>({})

  const filtrados = clientes.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf.includes(busca) || (c.telefone || '').includes(busca)
  )

  const openNovo = () => { setForm({ nome: '', cpf: '', telefone: '', email: '', endereco: '', veiculosComprados: [] }); setModal('novo') }
  const openEditar = (c: Cliente) => { setForm(c); setModal(c) }
  const set = (k: keyof Cliente, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const salvar = () => {
    if (!form.nome || !form.cpf) { alert('Preencha nome e CPF'); return }
    if (modal === 'novo') addCliente({ ...form, id: uuid(), veiculosComprados: [] } as Cliente)
    else updateCliente({ ...form, id: (modal as Cliente).id } as Cliente)
    setModal(null)
  }

  const getVeiculosCliente = (c: Cliente) => veiculos.filter(v => c.veiculosComprados.includes(v.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <button onClick={openNovo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar por nome, CPF, telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-sm">
          <User className="mx-auto text-slate-300 mb-3" size={40} />
          Nenhum cliente cadastrado
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(c => {
            const comprados = getVeiculosCliente(c)
            return (
              <button key={c.id} onClick={() => openEditar(c)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="text-blue-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{c.nome}</div>
                    <div className="text-xs text-slate-400 mt-0.5">CPF: {c.cpf}</div>
                    {c.telefone && <div className="text-xs text-slate-400">{c.telefone}</div>}
                    {comprados.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {comprados.map(v => (
                          <span key={v.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{v.marca} {v.modelo}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">{modal === 'novo' ? 'Novo Cliente' : 'Editar Cliente'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { k: 'nome', label: 'Nome completo *' },
                { k: 'cpf', label: 'CPF *' },
                { k: 'telefone', label: 'Telefone' },
                { k: 'email', label: 'E-mail' },
                { k: 'endereco', label: 'Endereço' },
              ].map(({ k, label }) => (
                <div key={k}>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">{label}</div>
                  <input className="input" value={(form as any)[k] || ''} onChange={e => set(k as keyof Cliente, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancelar</button>
              <button onClick={salvar} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
