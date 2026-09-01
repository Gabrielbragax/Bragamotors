// Recebe os cliques nos botões do Telegram (webhook).
// - "pagar:<boletoId>" (Dar baixa) — marca o boleto como pago direto no Supabase
// - "atrasado:<boletoId>" (Atrasado) — só confirma que você viu e está de olho,
//   sem mexer no status do boleto (continua em aberto, some da mensagem)
// Em ambos os casos edita a mensagem original mostrando a confirmação e tira os
// botões, pra evitar clique duplicado.

interface Boleto {
  id: string
  valor: number
  vencimento: string
  pago: boolean
  dataPagamento?: string
}
interface Veiculo {
  id: string
  venda?: { boletos?: Boleto[] }
}

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const SUPABASE_URL = 'https://mdxpwztivordpuxxwtse.supabase.co'
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

  if (!SUPABASE_KEY || !BOT_TOKEN) {
    return new Response('config ausente', { status: 500 })
  }

  // Confere que a chamada realmente veio do Telegram (ele manda esse header quando o
  // webhook é registrado com secret_token) — evita que alguém dispare uma ação
  // chutando a URL sem ser o Telegram de verdade.
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }

  const update = await req.json()
  const cq = update.callback_query
  if (!cq || !cq.data) {
    return new Response('ok') // outro tipo de update, não é botão — ignora
  }

  const [action, boletoId] = String(cq.data).split(':')
  const chatId = cq.message?.chat?.id
  const messageId = cq.message?.message_id
  const textoOriginal: string = cq.message?.text || ''

  const responderCallback = async (texto: string) => {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cq.id, text: texto }),
    })
  }

  const editarMensagem = async (sufixo: string) => {
    if (!chatId || !messageId) return
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: `${textoOriginal}\n\n${sufixo}`,
        parse_mode: 'Markdown',
      }),
    })
  }

  if ((action !== 'pagar' && action !== 'atrasado') || !boletoId) {
    await responderCallback('Ação não reconhecida')
    return new Response('ok')
  }

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/veiculos?select=id,data`, { headers })
  const rows: { id: string; data: Veiculo }[] = await r.json()

  const row = rows.find(x => (x.data.venda?.boletos || []).some(b => b.id === boletoId))
  if (!row) {
    await responderCallback('Boleto não encontrado (já deve ter sido removido)')
    return new Response('ok')
  }

  const v = row.data
  const boleto = (v.venda!.boletos || []).find(b => b.id === boletoId)!

  if (action === 'atrasado') {
    // Não mexe no boleto — só confirma que a pessoa viu e está acompanhando.
    await responderCallback('🕓 Marcado como acompanhado')
    await editarMensagem(`🕓 *Confirmado — ainda em atraso, acompanhando* (${new Date().toLocaleDateString('pt-BR')})`)
    return new Response('ok')
  }

  // action === 'pagar'
  if (boleto.pago) {
    await responderCallback('Esse boleto já estava marcado como pago')
  } else {
    boleto.pago = true
    boleto.dataPagamento = new Date().toISOString().split('T')[0]
    await fetch(`${SUPABASE_URL}/rest/v1/veiculos?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ data: v }),
    })
    await responderCallback('✅ Baixa dada com sucesso!')
  }
  await editarMensagem(`✅ *Baixa dada em ${new Date().toLocaleDateString('pt-BR')}*`)

  return new Response('ok')
}
