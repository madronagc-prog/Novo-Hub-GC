/**
 * Tipos, Enums e Modelos de Dados do Painel de Inovação
 * Madrona Fialho Advogados - Gestão do Conhecimento & Inovação
 */

export const TIPO_INICIATIVA_OPTIONS = [
  'Automação de Processos',
  'Inteligência Artificial',
  'Gestão do Conhecimento',
  'Padronização de Documentos',
  'Plataforma Jurídica / Doutrina',
  'Pesquisa e Inteligência de Mercado',
  'Eficiência Operacional',
  'Outro'
] as const;
export type TipoIniciativa = typeof TIPO_INICIATIVA_OPTIONS[number];

export const CATEGORIA_INICIATIVA_OPTIONS = [
  'Software / SaaS',
  'Desenvolvimento Interno',
  'Treinamento / Capacitação',
  'Processos & Políticas',
  'Integração de Sistemas',
  'Banco de Dados / Acervo'
] as const;
export type CategoriaIniciativa = typeof CATEGORIA_INICIATIVA_OPTIONS[number];

export const PILAR_PE_OPTIONS = [
  'Eficiência e Produtividade',
  'Inovação e Tecnologia',
  'Capacitação e Pessoas',
  'Qualidade Técnica',
  'Geração de Negócios e Clientes'
] as const;
export type PilarPE = typeof PILAR_PE_OPTIONS[number];

export const PRIORIDADE_OPTIONS = ['Baixa', 'Média', 'Alta', 'Crítica'] as const;
export type PrioridadeIniciativa = typeof PRIORIDADE_OPTIONS[number];

export const ALCADA_OPTIONS = ['Operacional', 'Comitê GC', 'Diretoria', 'Sócios / Conselho'] as const;
export type AlcadaIniciativa = typeof ALCADA_OPTIONS[number];

export const DECISAO_COMITE_OPTIONS = [
  'Aprovado',
  'Em Análise',
  'Pendente de Ajustes',
  'Rejeitado',
  'Sobrestado'
] as const;
export type DecisaoComite = typeof DECISAO_COMITE_OPTIONS[number];

export const ETAPA_ATUAL_OPTIONS = [
  '1. Mapeamento de Ferramentas',
  '2. Testes',
  '3. Negociação de Contrato',
  '4. Assinatura de Contrato',
  '5. Início do Projeto',
  '6. Projeto em Andamento',
  '7. Go Live',
  '8. Treinamentos',
  '9. Feedbacks & Sustentação'
] as const;
export type EtapaAtual = typeof ETAPA_ATUAL_OPTIONS[number];

export const SITUACAO_OPTIONS = [
  'Em Andamento',
  'Planejado',
  'Concluído',
  'Pausado',
  'Cancelado'
] as const;
export type SituacaoIniciativa = typeof SITUACAO_OPTIONS[number];

export const SAUDE_PROJETO_OPTIONS = ['No prazo', 'Atenção', 'Atrasado'] as const;
export type SaudeProjeto = typeof SAUDE_PROJETO_OPTIONS[number];

export const SIM_NAO_OPTIONS = ['Não', 'Sim'] as const;
export type SimNao = typeof SIM_NAO_OPTIONS[number];

export const NIVEL_RISCO_OPTIONS = ['Baixo', 'Médio', 'Alto', 'Crítico'] as const;
export type NivelRisco = typeof NIVEL_RISCO_OPTIONS[number];

export const MODELO_CUSTO_OPTIONS = [
  'Assinatura Mensal',
  'Assinatura Anual',
  'Por Licença/Usuário',
  'Custo Único (One-off)',
  'Gratuito / Open Source'
] as const;
export type ModeloCusto = typeof MODELO_CUSTO_OPTIONS[number];

export const BIMESTRE_OPTIONS = [
  '1º Bimestre',
  '2º Bimestre',
  '3º Bimestre',
  '4º Bimestre',
  '5º Bimestre',
  '6º Bimestre'
] as const;
export type Bimestre = typeof BIMESTRE_OPTIONS[number];

export const METODO_APURACAO_OPTIONS = [
  'Amostragem com Usuários',
  'Métrica Automática de Sistema',
  'Estimativa Especialista',
  'Pesquisa de Satisfação'
] as const;
export type MetodoApuracao = typeof METODO_APURACAO_OPTIONS[number];

export const NOTA_1_A_5_OPTIONS = [1, 2, 3, 4, 5] as const;

