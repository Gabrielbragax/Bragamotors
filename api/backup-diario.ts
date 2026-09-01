// Roda uma vez por dia via Vercel Cron (ver vercel.json). Junta todas as tabelas do
// Supabase (veiculos, clientes, vendedores, metas, relatorios, pesquisas, configuracoes)
// num arquivo .json e manda como documento pro Telegram — um backup de verdade, fora do
// Supabase, que fica salvo no histórico do chat e pode ser baixado a qualquer momento.
//
// Os arquivos grandes em base64 (fotos, contratos, notas fiscais anexadas) são retirados
// do backup pra manter o arquivo leve e rápido — eles não são o dado crítico (CPF, valores,
// datas, status de pagamento são); se precisar deles de volta, o original geralmente ainda
// existe no computador/e-mail de onde foi enviado.

const TABELAS = ['veiculos', 'clientes', 'vendedores', 'metas', 'relatorios', 'pesquisas', 'configuracoes'] as const

// Remove campos que guardam arquivo em base64 (ficam MUITO grandes) — mantém tudo o resto.
function limparArquivosGrandes(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(limparArquivosGrandes)
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'fotos') { out[k] = Array.isArray(v) ? `[${v.length} foto(s) removida(s) do backup]` : v; continue }
      if ((k === 'contratoArquivo' || k === 'contratoCompraArquivo' || k === 'arquivo') && typeof v === 'string' && v.startsWith('data:')) {
        out[k] = '[arquivo removido do backup]'
        continue
      }
      out[k] = limparArquivosGrandes(v)
    }
    return out
  }
  return obj
}

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

  const backup: Record<string, unknown[]> = {}
  const contagens: Record<string, number> = {}

  for (const tabela of TABELAS) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?select=data`, { headers })
    if (!r.ok) continue // tabela pode não existir ainda em instalações mais antigas — segue sem ela
    const rows: { data: unknown }[] = await r.json()
    backup[tabela] = rows.map(row => limparArquivosGrandes(row.data))
    contagens[tabela] = rows.length
  }

  const agora = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR').replaceAll('/', '-')
  const conteudo = JSON.stringify({ geradoEm: agora.toISOString(), ...backup }, null, 2)

  const form = new FormData()
  form.append('chat_id', CHAT_ID)
  form.append('document', new Blob([conteudo], { type: 'application/json' }), `bragamotors-backup-${dataStr}.json`)
  const resumo = TABELAS.map(t => `${t}: ${contagens[t] ?? 0}`).join(' • ')
  form.append('caption', `📦 *Backup diário — ${agora.toLocaleDateString('pt-BR')}*\n${resumo}`)
  form.append('parse_mode', 'Markdown')

  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: form,
  })

  return new Response(JSON.stringify({ ok: tgRes.ok, contagens }), { status: tgRes.ok ? 200 : 500 })
}
