import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  ano: number
  anoModelo: number
  onChange: (ano: number, anoModelo: number) => void
}

const anoAtual = new Date().getFullYear()
const anos: string[] = []
for (let a = anoAtual + 1; a >= 1980; a--) {
  anos.push(`${a}/${a}`)
  anos.push(`${a - 1}/${a}`)
}

export default function AnoSelector({ ano, anoModelo, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(ano && anoModelo ? `${ano}/${anoModelo}` : '')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ano && anoModelo) setSearch(`${ano}/${anoModelo}`)
  }, [ano, anoModelo])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = anos.filter(a => a.includes(search.replace(/\D/g, '').slice(0, 4) || '') || a.includes(search))
    .slice(0, 20)

  const select = (val: string) => {
    const [a, b] = val.split('/').map(Number)
    onChange(a, b)
    setSearch(val)
    setOpen(false)
  }

  const handleInput = (val: string) => {
    setSearch(val)
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center">
        <input
          className="input pr-8"
          value={search}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Ex: 2020/2021"
          autoComplete="off"
        />
        <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">Nenhum resultado</div>
            ) : (
              filtered.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => select(a)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    search === a ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {a}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
