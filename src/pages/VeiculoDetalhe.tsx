import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ChevronLeft, Edit, CheckCircle, Plus, Trash2, Upload, TrendingUp, User, ShieldCheck, ShieldOff, ShieldX } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { v4 as uuid } from '../utils/uuid'
import type { Venda, FormaPagamento, FormaPgto, ServicoPosVenda, Boleto, ClienteVenda, CartaoCredito } from '../types'
import NumInput from '../components/NumInput'


function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

export default function VeiculoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { veiculos, clientes, vendedores, updateVeiculo, deleteVeiculo, addCliente, updateCliente } = useStore()
  const v = veiculos.find(x => x.id === id)
  const [tab, setTab] = useState<'resumo' | 'venda' | 'posVenda'>('resumo')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null)

  const showToast = (msg: string, error?: boolean) => {
    setToast({ msg, error })
    setTimeout(() => setToast(null), 3000)
  }

  if (!v) return <div className="p-8 text-slate-400">Veículo não encontrado.</div>

  const hoje = new Date()
  const diasTotal = differenceInDays(hoje, new Date(v.dataEntrada))
  const diasPrep = v.dataInicioEstoque
    ? differenceInDays(new Date(v.dataInicioEstoque), new Date(v.dataEntrada))
    : v.status === 'preparacao' ? diasTotal : null
  const diasEstoque = v.dataInicioEstoque
    ? differenceInDays(hoje, new Date(v.dataInicioEstoque))
    : v.status === 'estoque' ? diasTotal : null
  const custoPrep = v.servicosPreparacao.reduce((a, s) => a + s.valor, 0)
  const custoPosVenda = v.servicosPosVenda.reduce((a, s) => a + s.valor, 0)
  const custo = v.valorPago + custoPrep + (v.trafegoPago || 0)
  const totalBoletos = v.venda ? (v.venda.boletos || []).reduce((a, b) => a + b.valor, 0) : 0
  const valorVendaLiquido = v.venda ? v.venda.valorVenda - totalBoletos : 0
  const lucroB = v.venda ? valorVendaLiquido - v.valorPago : null
  const lucroLTotal = v.venda ? valorVendaLiquido - custo - custoPosVenda : null
  const percentualConsig = v.consignado ? (v.percentualConsignado || 0) : 100
  const lucroL = lucroLTotal !== null ? lucroLTotal * (percentualConsig / 100) : null
  const pctLucro = lucroL && v.venda ? (lucroL / v.venda.valorVenda) * 100 : null

  const addPosVenda = () => {
    const novo: ServicoPosVenda = { id: uuid(), local: '', servico: '', valor: 0, data: new Date().toISOString().split('T')[0] }
    updateVeiculo({ ...v, servicosPosVenda: [novo, ...v.servicosPosVenda] })
  }
  const updatePosVenda = (sid: string, k: keyof ServicoPosVenda, val: unknown) => {
    updateVeiculo({ ...v, servicosPosVenda: v.servicosPosVenda.map(s => s.id === sid ? { ...s, [k]: val } : s) })
  }
  const removePosVenda = (sid: string) => updateVeiculo({ ...v, servicosPosVenda: v.servicosPosVenda.filter(s => s.id !== sid) })
  const uploadPosArquivo = async (sid: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const b64 = await fileToBase64(file)
    updatePosVenda(sid, 'arquivo', b64); updatePosVenda(sid, 'arquivoNome', file.name)
    e.target.value = ''
  }

  const handleDelete = () => setShowDeleteModal(true)
  const confirmDelete = async () => { await deleteVeiculo(v.id); navigate('/estoque') }

  const clienteVenda = v.venda?.cliente
  const clienteCadastrado = clientes.find(c => c.cpf === clienteVenda?.cpf)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold transition-all ${toast.error ? 'bg-red-600' : 'bg-green-600'} text-white`}>
          <CheckCircle size={16} /> {toast.msg}
        </div>
      )}

      {/* Modal de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="text-red-600" size={18} />
              </div>
              <div>
                <div className="font-bold text-slate-800">Excluir veículo?</div>
                <div className="text-sm text-slate-500">Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/estoque')} className="text-slate-500 hover:text-slate-800"><ChevronLeft size={22} /></button>
        <h1 className="text-xl font-bold text-slate-800 flex-1">{v.marca} {v.modelo} {v.ano} • <span className="text-slate-500 font-normal">{v.placa}</span></h1>
        {v.consignado && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Consignado</span>
        )}
        <Link to={`/estoque/${v.id}/editar`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Edit size={14} /> Editar</Link>
        <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Excluir</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl p-3 border ${v.status === 'estoque' ? 'bg-green-50 border-green-200' : v.status === 'preparacao' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="text-xs text-slate-500">Status</div>
          <div className="font-bold text-slate-800 text-sm mt-1">
            {v.status === 'estoque' ? 'Em Estoque' : v.status === 'preparacao' ? 'Em Preparação' : 'Vendido'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 mb-1">Tempo no negócio</div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            <div>
              <span className="text-xs text-slate-400">Total </span>
              <span className={`font-bold text-sm ${diasTotal > 90 ? 'text-red-600' : diasTotal > 45 ? 'text-orange-500' : 'text-green-600'}`}>{diasTotal}d</span>
            </div>
            {diasPrep !== null && (
              <div>
                <span className="text-xs text-slate-400">Prep </span>
                <span className="font-bold text-sm text-yellow-600">{diasPrep}d</span>
              </div>
            )}
            {diasEstoque !== null && (
              <div>
                <span className="text-xs text-slate-400">Loja </span>
                <span className={`font-bold text-sm ${diasEstoque > 60 ? 'text-red-600' : diasEstoque > 30 ? 'text-orange-500' : 'text-green-600'}`}>{diasEstoque}d</span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <div className="text-xs text-slate-500">Custo total</div>
          <div className="font-bold text-slate-800 mt-1">R$ {custo.toLocaleString('pt-BR')}</div>
        </div>
        {v.venda && (
          <div className="bg-white rounded-xl p-3 border border-slate-200">
            <div className="text-xs text-slate-500">Venda</div>
            <div className="font-bold text-green-600 mt-1">R$ {v.venda.valorVenda.toLocaleString('pt-BR')}</div>
          </div>
        )}
        {v.status === 'vendido' && v.venda && (() => {
          if (v.venda.semGarantia) return (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Garantia</div>
              <div className="flex items-center gap-1 font-bold text-slate-500 mt-1 text-sm"><ShieldOff size={14} /> Sem garantia</div>
            </div>
          )
          const diasGarantia = differenceInDays(new Date(), new Date(v.venda.dataVenda))
          const ativa = diasGarantia <= 90
          const restantes = 90 - diasGarantia
          return (
            <div className={`rounded-xl p-3 border ${ativa ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-slate-500">Garantia (90 dias)</div>
              <div className={`flex items-center gap-1 font-bold mt-1 text-sm ${ativa ? 'text-green-700' : 'text-red-700'}`}>
                {ativa ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                {ativa ? `Ativa • ${restantes}d restantes` : 'Vencida'}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Cliente da venda */}
      {clienteVenda && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <User className="text-blue-600" size={18} />
          </div>
          <div>
            <div className="font-semibold text-slate-800">{clienteVenda.nome}</div>
            <div className="text-xs text-slate-500">CPF: {clienteVenda.cpf}{clienteVenda.dataNascimento && ` • Nasc: ${new Date(clienteVenda.dataNascimento + 'T12:00').toLocaleDateString('pt-BR')}`}</div>
          </div>
          {!clienteCadastrado && (
            <span className="ml-auto text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Não cadastrado como cliente</span>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[
            { key: 'resumo', label: 'Resumo' },
            { key: 'venda', label: 'Venda' },
            ...(v.status === 'vendido' ? [{ key: 'posVenda', label: 'Pós-Venda' }] : [])
          ].map((t: any) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'resumo' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  ['Km', v.km.toLocaleString('pt-BR') + ' km'], ['Cor', v.cor], ['Combustível', v.combustivel || '-'],
                  ['Chassi', v.chassi || '-'], ['Renavam', v.renavam || '-'],
                  ['Data entrada', new Date(v.dataEntrada).toLocaleDateString('pt-BR')],
                  ['Valor pago', 'R$ ' + v.valorPago.toLocaleString('pt-BR')],
                  ['Laudo Cautelar', v.laudoCautelar ? 'Sim' : 'Não'],
                  ['Documento', v.documentoTipo === 'transferencia' ? 'Transferência' : v.documentoTipo === 'procuracao' ? 'Procuração' : 'Renave'],
                  ['Aquisição', v.aquisicao === 'troca' ? 'Troca' : v.aquisicao === 'portal_online' ? 'Portal Online' : v.aquisicao === 'porta_loja' ? 'Porta da Loja' : 'Repasse'],
                ].map(([k, val]) => (
                  <div key={k} className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                    <div className="font-medium text-slate-800">{val}</div>
                  </div>
                ))}
              </div>

              {v.contratoCompraArquivoNome && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Contrato de compra:</span>
                  <a href={v.contratoCompraArquivo} download={v.contratoCompraArquivoNome} className="text-sm text-blue-600 hover:underline">{v.contratoCompraArquivoNome}</a>
                </div>
              )}

              {v.opcionais.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Opcionais</div>
                  <div className="flex flex-wrap gap-2">
                    {v.opcionais.map(o => <span key={o} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{o}</span>)}
                  </div>
                </div>
              )}

              {v.portaisAnunciado.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Portais anunciados</div>
                  <div className="flex flex-wrap gap-2">
                    {v.portaisAnunciado.map(p => <span key={p} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">{p}</span>)}
                  </div>
                </div>
              )}

              {v.servicosPreparacao.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Serviços de Preparação • R$ {custoPrep.toLocaleString('pt-BR')}</div>
                  <div className="space-y-2">
                    {v.servicosPreparacao.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">{s.local}</span> — {s.servico}
                          <span className="ml-2 text-xs text-slate-400">{s.tipoServico}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.arquivoNome && <a href={s.arquivo} download={s.arquivoNome} className="text-xs text-blue-600 hover:underline">{s.arquivoNome}</a>}
                          <div className="font-semibold text-slate-700">R$ {s.valor.toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {v.observacoes && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observações</div>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{v.observacoes}</p>
                </div>
              )}

              {v.venda && lucroL !== null && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold flex items-center gap-2"><TrendingUp size={16} /> Resultado Financeiro</div>
                    {v.consignado && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-1 rounded-full font-semibold">
                        Consignado — você fica com {percentualConsig}% de R$ {lucroLTotal!.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <div className="text-xs text-slate-400">Valor de venda</div>
                      <div className="text-lg font-bold text-green-400">R$ {v.venda.valorVenda.toLocaleString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Lucro bruto</div>
                      <div className={`text-lg font-bold ${lucroB! >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucroB!.toLocaleString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Custo prep.</div>
                      <div className="text-lg font-bold text-yellow-300">R$ {custoPrep.toLocaleString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Custo pós-venda</div>
                      <div className="text-lg font-bold text-orange-300">R$ {custoPosVenda.toLocaleString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Lucro líquido</div>
                      <div className={`text-lg font-bold ${lucroL >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucroL.toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                  {pctLucro !== null && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="text-xs text-slate-400">Margem líquida:</div>
                      <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${pctLucro >= 10 ? 'bg-green-600' : pctLucro >= 0 ? 'bg-yellow-600' : 'bg-red-600'}`}>{pctLucro.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'venda' && (
            <VendaTab v={v} updateVeiculo={updateVeiculo} clientes={clientes} addCliente={addCliente} updateCliente={updateCliente} vendedores={vendedores} onSaved={showToast} />
          )}

          {tab === 'posVenda' && v.status === 'vendido' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-500">Total pós-venda</div>
                  <div className="text-lg font-bold">R$ {v.servicosPosVenda.reduce((a, s) => a + s.valor, 0).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Já descontado do lucro líquido na aba Resumo</div>
                </div>
                <button onClick={addPosVenda} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              {v.servicosPosVenda.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Nenhum serviço pós-venda</div>}
              {v.servicosPosVenda.map(s => (
                <div key={s.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-700">Serviço Pós-Venda</span>
                    <button onClick={() => removePosVenda(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Local</div>
                      <input className="input" value={s.local} onChange={e => updatePosVenda(s.id, 'local', e.target.value)} placeholder="Oficina / local..." />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Valor (R$)</div>
                      <NumInput value={s.valor} onChange={val => updatePosVenda(s.id, 'valor', val)} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Serviço</div>
                    <input className="input" value={s.servico} onChange={e => updatePosVenda(s.id, 'servico', e.target.value)} placeholder="Descrição..." />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Upload size={12} /> NF/Arquivo
                      <input type="file" className="hidden" onChange={e => uploadPosArquivo(s.id, e)} />
                    </label>
                    {s.arquivoNome && <a href={s.arquivo} download={s.arquivoNome} className="text-xs text-blue-600 hover:underline">{s.arquivoNome}</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function VendaTab({ v, updateVeiculo, clientes, addCliente, updateCliente, vendedores, onSaved }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  v: any, updateVeiculo: (v: any) => void
  clientes: any[], addCliente: (c: any) => void, updateCliente: (c: any) => void
  vendedores?: any[], onSaved?: (msg: string, error?: boolean) => void
}) {
  const [venda, setVenda] = useState<Venda>(v.venda || {
    id: uuid(), vendedor: '', dataVenda: new Date().toISOString().split('T')[0],
    formaPagamento: 'avista' as FormaPagamento, formasPagamento: [],
    valorVenda: 0, boletos: [],
    cliente: { nome: '', cpf: '', dataNascimento: '' }
  })

  const formasPgto: FormaPgto[] = venda.formasPagamento || []

  const toggleForma = (f: FormaPgto) => {
    const atual = venda.formasPagamento || []
    const novas = atual.includes(f) ? atual.filter(x => x !== f) : [...atual, f]
    set('formasPagamento', novas)
  }

  const set = (k: keyof Venda, val: unknown) => setVenda(f => ({ ...f, [k]: val }))
  const setCliente = (k: keyof ClienteVenda, val: string) =>
    setVenda(f => ({ ...f, cliente: { ...f.cliente, [k]: val } as ClienteVenda }))

  const addBoleto = () => {
    const novo: Boleto = { id: uuid(), valor: 0, vencimento: '', pago: false }
    set('boletos', [...(venda.boletos || []), novo])
  }
  const updBoleto = (bid: string, k: keyof Boleto, val: unknown) => {
    set('boletos', (venda.boletos || []).map(b => b.id === bid ? { ...b, [k]: val } : b))
  }
  const remBoleto = (bid: string) => set('boletos', (venda.boletos || []).filter(b => b.id !== bid))

  const uploadContrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const b64 = await fileToBase64(file)
    set('contratoArquivo', b64); set('contratoArquivoNome', file.name)
    e.target.value = ''
  }

  const salvVenda = async () => {
    if (!venda.vendedor || !venda.valorVenda) { onSaved?.('Preencha vendedor e valor de venda.', true); return }
    const updated = { ...v, venda, status: 'vendido' as const }
    await updateVeiculo(updated)

    const cli = venda.cliente
    if (cli?.nome && cli?.cpf) {
      const existing = clientes.find((c: any) => c.cpf === cli.cpf)
      if (existing) {
        const jaTemVeiculo = existing.veiculosComprados.includes(v.id)
        const telefoneNovo = cli.telefone && cli.telefone !== existing.telefone
        if (!jaTemVeiculo || telefoneNovo) {
          await updateCliente({
            ...existing,
            telefone: cli.telefone || existing.telefone,
            veiculosComprados: jaTemVeiculo ? existing.veiculosComprados : [...existing.veiculosComprados, v.id],
          })
        }
      } else {
        await addCliente({ id: uuid(), nome: cli.nome, cpf: cli.cpf, dataNascimento: cli.dataNascimento, telefone: cli.telefone, veiculosComprados: [v.id] })
      }
    }
    onSaved?.('Venda registrada com sucesso!')
  }

  const FORMAS_OPCOES: { key: FormaPgto; label: string; emoji: string; cor: string }[] = [
    { key: 'financiamento', label: 'Financiamento', emoji: '🏦', cor: 'blue' },
    { key: 'troca',         label: 'Troca',          emoji: '🔄', cor: 'amber' },
    { key: 'avista',        label: 'À Vista',         emoji: '💵', cor: 'green' },
    { key: 'entrada',       label: 'Entrada',         emoji: '💰', cor: 'teal' },
    { key: 'boleto',        label: 'Boleto',          emoji: '📄', cor: 'purple' },
    { key: 'cartao',        label: 'Cartão de Crédito', emoji: '💳', cor: 'rose' },
  ]

  const COR: Record<string, string> = {
    blue:   'bg-blue-600 text-white border-blue-600',
    amber:  'bg-amber-500 text-white border-amber-500',
    green:  'bg-green-600 text-white border-green-600',
    teal:   'bg-teal-600 text-white border-teal-600',
    purple: 'bg-purple-600 text-white border-purple-600',
    rose:   'bg-rose-600 text-white border-rose-600',
  }

  return (
    <div className="space-y-5">
      {v.status === 'vendido' && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-700 text-sm">
          <CheckCircle size={16} /> Veículo vendido. Você pode atualizar os dados abaixo.
        </div>
      )}

      {/* Cliente */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Cliente</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-slate-400 mb-1">Nome completo</div>
            <input className="input" value={venda.cliente?.nome || ''} onChange={e => setCliente('nome', e.target.value)} placeholder="Nome do cliente..." />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">CPF</div>
            <input className="input" value={venda.cliente?.cpf || ''} onChange={e => setCliente('cpf', e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Telefone (WhatsApp)</div>
            <input className="input" value={venda.cliente?.telefone || ''} onChange={e => setCliente('telefone', e.target.value)} placeholder="(19) 99999-9999" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Vendedor</div>
          <input className="input" list="vendedores-list" value={venda.vendedor} onChange={e => set('vendedor', e.target.value)} placeholder="Nome do vendedor..." />
          <datalist id="vendedores-list">
            {(vendedores || []).map((vend: any) => <option key={vend.id} value={vend.nome} />)}
          </datalist>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Data da venda</div>
          <input className="input" type="date" value={venda.dataVenda} onChange={e => set('dataVenda', e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Valor de venda (R$)</div>
          <NumInput value={venda.valorVenda} onChange={val => set('valorVenda', val)} placeholder="0" />
        </div>
      </div>

      {/* Multi-seleção de formas de pagamento */}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Como foi negociado? <span className="text-slate-400 normal-case font-normal">(selecione uma ou mais)</span></div>
        <div className="flex flex-wrap gap-2">
          {FORMAS_OPCOES.map(({ key, label, emoji, cor }) => {
            const ativo = formasPgto.includes(key)
            return (
              <button key={key} type="button" onClick={() => toggleForma(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${ativo ? COR[cor] : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}>
                <span>{emoji}</span> {label}
                {ativo && <span className="ml-1 text-xs opacity-80">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seção Troca */}
      {formasPgto.includes('troca') && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
          <div className="text-sm font-semibold text-amber-800">🔄 Veículo na Troca</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Descrição do veículo</div>
              <input className="input" value={venda.veiculoTroca?.descricao || ''} onChange={e => set('veiculoTroca', { ...venda.veiculoTroca, descricao: e.target.value })} placeholder="Marca, modelo, ano, placa..." />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Valor avaliado (R$)</div>
              <NumInput value={venda.veiculoTroca?.valorAvaliado || 0} onChange={val => set('veiculoTroca', { ...venda.veiculoTroca, valorAvaliado: val })} />
            </div>
          </div>
        </div>
      )}

      {/* Seção Entrada */}
      {formasPgto.includes('entrada') && (
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
          <div className="text-sm font-semibold text-teal-800 mb-3">💰 Entrada em Dinheiro</div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Valor da entrada (R$)</div>
            <NumInput className="input max-w-xs" value={venda.valorEntrada || 0} onChange={val => set('valorEntrada', val)} />
          </div>
        </div>
      )}

      {/* Seção Financiamento */}
      {formasPgto.includes('financiamento') && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 space-y-3">
          <div className="text-sm font-semibold text-blue-800">🏦 Financiamento</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Banco</div>
              <input className="input" value={venda.financiamento?.banco || ''} onChange={e => set('financiamento', { ...venda.financiamento, banco: e.target.value })} placeholder="Banco..." />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Valor financiado (R$)</div>
              <NumInput value={venda.financiamento?.valorFinanciado || 0} onChange={val => set('financiamento', { ...venda.financiamento, valorFinanciado: val })} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Nº parcelas</div>
              <NumInput value={venda.financiamento?.numeroParcelas || 0} onChange={val => set('financiamento', { ...venda.financiamento, numeroParcelas: val })} />
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Valor parcela (R$)</div>
              <NumInput value={venda.financiamento?.valorParcela || 0} onChange={val => set('financiamento', { ...venda.financiamento, valorParcela: val })} />
            </div>
          </div>
        </div>
      )}

      {/* Seção Cartão de Crédito */}
      {formasPgto.includes('cartao') && (
        <div className="bg-rose-50 rounded-xl border border-rose-200 p-4 space-y-3">
          <div className="text-sm font-semibold text-rose-800">💳 Cartão de Crédito</div>
          <div className="max-w-xs">
            <div className="text-xs text-slate-500 mb-1">Valor total no cartão (R$)</div>
            <NumInput value={venda.cartaoCredito?.valorTotal || 0} onChange={val => set('cartaoCredito', { ...(venda.cartaoCredito as CartaoCredito), valorTotal: val })} />
          </div>
        </div>
      )}

      {/* Seção Boleto */}
      {formasPgto.includes('boleto') && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm font-semibold text-purple-800">📄 Boletos da Loja</div>
            <button onClick={addBoleto} className="flex items-center gap-1 text-xs text-purple-700 hover:underline"><Plus size={12} /> Adicionar boleto</button>
          </div>
          {(venda.boletos || []).length === 0 && <div className="text-xs text-slate-400">Clique em "Adicionar boleto" para incluir</div>}
          {(venda.boletos || []).map(b => (
            <div key={b.id} className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-24">
                <div className="text-xs text-slate-400 mb-0.5">Valor</div>
                <NumInput value={b.valor} onChange={val => updBoleto(b.id, 'valor', val)} />
              </div>
              <div className="flex-1 min-w-28">
                <div className="text-xs text-slate-400 mb-0.5">Vencimento</div>
                <input className="input" type="date" value={b.vencimento} onChange={e => updBoleto(b.id, 'vencimento', e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <button onClick={() => updBoleto(b.id, 'pago', !b.pago)}
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${b.pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {b.pago ? 'Pago' : 'Aberto'}
                </button>
                <button onClick={() => remBoleto(b.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Contrato de Venda</div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Upload size={14} /> Upload Contrato
            <input type="file" className="hidden" onChange={uploadContrato} accept=".pdf,.jpg,.jpeg,.png" />
          </label>
          {venda.contratoArquivoNome && <a href={venda.contratoArquivo} download={venda.contratoArquivoNome} className="text-sm text-blue-600 hover:underline">{venda.contratoArquivoNome}</a>}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Observações da venda</div>
        <textarea className="input h-16 resize-none" value={venda.observacoes || ''} onChange={e => set('observacoes', e.target.value)} />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${venda.semGarantia ? 'bg-slate-600 border-slate-600' : 'border-slate-300 bg-white'}`}
          onClick={() => set('semGarantia', !venda.semGarantia)}>
          {venda.semGarantia && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div onClick={() => set('semGarantia', !venda.semGarantia)}>
          <div className="text-sm font-semibold text-slate-700">Sem garantia</div>
          <div className="text-xs text-slate-400">Marque se este veículo não possui garantia de 90 dias</div>
        </div>
      </label>

      <button onClick={salvVenda} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors">
        {v.status === 'vendido' ? 'Atualizar Venda' : 'Registrar Venda'}
      </button>
    </div>
  )
}
