// Roda uma vez por dia via Vercel Cron (ver vercel.json). Verifica boletos vencidos
// e que vencem hoje, e manda um resumo pro Telegram. NUNCA roda no navegador — só
// no servidor da Vercel — por isso pode usar variáveis de ambiente sem prefixo VITE_
// com segurança (nunca vão parar no bundle público do site).

interface Boleto {
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
    cliente?: { nome: string }
    boletos?: Boleto[]
  }
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  const SUPABASE_URL = 'https://mdxpwztivordpuxxwtse.supabase.co'
  // Reaproveita a mesma chave publishable que o site usa (já configurada no Vercel) —
  // não precisa de outra variável só pra isso.
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID

  if (!SUPABASE_KEY || !BOT_TOKEN || !CHAT_ID) {
    return new Response(JSON.stringify({ ok: false, error: 'Variáveis de ambiente não configuradas' }), { status: 500 })
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/veiculos?select=data`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!r.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Falha ao ler Supabase', status: r.status }), { status: 500 })
  }
  const rows: { data: Veiculo }[] = await r.json()
  const veiculos = rows.map(row => row.data)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  type Item = { cliente: string; veiculo: string; placa: string; valor: number; diasAtraso: number }
  const vencidos: Item[] = []
  const venceHoje: Item[] = []

  for (const v of veiculos) {
    const boletos = v.venda?.boletos || []
    for (const b of boletos) {
      if (b.pago || !b.vencimento) continue
      const d = new Date(b.vencimento + 'T00:00:00')
      const diasAtraso = Math.round((hoje.getTime() - d.getTime()) / 86400000)
      const item: Item = {
        cliente: v.venda?.cliente?.nome || 'Cliente não informado',
        veiculo: `${v.marca} ${v.modelo} ${v.ano}`,
        placa: v.placa,
        valor: b.valor,
        diasAtraso,
      }
      if (diasAtraso > 0) vencidos.push(item)
      else if (diasAtraso === 0) venceHoje.push(item)
    }
  }

  if (vencidos.length === 0 && venceHoje.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: 'Nada vencido ou vencendo hoje — nenhuma mensagem enviada' }), { status: 200 })
  }

  vencidos.sort((a, b) => b.diasAtraso - a.diasAtraso)

  let msg = `🚨 *BragaMotors — Boletos de hoje*\n\n`

  if (venceHoje.length) {
    msg += `*⏰ Vencem hoje (${venceHoje.length}):*\n`
    for (const i of venceHoje) msg += `• ${i.cliente} — ${i.veiculo} (${i.placa}) — R$ ${fmtBRL(i.valor)}\n`
    msg += '\n'
  }

  if (vencidos.length) {
    const top = vencidos.slice(0, 20)
    msg += `*🔴 Vencidos (${vencidos.length}):*\n`
    for (const i of top) msg += `• ${i.cliente} — ${i.veiculo} (${i.placa}) — R$ ${fmtBRL(i.valor)} — ${i.diasAtraso}d de atraso\n`
    if (vencidos.length > top.length) msg += `_...e mais ${vencidos.length - top.length}_\n`
  }

  const totalVencido = vencidos.reduce((a, i) => a + i.valor, 0)
  msg += `\n💰 *Total vencido:* R$ ${fmtBRL(totalVencido)}`

  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' }),
  })
  const tgJson = await tgRes.json()

  return new Response(JSON.stringify({ ok: true, telegramOk: tgJson.ok, vencidos: vencidos.length, venceHoje: venceHoje.length }), { status: 200 })
}