export const UN_AREAS_SUGERIDAS = [
  'Tributário',
  'Societário / M&A',
  'Contencioso Cível e Arbitragem',
  'Trabalhista',
  'Bancário e Mercado de Capitais',
  'Imobiliário',
  'Concorrencial',
  'Compliance e Penal Empresarial',
  'Gestão do Conhecimento',
  'Comunicação & MKT',
  'Administrativo & TI',
  'Geral / Todas as UNs'
] as const;

// ── Coleção 1: painel_inovacao_projetos ──────────────────────────────────────
export interface InovacaoProjeto {
  id: string; // INV-001, INV-002, etc.
  projeto: string;
  tipo_iniciativa: TipoIniciativa;
  categoria: CategoriaIniciativa;
  ferramenta_fornecedor: string;
  dor_resolvida: string;
  un_area: string;
  socio_sponsor: string;
  responsavel_gc: string;
  pilar_pe: PilarPE;
  prioridade: PrioridadeIniciativa;
  alcada: AlcadaIniciativa;
  decisao_comite: DecisaoComite;
  etapa_atual: EtapaAtual;
  situacao: SituacaoIniciativa;
  saude_projeto: SaudeProjeto;
  bloqueado: SimNao;
  risco_principal: string;
  nivel_risco: NivelRisco;
  data_pedido: string; // YYYY-MM-DD
  golive_previsto_linha_base: string; // YYYY-MM-DD (travado após cadastro para não-admins)
  golive_previsto_atual: string; // YYYY-MM-DD
  golive_realizado: string; // YYYY-MM-DD
  orcamento_previsto: number;
  custo_realizado: number;
  modelo_custo: ModeloCusto;
  licencas_contratadas: number;
  proximo_passo: string;
  ultima_atualizacao: string;
  alerta_automatico?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Coleção 2: painel_inovacao_etapas ────────────────────────────────────────
export const ETAPAS_CHAVES = [
  { key: 'mapeamento_ferramentas', label: '1. Mapeamento de Ferramentas' },
  { key: 'testes', label: '2. Testes' },
  { key: 'negociacao_contrato', label: '3. Negociação de Contrato' },
  { key: 'assinatura_contrato', label: '4. Assinatura de Contrato' },
  { key: 'inicio_projeto', label: '5. Início do Projeto' },
  { key: 'projeto_andamento', label: '6. Projeto em Andamento' },
  { key: 'golive', label: '7. Go Live' },
  { key: 'treinamentos', label: '8. Treinamentos' },
  { key: 'feedbacks', label: '9. Feedbacks & Sustentação' },
] as const;

export type EtapaKey = typeof ETAPAS_CHAVES[number]['key'];

export interface EtapaCustomizada {
  id: string;
  titulo: string;
  inicio?: string;
  fim?: string;
  status?: string;
  obs?: string;
}

export interface InovacaoEtapas {
  id: string; // mesmo id do projeto: INV-001, etc.
  mapeamento_ferramentas_inicio?: string;
  mapeamento_ferramentas_fim?: string;
  testes_inicio?: string;
  testes_fim?: string;
  negociacao_contrato_inicio?: string;
  negociacao_contrato_fim?: string;
  assinatura_contrato_inicio?: string;
  assinatura_contrato_fim?: string;
  inicio_projeto_inicio?: string;
  inicio_projeto_fim?: string;
  projeto_andamento_inicio?: string;
  projeto_andamento_fim?: string;
  golive_inicio?: string;
  golive_fim?: string;
  treinamentos_inicio?: string;
  treinamentos_fim?: string;
  feedbacks_inicio?: string;
  feedbacks_fim?: string;
  observacoes_gerais?: string;
  etapas_personalizadas?: EtapaCustomizada[];
  updatedAt?: string;
  [key: string]: any;
}

// ── Coleção 3: painel_inovacao_adocao ────────────────────────────────────────
export interface InovacaoAdocao {
  id: string; // id único
  projeto_id: string; // INV-001
  mes_referencia: string; // ex: '2026-01' ou 'Janeiro/2026'
  un_area: string;
  licencas_disponiveis: number;
  usuarios_ativos_mes: number;
  sessoes_treinamento_mes: number;
  pessoas_treinadas: number;
  publico_alvo_treinamento: number;
  observacoes: string;
  updatedAt?: string;
}

// ── Coleção 4: painel_inovacao_valor_qualidade ──────────────────────────────
export interface InovacaoValorQualidade {
  id: string; // id único
  projeto_id: string; // INV-001
  bimestre: Bimestre;
  pessoas_impactadas: number;
  horas_economizadas_bimestre: number;
  metodo_apuracao: MetodoApuracao;
  tempo_medio_antes: number; // horas
  tempo_medio_depois: number; // horas
  nota_qualidade_antes: number; // 1 a 5
  nota_qualidade_depois: number; // 1 a 5
  satisfacao_usuarios: number; // 1 a 5
  respostas_feedback: number;
  comentarios: string;
  updatedAt?: string;
}

// ── Coleção 5: painel_inovacao_metas_pe ──────────────────────────────────────
export interface InovacaoMetaPE {
  id: string; // M1 .. M9 ou custom
  codigo: string;
  pilar: PilarPE | string;
  indicador: string;
  o_que_mede: string;
  tipo_meta: string;
  meta: number;
  realizado_manual?: number;
  updatedAt?: string;
}

export interface InovacaoConfigPE {
  id: 'config';
  ano_apuracao: number;
  updatedAt?: string;
}

// ── Metas Fixas Padrão (M1 a M9) ────────────────────────────────────────────
export const METAS_PE_PADRAO: Array<Omit<InovacaoMetaPE, 'updatedAt'>> = [
  {
    id: 'M1',
    codigo: 'M1',
    pilar: 'Eficiência e Produtividade',
    indicador: 'Horas Economizadas Acumuladas',
    o_que_mede: 'Total acumulado de horas poupadas com automações, IA e ferramentas',
    tipo_meta: 'Horas (h)',
    meta: 500,
  },
  {
    id: 'M2',
    codigo: 'M2',
    pilar: 'Eficiência e Produtividade',
    indicador: 'Redução Média de Tempo de Execução',
    o_que_mede: 'Percentual médio de redução no tempo de entrega das tarefas pós-adoção',
    tipo_meta: 'Percentual (%)',
    meta: 35,
  },
  {
    id: 'M3',
    codigo: 'M3',
    pilar: 'Inovação e Tecnologia',
    indicador: 'Iniciativas Entregues (Go Live)',
    o_que_mede: 'Quantidade de iniciativas concluídas e colocadas em produção',
    tipo_meta: 'Quantidade (un)',
    meta: 6,
  },
  {
    id: 'M4',
    codigo: 'M4',
    pilar: 'Inovação e Tecnologia',
    indicador: 'Taxa Média de Adoção de Ferramentas',
    o_que_mede: 'Percentual de usuários ativos sobre o total de licenças disponíveis',
    tipo_meta: 'Percentual (%)',
    meta: 75,
  },
  {
    id: 'M5',
    codigo: 'M5',
    pilar: 'Capacitação e Pessoas',
    indicador: 'Profissionais Treinados em Tecnologia',
    o_que_mede: 'Volume de colaboradores participantes em treinamentos de inovação',
    tipo_meta: 'Pessoas',
    meta: 120,
  },
  {
    id: 'M6',
    codigo: 'M6',
    pilar: 'Capacitação e Pessoas',
    indicador: 'Adesão aos Treinamentos',
    o_que_mede: 'Percentual de presença em relação ao público-alvo convidado',
    tipo_meta: 'Percentual (%)',
    meta: 80,
  },
  {
    id: 'M7',
    codigo: 'M7',
    pilar: 'Qualidade Técnica',
    indicador: 'Ganho Médio de Qualidade das Entregas',
    o_que_mede: 'Evolução percentual na nota de acurácia, consistência e padronização',
    tipo_meta: 'Percentual (%)',
    meta: 25,
  },
  {
    id: 'M8',
    codigo: 'M8',
    pilar: 'Qualidade Técnica',
    indicador: 'Satisfação Média dos Usuários Internos',
    o_que_mede: 'Avaliação média atribuída pelos advogados e equipes às ferramentas',
    tipo_meta: 'Nota (1 a 5)',
    meta: 4.5,
  },
  {
    id: 'M9',
    codigo: 'M9',
    pilar: 'Geração de Negócios e Clientes',
    indicador: 'Aderência Orçamentária do Portfólio',
    o_que_mede: 'Percentual de execução financeira das iniciativas dentro do teto previsto',
    tipo_meta: 'Percentual (%)',
    meta: 100,
  },
];
