export type DocumentType = 'transferencia' | 'procuracao' | 'renave'
export type AquisicaoType = 'troca' | 'portal_online' | 'porta_loja' | 'repasse'
export type VeiculoStatus = 'preparacao' | 'estoque' | 'vendido'
export type TipoServico = 'funilaria' | 'mecanica' | 'estetica' | 'eletrica' | 'trafego_pago' | 'outros'
export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  funilaria: 'Funilaria', mecanica: 'Mecânica', estetica: 'Estética', eletrica: 'Elétrica', trafego_pago: 'Tráfego Pago', outros: 'Outros',
}
export type FormaPagamento = 'troca_financiamento' | 'entrada_financiamento' | 'financiamento' | 'avista' | 'entrada_boleto' | 'troca_boleto' | 'misto'
export type FormaPgto = 'financiamento' | 'troca' | 'avista' | 'entrada' | 'boleto' | 'cartao'

export interface ServicoPreparacao {
  id: string
  local: string
  servico: string
  valor: number
  tipoServico: TipoServico
  arquivo?: string
  arquivoNome?: string
  data: string
}

export interface ServicoPosVenda {
  id: string
  local: string
  servico: string
  valor: number
  arquivo?: string
  arquivoNome?: string
  data: string
}

export interface Boleto {
  id: string
  valor: number
  vencimento: string
  pago: boolean
  dataPagamento?: string
  alterado?: boolean
  obsAlteracao?: string
}

export interface Financiamento {
  banco: string
  valorFinanciado: number
  numeroParcelas: number
  valorParcela: number
}

export interface VeiculoTroca {
  descricao: string
  valorAvaliado: number
}

export interface CartaoCredito {
  bandeira: string
  numeroParcelas: number
  valorTotal: number
}

export interface ClienteVenda {
  nome: string
  cpf: string
  dataNascimento?: string
  telefone?: string
}

export interface Venda {
  id: string
  vendedor: string
  dataVenda: string
  formaPagamento: FormaPagamento
  formasPagamento?: FormaPgto[]
  valorVenda: number
  cliente?: ClienteVenda
  veiculoTroca?: VeiculoTroca
  valorEntrada?: number
  financiamento?: Financiamento
  cartaoCredito?: CartaoCredito
  boletos?: Boleto[]
  observacoes?: string
  contratoArquivo?: string
  contratoArquivoNome?: string
  semGarantia?: boolean
}

export interface Veiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  versao?: string
  ano: number
  anoModelo: number
  cor: string
  km: number
  combustivel?: string
  chassi?: string
  renavam?: string
  dataEntrada: string
  dataInicioEstoque?: string
  valorPago: number
  aquisicao: AquisicaoType
  documentoTipo: DocumentType
  contratoCompraArquivo?: string
  contratoCompraArquivoNome?: string
  laudoCautelar: boolean
  precoTroca?: number
  precoAvista?: number
  status: VeiculoStatus
  consignado?: boolean
  percentualConsignado?: number
  opcionais: string[]
  fotos: string[]
  portaisAnunciado: string[]
  trafegoPago?: number
  servicosPreparacao: ServicoPreparacao[]
  servicosPosVenda: ServicoPosVenda[]
  venda?: Venda
  observacoes?: string
}

export interface Cliente {
  id: string
  nome: string
  cpf: string
  dataNascimento?: string
  telefone?: string
  email?: string
  endereco?: string
  veiculosComprados: string[]
}

export interface Vendedor {
  id: string
  nome: string
  ativo: boolean
}

export interface MetaMensal {
  ano: number
  mes: number
  metaQuantidade: number
  metaFaturamento: number
}

export type InteressePesquisa = 'pendente' | 'interesse' | 'sem_interesse'

export interface VeiculoPesquisa {
  id: string
  marca: string
  modelo: string
  ano: number
  km: number
  valor: number
  cidade: string
  portal: string
  link: string
  interesse: InteressePesquisa
  observacoes?: string
}

export interface SessaoPesquisa {
  id: string
  data: string
  titulo?: string
  veiculos: VeiculoPesquisa[]
}

export type StatusLead = 'agendou_visita' | 'nao_respondeu' | 'desistiu' | 'em_negociacao' | 'fechou'

export interface LeadAtendimento {
  id: string
  nomeCliente: string
  canalOrigem: string
  carroInteresse: string
  status: StatusLead
  motivoNaoConversao?: string
}

export interface VendaDiaRelatorio {
  id: string
  carro: string
  valor: number
  formaPagamento: string
}

export interface RelatorioDiario {
  id: string
  data: string
  totalLeads: number
  canaisLeads: string[]
  atendimentos: LeadAtendimento[]
  totalVisitas: number
  visitasFecharam: number
  motivosNaoFechamento: string
  vendasDia: VendaDiaRelatorio[]
  oQueFuncionou: string
  oQueNaoFuncionou: string
  oQueFariaDiferente: string
}

export const CANAIS_LEAD = ['Instagram', 'OLX', 'Webmotors', 'Facebook', 'Indicação', 'WhatsApp', 'Porta da Loja', 'iCarros', 'Mercado Livre', 'Outro']

export const OPCIONAIS_DISPONIVEIS = [
  'Ar condicionado', 'Direção hidráulica', 'Direção elétrica', 'Vidros elétricos',
  'Travas elétricas', 'Airbag duplo', 'ABS', 'Câmbio automático', 'Câmbio CVT',
  'Central multimídia', 'GPS', 'Câmera de ré', 'Sensor de ré', 'Sensor de estacionamento',
  'Teto solar', 'Rodas de liga leve', 'Banco de couro', 'Banco com regulagem elétrica',
  'Volante multifuncional', 'Bluetooth', 'Entrada USB', 'Start/Stop', 'Cruise control',
  'Piloto automático adaptativo', 'Farol de neblina', 'Farol LED', 'Farol Xenon',
  'Alarme', 'Trava elétrica do combustível', 'Retrovisor elétrico', 'Retrovisor auto-dimmer',
  'Computador de bordo', 'Bancos aquecidos', 'Ar digital', 'Kit GNV', 'Blindagem',
  'Capota marítima', 'Engate', 'Para-brisa térmico',
]

export const PORTAIS_DISPONIVEIS = [
  'OLX', 'WebMotors', 'iCarros', 'Mercado Livre', 'Chevrolet Seminovos',
  'AutoLine', 'Mobiauto', 'Facebook Marketplace', 'Instagram', 'Site próprio',
]
