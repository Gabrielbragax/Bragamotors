import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Estoque from './pages/Estoque'
import VeiculoForm from './pages/VeiculoForm'
import VeiculoDetalhe from './pages/VeiculoDetalhe'
import Vendas from './pages/Vendas'
import Clientes from './pages/Clientes'
import Boletos from './pages/Boletos'
import Marketing from './pages/Marketing'
import Vendedores from './pages/Vendedores'
import EstoqueImprimir from './pages/EstoqueImprimir'
import Relatorios from './pages/Relatorios'
import { useStore } from './store/useStore'
import { Car } from 'lucide-react'

function AppContent() {
  const { loadAll, loaded } = useStore()

  useEffect(() => {
    loadAll()
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <Car className="text-blue-400 animate-pulse" size={48} />
        <div className="text-white font-bold text-xl">BragaMotors</div>
        <div className="text-slate-400 text-sm">Carregando dados...</div>
        <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/estoque/imprimir" element={<EstoqueImprimir />} />
          <Route path="/estoque/novo" element={<VeiculoForm />} />
          <Route path="/estoque/:id" element={<VeiculoDetalhe />} />
          <Route path="/estoque/:id/editar" element={<VeiculoForm />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/vendedores" element={<Vendedores />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/boletos" element={<Boletos />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default function App() {
  return <AppContent />
}
