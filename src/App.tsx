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
import Pesquisa from './pages/Pesquisa'
import { useStore } from './store/useStore'

function AppContent() {
  const { loadAll, loaded } = useStore()

  useEffect(() => {
    loadAll()
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#000' }}>
        <img src="/logo.png" alt="BragaMotors" className="w-24 h-24 rounded-2xl animate-pulse" />
        <div className="text-white font-bold text-xl">BragaMotors</div>
        <div className="text-sm" style={{ color: '#888' }}>Carregando dados...</div>
        <div className="w-48 h-1.5 rounded-full overflow-hidden mt-2" style={{ background: '#222' }}>
          <div className="h-full rounded-full animate-pulse w-3/4" style={{ background: '#009246' }} />
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
          <Route path="/pesquisa" element={<Pesquisa />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default function App() {
  return <AppContent />
}
