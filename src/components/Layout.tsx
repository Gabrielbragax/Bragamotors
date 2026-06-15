import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Users, BarChart3, Menu, X, DollarSign, Megaphone, UserCheck, ClipboardList, Search, Car } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store/useStore'

const navItems = [
  { to: '/', icon: BarChart3, label: 'Dashboard' },
  { to: '/estoque', icon: Car, label: 'Estoque' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/vendedores', icon: UserCheck, label: 'Vendedores' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/boletos', icon: DollarSign, label: 'Boletos' },
  { to: '/marketing', icon: Megaphone, label: 'Marketing' },
  { to: '/relatorios', icon: ClipboardList, label: 'Relatórios' },
  { to: '/pesquisa', icon: Search, label: 'Pesquisa' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const veiculos = useStore(s => s.veiculos)

  const emEstoque = veiculos.filter(v => v.status === 'estoque').length
  const emPreparacao = veiculos.filter(v => v.status === 'preparacao').length
  const vendidos = veiculos.filter(v => v.status === 'vendido').length
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const boletosAlerta = veiculos.flatMap(v => (v.venda?.boletos || []).filter(b => {
    if (b.pago) return false
    const d = new Date(b.vencimento); d.setHours(0,0,0,0)
    return d <= hoje
  })).length

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f1f1' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 text-white" style={{ background: '#0a0a0a' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#222' }}>
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="BragaMotors" className="w-10 h-10 rounded-lg" />
            <div>
              <div className="font-bold text-base leading-tight text-white">BragaMotors</div>
              <div className="text-xs" style={{ color: '#888' }}>Sistema de Gestão</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'text-white'
                  : 'hover:text-white'
              }`}
              style={isActive(to)
                ? { background: '#009246', color: '#fff' }
                : { color: '#aaa' }
              }
            >
              <div className="relative">
                <Icon size={17} />
                {to === '/boletos' && boletosAlerta > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: '#CE2B37' }} />
                )}
              </div>
              {label}
              {to === '/boletos' && boletosAlerta > 0 && (
                <span className="ml-auto text-xs text-white font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#CE2B37' }}>{boletosAlerta}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: '#222' }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#555' }}>Resumo</div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#888' }}>Em Estoque</span>
            <span className="font-bold" style={{ color: '#009246' }}>{emEstoque}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#888' }}>Em Preparação</span>
            <span className="font-bold text-yellow-400">{emPreparacao}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#888' }}>Vendidos</span>
            <span className="font-bold text-white">{vendidos}</span>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 text-white px-4 py-3 flex items-center justify-between" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="BragaMotors" className="w-8 h-8 rounded-md" />
          <span className="font-bold text-white">BragaMotors</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 text-white pt-14" style={{ background: '#0a0a0a' }}>
          <nav className="px-4 py-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"
                style={isActive(to)
                  ? { background: '#009246', color: '#fff' }
                  : { color: '#aaa' }
                }
              >
                <Icon size={18} />
                {label}
                {to === '/boletos' && boletosAlerta > 0 && (
                  <span className="ml-auto text-xs text-white font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#CE2B37' }}>{boletosAlerta}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:overflow-auto pt-14 lg:pt-0">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
