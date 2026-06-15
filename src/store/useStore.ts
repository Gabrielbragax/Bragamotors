import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Veiculo, Cliente, Vendedor, MetaMensal, RelatorioDiario, SessaoPesquisa } from '../types'

interface Store {
  veiculos: Veiculo[]
  clientes: Cliente[]
  vendedores: Vendedor[]
  metas: MetaMensal[]
  relatorios: RelatorioDiario[]
  pesquisas: SessaoPesquisa[]
  loaded: boolean

  loadAll: () => Promise<void>

  addVeiculo: (v: Veiculo) => Promise<void>
  updateVeiculo: (v: Veiculo) => Promise<void>
  deleteVeiculo: (id: string) => Promise<void>

  addCliente: (c: Cliente) => Promise<void>
  updateCliente: (c: Cliente) => Promise<void>

  addVendedor: (v: Vendedor) => Promise<void>
  updateVendedor: (v: Vendedor) => Promise<void>

  upsertMeta: (m: MetaMensal) => Promise<void>

  addRelatorio: (r: RelatorioDiario) => Promise<void>
  updateRelatorio: (r: RelatorioDiario) => Promise<void>
  deleteRelatorio: (id: string) => Promise<void>

  addPesquisa: (s: SessaoPesquisa) => Promise<void>
  updatePesquisa: (s: SessaoPesquisa) => Promise<void>
  deletePesquisa: (id: string) => Promise<void>
}

async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('data')
  if (error) { console.error(`Erro ao carregar ${table}:`, error.message, error.code, error.details); return [] }
  return (data ?? []).map((row: { data: T }) => row.data)
}

async function upsertRow(table: string, id: string, data: unknown) {
  const { error } = await supabase.from(table).upsert({ id, data })
  if (error) console.error(`Erro ao salvar em ${table}:`, error)
}

async function deleteRow(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) console.error(`Erro ao deletar de ${table}:`, error)
}

export const useStore = create<Store>((set) => ({
  veiculos: [],
  clientes: [],
  vendedores: [],
  metas: [],
  relatorios: [],
  pesquisas: [],
  loaded: false,

  loadAll: async () => {
    const [veiculos, clientes, vendedores, metas, relatorios, pesquisas] = await Promise.all([
      fetchTable<Veiculo>('veiculos'),
      fetchTable<Cliente>('clientes'),
      fetchTable<Vendedor>('vendedores'),
      fetchTable<MetaMensal>('metas'),
      fetchTable<RelatorioDiario>('relatorios'),
      fetchTable<SessaoPesquisa>('pesquisas'),
    ])
    set({ veiculos, clientes, vendedores, metas, relatorios, pesquisas, loaded: true })
  },

  addVeiculo: async (v) => {
    set(s => ({ veiculos: [...s.veiculos, v] }))
    await upsertRow('veiculos', v.id, v)
  },
  updateVeiculo: async (v) => {
    set(s => ({ veiculos: s.veiculos.map(x => x.id === v.id ? v : x) }))
    await upsertRow('veiculos', v.id, v)
  },
  deleteVeiculo: async (id) => {
    set(s => ({ veiculos: s.veiculos.filter(x => x.id !== id) }))
    await deleteRow('veiculos', id)
  },

  addCliente: async (c) => {
    set(s => ({ clientes: [...s.clientes, c] }))
    await upsertRow('clientes', c.id, c)
  },
  updateCliente: async (c) => {
    set(s => ({ clientes: s.clientes.map(x => x.id === c.id ? c : x) }))
    await upsertRow('clientes', c.id, c)
  },

  addVendedor: async (v) => {
    set(s => ({ vendedores: [...s.vendedores, v] }))
    await upsertRow('vendedores', v.id, v)
  },
  updateVendedor: async (v) => {
    set(s => ({ vendedores: s.vendedores.map(x => x.id === v.id ? v : x) }))
    await upsertRow('vendedores', v.id, v)
  },

  upsertMeta: async (m) => {
    const id = `${m.ano}-${m.mes}`
    set(s => {
      const exists = s.metas.find(x => x.ano === m.ano && x.mes === m.mes)
      return {
        metas: exists
          ? s.metas.map(x => (x.ano === m.ano && x.mes === m.mes ? m : x))
          : [...s.metas, m]
      }
    })
    await upsertRow('metas', id, m)
  },

  addRelatorio: async (r) => {
    set(s => ({ relatorios: [r, ...s.relatorios] }))
    await upsertRow('relatorios', r.id, r)
  },
  updateRelatorio: async (r) => {
    set(s => ({ relatorios: s.relatorios.map(x => x.id === r.id ? r : x) }))
    await upsertRow('relatorios', r.id, r)
  },
  deleteRelatorio: async (id) => {
    set(s => ({ relatorios: s.relatorios.filter(x => x.id !== id) }))
    await deleteRow('relatorios', id)
  },

  addPesquisa: async (s) => {
    set(st => ({ pesquisas: [s, ...st.pesquisas] }))
    await upsertRow('pesquisas', s.id, s)
  },
  updatePesquisa: async (s) => {
    set(st => ({ pesquisas: st.pesquisas.map(x => x.id === s.id ? s : x) }))
    await upsertRow('pesquisas', s.id, s)
  },
  deletePesquisa: async (id) => {
    set(st => ({ pesquisas: st.pesquisas.filter(x => x.id !== id) }))
    await deleteRow('pesquisas', id)
  },
}))
