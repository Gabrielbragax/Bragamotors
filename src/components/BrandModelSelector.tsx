import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { MARCAS_MODELOS, getModelos } from '../data/veiculos'

interface Props {
  marca: string
  modelo: string
  onMarcaChange: (m: string) => void
  onModeloChange: (m: string) => void
}

export default function BrandModelSelector({ marca, modelo, onMarcaChange, onModeloChange }: Props) {
  const [openMarca, setOpenMarca] = useState(false)
  const [openModelo, setOpenModelo] = useState(false)
  const [searchMarca, setSearchMarca] = useState('')
  const [searchModelo, setSearchModelo] = useState('')
  const marcaRef = useRef<HTMLDivElement>(null)
  const modeloRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (marcaRef.current && !marcaRef.current.contains(e.target as Node)) setOpenMarca(false)
      if (modeloRef.current && !modeloRef.current.contains(e.target as Node)) setOpenModelo(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const marcasFiltradas = MARCAS_MODELOS.filter(m =>
    m.marca.toLowerCase().includes(searchMarca.toLowerCase())
  )
  const modelosFiltrados = getModelos(marca).filter(m =>
    m.toLowerCase().includes(searchModelo.toLowerCase())
  )

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Marca */}
      <div ref={marcaRef} className="relative">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Marca *</div>
        <button
          type="button"
          onClick={() => { setOpenMarca(!openMarca); setOpenModelo(false) }}
          className="input flex items-center justify-between text-left"
        >
          <span className={marca ? 'text-slate-800' : 'text-slate-400'}>{marca || 'Selecionar marca...'}</span>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </button>
        {openMarca && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-2 top-2 text-slate-400" />
                <input
                  autoFocus
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Pesquisar marca..."
                  value={searchMarca}
                  onChange={e => setSearchMarca(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {marcasFiltradas.map(m => (
                <button
                  key={m.marca}
                  type="button"
                  onClick={() => {
                    onMarcaChange(m.marca)
                    onModeloChange('')
                    setOpenMarca(false)
                    setSearchMarca('')
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${marca === m.marca ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                >
                  {m.marca}
                </button>
              ))}
              {marcasFiltradas.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-400">Nenhuma marca encontrada</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modelo */}
      <div ref={modeloRef} className="relative">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Modelo *</div>
        <button
          type="button"
          disabled={!marca}
          onClick={() => { setOpenModelo(!openModelo); setOpenMarca(false) }}
          className="input flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={modelo ? 'text-slate-800' : 'text-slate-400'}>{modelo || (marca ? 'Selecionar modelo...' : 'Selecione a marca primeiro')}</span>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </button>
        {openModelo && marca && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-2 top-2 text-slate-400" />
                <input
                  autoFocus
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Pesquisar modelo..."
                  value={searchModelo}
                  onChange={e => setSearchModelo(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {modelosFiltrados.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onModeloChange(m)
                    setOpenModelo(false)
                    setSearchModelo('')
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${modelo === m ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                >
                  {m}
                </button>
              ))}
              {/* Opção para digitar modelo personalizado */}
              {searchModelo && !modelosFiltrados.includes(searchModelo) && (
                <button
                  type="button"
                  onClick={() => {
                    onModeloChange(searchModelo)
                    setOpenModelo(false)
                    setSearchModelo('')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-slate-100"
                >
                  + Usar "{searchModelo}"
                </button>
              )}
              {modelosFiltrados.length === 0 && !searchModelo && (
                <div className="px-4 py-3 text-sm text-slate-400">Nenhum modelo disponível</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
