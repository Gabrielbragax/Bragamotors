import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'

export default function EstoqueImprimir() {
  const veiculos = useStore(s => s.veiculos)
  const navigate = useNavigate()

  const ativos = veiculos
    .filter(v => v.status !== 'vendido')
    .sort((a, b) => a.marca.localeCompare(b.marca) || a.modelo.localeCompare(b.modelo))

  const grupos: Record<string, typeof ativos> = {}
  for (const v of ativos) {
    if (!grupos[v.marca]) grupos[v.marca] = []
    grupos[v.marca].push(v)
  }

  const marcasOrdenadas = Object.keys(grupos).sort()

  const fmt = (n?: number) =>
    n ? 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'

  const cautelar = (v: (typeof ativos)[0]) =>
    v.laudoCautelar ? 'OK' : 'NÃO'

  const opcionais = (v: (typeof ativos)[0]) => {
    if (!v.opcionais || v.opcionais.length === 0) return '-'
    // resumo curto baseado nos opcionais marcados
    const lista = v.opcionais
    if (lista.length >= 8) return 'Completo'
    return lista.slice(0, 3).join(', ') + (lista.length > 3 ? '...' : '')
  }

  return (
    <>
      {/* Barra de ação — oculta na impressão */}
      <div className="print:hidden flex items-center gap-3 mb-6 p-4 bg-white border-b border-slate-200">
        <button onClick={() => navigate('/estoque')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Printer size={15} /> Imprimir / Salvar PDF
        </button>
        <span className="text-xs text-slate-400 ml-2">{ativos.length} veículos em estoque</span>
      </div>

      {/* Conteúdo imprimível */}
      <div className="print-page px-4 print:px-0">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-page, .print-page * { visibility: visible; }
            .print-page { position: absolute; inset: 0; font-size: 10px; }
            @page { margin: 1cm; size: A4 landscape; }
          }
          .print-page table { border-collapse: collapse; width: 100%; }
          .print-page th, .print-page td { border: 1px solid #d1d5db; padding: 4px 6px; }
          .print-page thead th { background: #1e293b; color: white; font-weight: 700; font-size: 11px; text-align: center; }
          .print-page tr.marca-header td { background: #f1f5f9; font-weight: 800; text-align: center; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; border-top: 2px solid #334155; }
          .print-page tr.row-par td { background: #f8fafc; }
          .print-page tr.row-impar td { background: #ffffff; }
          .print-page td.cautelar-ok { color: #15803d; font-weight: 700; text-align: center; }
          .print-page td.cautelar-nao { color: #dc2626; font-weight: 700; text-align: center; }
          .print-page td.cautelar-slash { color: #6b7280; text-align: center; }
          .print-page td.num { text-align: right; }
          .print-page td.center { text-align: center; }
        `}</style>

        <div className="text-center mb-4 print:mb-2">
          <div className="text-2xl print:text-lg font-bold text-slate-800">LISTA DE ESTOQUE — BRAGAMOTORS</div>
          <div className="text-sm text-slate-500 print:text-xs mt-1">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} • {ativos.length} veículos</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 180 }}>VEÍCULO</th>
              <th>ANO</th>
              <th>COR</th>
              <th>PLACA</th>
              <th>OPCIONAIS</th>
              <th>KM</th>
              <th>TROCA</th>
              <th>A VISTA</th>
              <th>CAUTELAR</th>
            </tr>
          </thead>
          <tbody>
            {marcasOrdenadas.map(marca => (
              <>
                <tr key={`header-${marca}`} className="marca-header">
                  <td colSpan={9}>{marca}</td>
                </tr>
                {grupos[marca].map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? 'row-par' : 'row-impar'}>
                    <td>{v.modelo}{v.versao ? ' ' + v.versao : ''}</td>
                    <td className="center">{v.ano}{v.anoModelo !== v.ano ? `/${v.anoModelo}` : `/${v.ano}`}</td>
                    <td className="center">{v.cor}</td>
                    <td className="center" style={{ fontWeight: 600 }}>{v.placa}</td>
                    <td className="center">{opcionais(v)}</td>
                    <td className="num">{v.km ? v.km.toLocaleString('pt-BR') : '-'}</td>
                    <td className="num">{fmt(v.precoTroca)}</td>
                    <td className="num">{fmt(v.precoAvista)}</td>
                    <td className={v.laudoCautelar ? 'cautelar-ok' : 'cautelar-nao'}>{cautelar(v)}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>

        {ativos.length === 0 && (
          <div className="text-center py-16 text-slate-400">Nenhum veículo em estoque</div>
        )}
      </div>
    </>
  )
}
