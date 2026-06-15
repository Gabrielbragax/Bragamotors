import { Link, useLocation } from 'react-router-dom'
import { Car, ShoppingCart, Users, BarChart3, Menu, X, DollarSign, Megaphone, UserCheck, ClipboardList, Search } from 'lucide-react'
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
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 text-white shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Car className="text-blue-400" size={26} />
            <div>
              <div className="font-bold text-lg leading-tight">BragaMotors</div>
              <div className="text-xs text-slate-400">Sistema de Gestão</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={18} />
                {to === '/boletos' && boletosAlerta > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              {label}
              {to === '/boletos' && boletosAlerta > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{boletosAlerta}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700 space-y-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Resumo</div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Em Estoque</span>
            <span className="text-green-400 font-bold">{emEstoque}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Em Preparação</span>
            <span className="text-yellow-400 font-bold">{emPreparacao}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Vendidos</span>
            <span className="text-blue-400 font-bold">{vendidos}</span>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="text-blue-400" size={22} />
          <span className="font-bold">BragaMotors</span>
        </div>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900 text-white pt-14">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(to) ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {label}
                {to === '/boletos' && boletosAlerta > 0 && (
                  <span className="ml-auto text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{boletosAlerta}</span>
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
