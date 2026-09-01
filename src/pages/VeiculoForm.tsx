import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import type { Veiculo, ServicoPreparacao, AquisicaoType, DocumentType, TipoServico } from '../types'
import { OPCIONAIS_DISPONIVEIS, TIPO_SERVICO_LABELS } from '../types'
import { ChevronLeft, Plus, Trash2, Upload, Check, AlertCircle, Percent } from 'lucide-react'
import { v4 as uuid } from '../utils/uuid'
import BrandModelSelector from '../components/BrandModelSelector'
import NumInput from '../components/NumInput'
import AnoSelector from '../components/AnoSelector'

const AQUISICAO_LABELS: Record<AquisicaoType, string> = {
  troca: 'Troca', portal_online: 'Portal Online', porta_loja: 'Porta da Loja', repasse: 'Repasse'
}
const DOC_LABELS: Record<DocumentType, string> = {
  transferencia: 'Transferência', procuracao: 'Procuração', renave: 'Renave'
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

export default function VeiculoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { veiculos, addVeiculo, updateVeiculo } = useStore()
  const existing = id && id !== 'novo' ? veiculos.find(v => v.id === id) : undefined

  const [tab, setTab] = useState<'dados' | 'opcionais' | 'preparacao' | 'consignado'>('dados')

  const [form, setForm] = useState<Partial<Veiculo>>({
    placa: '', marca: '', modelo: '', versao: '', ano: new Date().getFullYear(),
    anoModelo: new Date().getFullYear(), cor: '', km: 0, combustivel: 'Gasolina',
    chassi: '', renavam: '', dataEntrada: new Date().toISOString().split('T')[0],
    valorPago: 0, aquisicao: 'porta_loja', documentoTipo: 'transferencia',
    laudoCautelar: false, status: 'preparacao', opcionais: [], fotos: [],
    portaisAnunciado: [], trafegoPago: 0, servicosPreparacao: [], servicosPosVenda: [], observacoes: '',
    consignado: false, percentualConsignado: 0,
  })

  useEffect(() => {
    if (existing) setForm(existing)
  }, [existing])

  const set = (k: keyof Veiculo, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleOpcional = (o: string) => {
    const arr = form.opcionais || []
    set('opcionais', arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])
  }

  const addServico = () => {
    const novo: ServicoPreparacao = {
      id: uuid(), local: '', servico: '', valor: 0,
      tipoServico: 'mecanica', data: new Date().toISOString().split('T')[0]
    }
    set('servicosPreparacao', [novo, ...(form.servicosPreparacao || [])])
  }
  const updateServico = (sid: string, k: keyof ServicoPreparacao, v: unknown) => {
    set('servicosPreparacao', (form.servicosPreparacao || []).map(s => s.id === sid ? { ...s, [k]: v } : s))
  }
  const removeServico = (sid: string) => set('servicosPreparacao', (form.servicosPreparacao || []).filter(s => s.id !== sid))
  const uploadServicoArquivo = async (sid: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await fileToBase64(file)
    updateServico(sid, 'arquivo', b64)
    updateServico(sid, 'arquivoNome', file.name)
    e.target.value = ''
  }

  const uploadContratoCompra = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await fileToBase64(file)
    set('contratoCompraArquivo', b64)
    set('contratoCompraArquivoNome', file.name)
    e.target.value = ''
  }

  const custoPrep = (form.servicosPreparacao || []).reduce((a, s) => a + Number(s.valor), 0)
  const custoTotal = Number(form.valorPago || 0) + custoPrep + Number(form.trafegoPago || 0)

  const handleSave = async () => {
    if (!form.placa || !form.marca || !form.modelo) {
      alert('Preencha ao menos Placa, Marca e Modelo.')
      return
    }
    const novoStatus = form.status
    const statusAnterior = existing?.status
    const dataInicioEstoque =
      novoStatus === 'estoque' && statusAnterior === 'preparacao'
        ? new Date().toISOString().split('T')[0]
        : form.dataInicioEstoque ?? existing?.dataInicioEstoque
    const veiculo = { ...form, id: existing?.id || uuid(), dataInicioEstoque } as Veiculo
    if (existing) await updateVeiculo(veiculo)
    else await addVeiculo(veiculo)
    navigate('/estoque')
  }

  const tabs = [
    { key: 'dados', label: 'Dados' },
    { key: 'opcionais', label: 'Opcionais' },
    { key: 'preparacao', label: 'Preparação' },
    { key: 'consignado', label: 'Consignado' },
  ] as const

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/estoque')} className="text-slate-500 hover:text-slate-800">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">
          {existing ? `${existing.marca} ${existing.modelo}` : 'Novo Veículo'}
        </h1>
        {existing && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            form.status === 'estoque' ? 'bg-green-100 text-green-700' :
            form.status === 'preparacao' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {form.status === 'estoque' ? 'Em Estoque' : form.status === 'preparacao' ? 'Em Preparação' : 'Vendido'}
          </span>
        )}
      </div>

      {/* Resumo de custos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-400">Valor pago</div>
          <div className="font-bold text-slate-700">R$ {Number(form.valorPago || 0).toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-400">Custo preparação</div>
          <div className="font-bold text-slate-700">R$ {custoPrep.toLocaleString('pt-BR')}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="text-xs text-slate-400">Custo total</div>
          <div className="font-bold text-blue-700">R$ {custoTotal.toLocaleString('pt-BR')}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* DADOS */}
          {tab === 'dados' && (
            <div className="space-y-5">
              {form.status !== 'vendido' && (
                <div>
                  <Label>Status do Veículo</Label>
                  <div className="flex gap-3 mt-1">
                    {(['preparacao', 'estoque'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => set('status', s)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          form.status === s
                            ? (s === 'estoque' ? 'bg-green-600 text-white border-green-600' : 'bg-yellow-500 text-white border-yellow-500')
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {s === 'preparacao' ? 'Em Preparação' : 'Em Estoque'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Marca e Modelo com seletor */}
              <BrandModelSelector
                marca={form.marca || ''}
                modelo={form.modelo || ''}
                onMarcaChange={v => set('marca', v)}
                onModeloChange={v => set('modelo', v)}
              />

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Placa *" value={form.placa} onChange={v => set('placa', v.toUpperCase())} />
                <Field label="Versão" value={form.versao} onChange={v => set('versao', v)} />
                <div>
                  <Label>Ano Fab. / Ano Modelo</Label>
                  <div className="mt-1">
                    <AnoSelector
                      ano={form.ano || 0}
                      anoModelo={form.anoModelo || 0}
                      onChange={(a, am) => { set('ano', a); set('anoModelo', am) }}
                    />
                  </div>
                </div>
                <Field label="Cor" value={form.cor} onChange={v => set('cor', v)} />
                <div>
                  <Label>Km</Label>
                  <NumInput className="input mt-1" value={form.km || 0} onChange={v => set('km', v)} placeholder="0" />
                </div>
                <div>
                  <Label>Combustível</Label>
                  <select className="input mt-1" value={form.combustivel} onChange={e => set('combustivel', e.target.value)}>
                    {['Gasolina','Etanol','Flex','Diesel','GNV','Elétrico','Híbrido'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Chassi" value={form.chassi} onChange={v => set('chassi', v)} />
                <Field label="Renavam" value={form.renavam} onChange={v => set('renavam', v)} />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                <Field label="Data de entrada" type="date" value={form.dataEntrada} onChange={v => set('dataEntrada', v)} />
                <div>
                  <Label>Valor pago (R$)</Label>
                  <NumInput className="input mt-1" value={form.valorPago || 0} onChange={v => set('valorPago', v)} placeholder="0" />
                </div>
                <div>
                  <Label>Como foi adquirido</Label>
                  <select className="input mt-1" value={form.aquisicao} onChange={e => set('aquisicao', e.target.value as AquisicaoType)}>
                    {(Object.keys(AQUISICAO_LABELS) as AquisicaoType[]).map(k => <option key={k} value={k}>{AQUISICAO_LABELS[k]}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Tipo de documento</Label>
                  <select className="input mt-1" value={form.documentoTipo} onChange={e => set('documentoTipo', e.target.value as DocumentType)}>
                    {(Object.keys(DOC_LABELS) as DocumentType[]).map(k => <option key={k} value={k}>{DOC_LABELS[k]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div>
                  <Label>Preço Troca (R$)</Label>
                  <NumInput className="input mt-1" value={form.precoTroca || 0} onChange={v => set('precoTroca', v)} placeholder="0" />
                </div>
                <div>
                  <Label>Preço À Vista (R$)</Label>
                  <NumInput className="input mt-1" value={form.precoAvista || 0} onChange={v => set('precoAvista', v)} placeholder="0" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <button
                  onClick={() => set('laudoCautelar', !form.laudoCautelar)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form.laudoCautelar ? 'bg-green-600 border-green-600' : 'border-slate-300'}`}
                >
                  {form.laudoCautelar && <Check size={12} className="text-white" />}
                </button>
                <span className="text-sm font-medium text-slate-700">Possui Laudo Cautelar</span>
              </div>

              <div>
                <Label>Contrato de Compra</Label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                    <Upload size={14} /> Upload Contrato
                    <input type="file" className="hidden" onChange={uploadContratoCompra} accept=".pdf,.jpg,.jpeg,.png" />
                  </label>
                  {form.contratoCompraArquivoNome && (
                    <a href={form.contratoCompraArquivo} download={form.contratoCompraArquivoNome} className="text-sm text-blue-600 hover:underline">{form.contratoCompraArquivoNome}</a>
                  )}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <textarea
                  className="input mt-1 h-20 resize-none"
                  value={form.observacoes}
                  onChange={e => set('observacoes', e.target.value)}
                  placeholder="Anotações gerais sobre o veículo..."
                />
              </div>
            </div>
          )}

          {/* OPCIONAIS */}
          {tab === 'opcionais' && (
            <div>
              <div className="mb-3 text-sm text-slate-500">{(form.opcionais || []).length} item(s) selecionado(s)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OPCIONAIS_DISPONIVEIS.map(o => {
                  const sel = (form.opcionais || []).includes(o)
                  return (
                    <button
                      key={o}
                      onClick={() => toggleOpcional(o)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${sel ? 'bg-blue-50 border-blue-400 text-blue-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {sel && <Check size={10} className="text-white" />}
                      </div>
                      {o}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* PREPARAÇÃO */}
          {tab === 'preparacao' && (
            <div className="space-y-4">
              {form.status === 'vendido' && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-700 text-sm">
                  <AlertCircle size={16} /> Veículo já vendido — pode continuar adicionando serviços de preparação normalmente, o custo entra no cálculo de lucro do mesmo jeito.
                </div>
              )}
              <>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-slate-500">Total em preparação</div>
                      <div className="text-lg font-bold text-slate-800">R$ {custoPrep.toLocaleString('pt-BR')}</div>
                    </div>
                    <button onClick={addServico} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                      <Plus size={14} /> Adicionar Serviço
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(form.servicosPreparacao || []).length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">Nenhum serviço cadastrado</div>
                    )}
                    {(form.servicosPreparacao || []).map(s => (
                      <div key={s.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <select
                            className="input !w-auto text-sm font-semibold"
                            value={s.tipoServico}
                            onChange={e => updateServico(s.id, 'tipoServico', e.target.value as TipoServico)}
                          >
                            {(Object.keys(TIPO_SERVICO_LABELS) as TipoServico[]).map(k => (
                              <option key={k} value={k}>{TIPO_SERVICO_LABELS[k]}</option>
                            ))}
                          </select>
                          <button onClick={() => removeServico(s.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Local do Serviço</Label>
                            <input className="input mt-1" value={s.local} onChange={e => updateServico(s.id, 'local', e.target.value)} placeholder="Nome da oficina..." />
                          </div>
                          <div>
                            <Label>Valor (R$)</Label>
                            <NumInput className="input mt-1" value={s.valor} onChange={v => updateServico(s.id, 'valor', v)} />
                          </div>
                        </div>
                        <div>
                          <Label>Descrição do Serviço</Label>
                          <input className="input mt-1" value={s.servico} onChange={e => updateServico(s.id, 'servico', e.target.value)} placeholder="Descreva o serviço realizado..." />
                        </div>
                        <div className="flex items-center gap-3">
                          <Label>NF / Arquivo:</Label>
                          <label className="cursor-pointer flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Upload size={12} /> Upload
                            <input type="file" className="hidden" onChange={e => uploadServicoArquivo(s.id, e)} />
                          </label>
                          {s.arquivoNome && (
                            <a href={s.arquivo} download={s.arquivoNome} className="text-xs text-blue-600 hover:underline">{s.arquivoNome}</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              </>
            </div>
          )}

          {/* CONSIGNADO */}
          {tab === 'consignado' && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer select-none p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <button
                  type="button"
                  onClick={() => set('consignado', !form.consignado)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${form.consignado ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}
                >
                  {form.consignado && <Check size={12} className="text-white" />}
                </button>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Veículo Consignado</div>
                  <div className="text-xs text-slate-400">O carro é de outra pessoa — você fica só com uma parte do lucro na venda</div>
                </div>
              </label>

              {form.consignado && (
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-800 uppercase">
                    <Percent size={13} /> Minha porcentagem do lucro
                  </div>
                  <NumInput className="input max-w-xs" value={form.percentualConsignado || 0} onChange={v => set('percentualConsignado', v)} placeholder="Ex: 50" />
                  <div className="text-xs text-slate-500">
                    O lucro do veículo (venda menos custos) é calculado normalmente — só o valor mostrado como "lucro líquido" no sistema é essa porcentagem dele. O restante é do dono do carro.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={() => navigate('/estoque')} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
            Salvar Veículo
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{children}</div>
}
function Field({ label, value, onChange, type = 'text' }: { label: string; value?: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input className="input mt-1" type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
