// Roda uma vez por dia via Vercel Cron (ver vercel.json). Verifica boletos vencidos e
// que vencem hoje, e manda UMA MENSAGEM SEPARADA POR BOLETO pro Telegram, cada uma com
// botões "Cobrar agora" (abre WhatsApp) e "Dar baixa" (marca como pago direto por lá).
// NUNCA roda no navegador — só no servidor da Vercel — por isso pode usar variáveis de
// ambiente sem prefixo VITE_ com segurança (nunca vão parar no bundle público do site).

interface Boleto {
  id: string
  valor: number
  vencimento: string
  pago: boolean
}
interface Veiculo {
  marca: string
  modelo: string
  ano: number
  placa: string
  venda?: {
    cliente?: { nome: string; cpf: string }
    boletos?: Boleto[]
  }
}
interface Cliente {
  cpf: string
  telefone?: string
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

/** Mesmo formato de link usado no botão "Cobrar" dentro do site. */
function linkWhatsapp(telefone: string, mensagem: string): string {
  const digitos = telefone.replace(/\D/g, '')
  const comDDI = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`
}

const MAX_MENSAGENS = 30 // teto de segurança pra não inundar o chat num dia com muito atraso

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  const SUPABASE_URL = 'https://mdxpwztivordpuxxwtse.supabase.co'
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID

  if (!SUPABASE_KEY || !BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ ok: false, error: 'Variáveis de ambiente não configuradas' }), { status: 500 })
  }

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }

  const [rVeiculos, rClientes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/veiculos?select=data`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/clientes?select=data`, { headers }),
  ])
  if (!rVeiculos.ok || !rClientes.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Falha ao ler Supabase' }), { status: 500 })
  }
  const veiculos: Veiculo[] = (await rVeiculos.json()).map((row: { data: Veiculo }) => row.data)
  const clientes: Cliente[] = (await rClientes.json()).map((row: { data: Cliente }) => row.data)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  type Item = {
    boletoId: string
    cliente: string
    telefone: string
    veiculo: string
    placa: string
    valor: number
    vencimento: string
    diasAtraso: number
    situacao: 'vencido' | 'hoje'
  }
  const itens: Item[] = []

  for (const v of veiculos) {
    const boletos = v.venda?.boletos || []
    for (const b of boletos) {
      if (b.pago || !b.vencimento) continue
      const d = new Date(b.vencimento + 'T00:00:00')
      const diasAtraso = Math.round((hoje.getTime() - d.getTime()) / 86400000)
      if (diasAtraso < 0) continue // ainda não venceu, não avisa
      const cpf = v.venda?.cliente?.cpf || ''
      const clienteCad = clientes.find(c => c.cpf === cpf)
      itens.push({
        boletoId: b.id,
        cliente: v.venda?.cliente?.nome || 'Cliente não informado',
        telefone: clienteCad?.telefone || '',
        veiculo: `${v.marca} ${v.modelo} ${v.ano}`,
        placa: v.placa,
        valor: b.valor,
        vencimento: b.vencimento,
        diasAtraso,
        situacao: diasAtraso === 0 ? 'hoje' : 'vencido',
      })
    }
  }

  if (itens.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: 'Nada vencido ou vencendo hoje — nenhuma mensagem enviada' }), { status: 200 })
  }

  // Vencidos mais atrasados primeiro, depois os que vencem hoje
  itens.sort((a, b) => b.diasAtraso - a.diasAtraso)

  const enviar = itens.slice(0, MAX_MENSAGENS)
  const restantes = itens.length - enviar.length

  let enviados = 0
  for (const i of enviar) {
    const primeiroNome = i.cliente.split(' ')[0]
    const dataFmt = new Date(i.vencimento + 'T12:00').toLocaleDateString('pt-BR')
    const texto = i.situacao === 'hoje'
      ? `⏰ *Vence hoje*\n\n👤 ${i.cliente}\n🚗 ${i.veiculo} (${i.placa})\n💰 R$ ${fmtBRL(i.valor)}\n📅 Vencimento: ${dataFmt}`
      : `🔴 *Vencido — ${i.diasAtraso}d de atraso*\n\n👤 ${i.cliente}\n🚗 ${i.veiculo} (${i.placa})\n💰 R$ ${fmtBRL(i.valor)}\n📅 Venceu em: ${dataFmt}`

    const botoes = []
    if (i.telefone) {
      const msgWhats = `Olá ${primeiroNome}, tudo bem? Aqui é da BragaMotors. Identificamos que o boleto de R$ ${fmtBRL(i.valor)} referente ao seu ${i.veiculo} ${i.situacao === 'hoje' ? `vence hoje (${dataFmt})` : `venceu em ${dataFmt}`}. Poderia verificar a situação? Qualquer dúvida estou à disposição!`
      botoes.push({ text: '💬 Cobrar agora', url: linkWhatsapp(i.telefone, msgWhats) })
    }
    botoes.push({ text: '✅ Dar baixa', callback_data: `pagar:${i.boletoId}` })

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: i.telefone ? texto : `${texto}\n\n_(sem telefone cadastrado — cadastre em Clientes pra liberar o "Cobrar agora")_`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [botoes] },
      }),
    })
    if (tgRes.ok) enviados++
  }

  if (restantes > 0) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: `_...e mais ${restantes} boleto${restantes !== 1 ? 's' : ''} vencido${restantes !== 1 ? 's' : ''}. Abra o BragaMotors pra ver todos._`, parse_mode: 'Markdown' }),
    })
  }

  return new Response(JSON.stringify({ ok: true, enviados, total: itens.length }), { status: 200 })
}
