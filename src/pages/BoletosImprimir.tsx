import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import type { Boleto } from '../types'

export default function BoletosImprimir() {
  const { veiculos, clientes } = useStore()
  const navigate = useNavigate()

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)

  type Linha = {
    id: string
    clienteNome: string
    clienteCpf: string
    clienteTelefone: string
    veiculo: string
    placa: string
    vencimento: string
    valor: number
    situacao: 'Vencido' | 'Vence hoje' | 'Em aberto'
    dias: number
  }

  const linhas: Linha[] = veiculos.flatMap(v => {
    const boletos = v.venda?.boletos || []
    const clienteVenda = v.venda?.cliente
    const clienteCad = clientes.find(c => c.cpf === clienteVenda?.cpf)
    const nomeCliente = clienteVenda?.nome || clienteCad?.nome || 'Cliente não informado'
    const cpfCliente = clienteVenda?.cpf || clienteCad?.cpf || ''
    const telefoneCliente = clienteCad?.telefone || ''

    return boletos
      .filter((b: Boleto) => !b.pago && b.vencimento)
      .map((b: Boleto) => {
        const d = new Date(b.vencimento); d.setHours(0, 0, 0, 0)
        const dias = differenceInDays(d, hoje)
        const situacao: Linha['situacao'] = dias < 0 ? 'Vencido' : dias === 0 ? 'Vence hoje' : 'Em aberto'
        return {
          id: b.id,
          clienteNome: nomeCliente,
          clienteCpf: cpfCliente,
          clienteTelefone: telefoneCliente,
          veiculo: `${v.marca} ${v.modelo} ${v.ano}`,
          placa: v.placa,
          vencimento: b.vencimento,
          valor: b.valor,
          situacao,
          dias,
        }
      })
  }).sort((a, b) => a.dias - b.dias)

  const totalValor = linhas.reduce((a, l) => a + l.valor, 0)
  const totalVencidos = linhas.filter(l => l.situacao === 'Vencido').length

  const fmtData = (iso: string) => new Date(iso + 'T12:00').toLocaleDateString('pt-BR')

  return (
    <>
      {/* Barra de ação — oculta na impressão */}
      <div className="print:hidden flex items-center gap-3 mb-6 p-4 bg-white border-b border-slate-200">
        <button onClick={() => navigate('/boletos')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Printer size={15} /> Imprimir / Salvar PDF
        </button>
        <span className="text-xs text-slate-400 ml-2">{linhas.length} boletos em aberto</span>
      </div>

      {/* Conteúdo imprimível */}
      <div className="print-page px-4 print:px-0">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-page, .print-page * { visibility: visible; }
            .print-page { position: absolute; inset: 0; font-size: 10px; }
            @page { margin: 1cm; size: A4 portrait; }
          }
          .print-page table { border-collapse: collapse; width: 100%; }
          .print-page th, .print-page td { border: 1px solid #d1d5db; padding: 4px 6px; }
          .print-page thead th { background: #1e293b; color: white; font-weight: 700; font-size: 11px; text-align: center; }
          .print-page tr.row-par td { background: #f8fafc; }
          .print-page tr.row-impar td { background: #ffffff; }
          .print-page tr.vencido td { background: #fee2e2 !important; }
          .print-page td.venc { font-weight: 700; color: #b91c1c; text-align: center; }
          .print-page td.num { text-align: right; }
          .print-page td.center { text-align: center; }
        `}</style>

        <div className="text-center mb-4 print:mb-2">
          <div className="text-2xl print:text-lg font-bold text-slate-800">COBRANÇA — BOLETOS EM ABERTO</div>
          <div className="text-sm text-slate-500 print:text-xs mt-1">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} • {linhas.length} boletos • {totalVencidos} vencidos • Total R$ {totalValor.toLocaleString('pt-BR')}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', minWidth: 160 }}>CLIENTE</th>
              <th>CPF</th>
              <th>TELEFONE</th>
              <th style={{ textAlign: 'left', minWidth: 140 }}>VEÍCULO</th>
              <th>PLACA</th>
              <th>VENCIMENTO</th>
              <th>SITUAÇÃO</th>
              <th>VALOR</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.id} className={l.situacao === 'Vencido' ? 'vencido' : i % 2 === 0 ? 'row-par' : 'row-impar'}>
                <td>{l.clienteNome}</td>
                <td className="center">{l.clienteCpf || '-'}</td>
                <td className="center">{l.clienteTelefone || '-'}</td>
                <td>{l.veiculo}</td>
                <td className="center" style={{ fontWeight: 600 }}>{l.placa}</td>
                <td className="center">{fmtData(l.vencimento)}</td>
                <td className={l.situacao === 'Vencido' ? 'venc' : 'center'}>
                  {l.situacao === 'Vencido' ? `Vencido (${Math.abs(l.dias)}d)` : l.situacao === 'Vence hoje' ? 'Vence hoje' : `Em ${l.dias}d`}
                </td>
                <td className="num">R$ {l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {linhas.length === 0 && (
          <div className="text-center py-16 text-slate-400">Nenhum boleto em aberto</div>
        )}
      </div>
    </>
  )
}
