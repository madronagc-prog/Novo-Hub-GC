/**
 * Fórmulas e Cálculos do Painel de Inovação
 * Madrona Fialho Advogados
 */

import {
  InovacaoProjeto,
  InovacaoEtapas,
  InovacaoAdocao,
  InovacaoValorQualidade,
  InovacaoMetaPE,
  ETAPAS_CHAVES
} from '../types/painelInovacao';

/**
 * Diferença em dias corridos entre duas datas no formato YYYY-MM-DD
 */
export function diferencaEmDias(dataFimStr?: string, dataInicioStr?: string): number | null {
  if (!dataFimStr || !dataInicioStr) return null;
  const dInicio = new Date(dataInicioStr);
  const dFim = new Date(dataFimStr);
  if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) return null;
  const diffTime = dFim.getTime() - dInicio.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Idade do item em aberto:
 * Dias corridos desde data_pedido até hoje (ou até golive_realizado se o projeto estiver Concluído)
 */
export function calcularIdadeItemEmAberto(p: InovacaoProjeto): number {
  if (!p.data_pedido) return 0;
  const dPedido = new Date(p.data_pedido);
  if (isNaN(dPedido.getTime())) return 0;

  let dRef = new Date();
  if (p.situacao === 'Concluído' && p.golive_realizado) {
    const dGoLive = new Date(p.golive_realizado);
    if (!isNaN(dGoLive.getTime())) {
      dRef = dGoLive;
    }
  }

  const diffTime = dRef.getTime() - dPedido.getTime();
  const dias = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return dias >= 0 ? dias : 0;
}

/**
 * Ciclo até o go live:
 * Diferença em dias entre data_pedido e golive_realizado (se concluído),
 * ou entre data_pedido e golive_previsto_atual (se ainda não realizado).
 */
export function calcularCicloAteGoLive(p: InovacaoProjeto): number | null {
  if (!p.data_pedido) return null;
  const dataAlvo = p.golive_realizado || p.golive_previsto_atual;
  if (!dataAlvo) return null;
  const dias = diferencaEmDias(dataAlvo, p.data_pedido);
  return dias !== null && dias >= 0 ? dias : 0;
}

/**
 * Desvio de prazo:
 * Diferença em dias entre o go live projetado (ou realizado) e a linha base inicial.
 * Se positivo (>0): atraso em dias.
 * Se negativo (<0): adiantamento em dias.
 * Se zero (0): exatamente no prazo.
 */
export function calcularDesvioPrazo(p: InovacaoProjeto): number | null {
  if (!p.golive_previsto_linha_base) return null;
  const dataAlvo = p.golive_realizado || p.golive_previsto_atual;
  if (!dataAlvo) return null;
  return diferencaEmDias(dataAlvo, p.golive_previsto_linha_base);
}

/**
 * Percentual do orçamento consumido:
 * (custo_realizado / orcamento_previsto) * 100
 */
export function calcularPercentualOrcamento(p: InovacaoProjeto): number | null {
  if (!p.orcamento_previsto || p.orcamento_previsto <= 0) return null;
  const custo = p.custo_realizado || 0;
  return Number(((custo / p.orcamento_previsto) * 100).toFixed(1));
}

export type TipoAlerta = 'critico' | 'atencao' | 'ok';

export interface AlertaInfo {
  tipo: TipoAlerta;
  label: string;
  motivo?: string;
}

/**
 * Alerta automático semafórico:
 * - Crítico (Vermelho #FC745C): Bloqueado = Sim, Risco = Crítico, Saúde = Atrasado, ou Desvio > 30 dias
 * - Atenção (Amarelo #F59E0B): Saúde = Atenção, Risco = Alto, Custo > Orçamento, ou Desvio > 0
 * - Normal (Verde #10B981 / Azul #00B2FF): No prazo / Regular
 */
export function calcularAlertaAutomatico(p: InovacaoProjeto): AlertaInfo {
  const desvio = calcularDesvioPrazo(p);
  const estourouOrcamento = (p.orcamento_previsto > 0 && (p.custo_realizado || 0) > p.orcamento_previsto);

  if (p.bloqueado === 'Sim') {
    return { tipo: 'critico', label: 'Bloqueado', motivo: 'Iniciativa com bloqueio ativo' };
  }
  if (p.saude_projeto === 'Atrasado') {
    return { tipo: 'critico', label: 'Atrasado', motivo: 'Saúde declarada como atrasada' };
  }
  if (p.nivel_risco === 'Crítico') {
    return { tipo: 'critico', label: 'Risco Crítico', motivo: 'Classificado com risco crítico' };
  }
  if (desvio !== null && desvio > 30) {
    return { tipo: 'critico', label: `Desvio +${desvio}d`, motivo: `Prazo excede linha base em ${desvio} dias` };
  }

  if (p.saude_projeto === 'Atenção') {
    return { tipo: 'atencao', label: 'Atenção', motivo: 'Saúde declarada como atenção' };
  }
  if (p.nivel_risco === 'Alto') {
    return { tipo: 'atencao', label: 'Risco Alto', motivo: 'Classificado com nível de risco alto' };
  }
  if (estourouOrcamento) {
    return { tipo: 'atencao', label: 'Orçamento Excedido', motivo: 'Custo realizado supera o valor previsto' };
  }
  if (desvio !== null && desvio > 0) {
    return { tipo: 'atencao', label: `Desvio +${desvio}d`, motivo: `Atraso moderado de ${desvio} dias` };
  }

  return { tipo: 'ok', label: 'No Prazo', motivo: 'Iniciativa regular dentro dos parâmetros' };
}

/**
 * Percentual das etapas concluídas:
 * Quantidade de etapas com data de fim preenchida (ou "N.A." / "Concluída") / total de etapas * 100
 */
export function calcularPercentualEtapas(etapas?: InovacaoEtapas): number {
  if (!etapas) return 0;
  let concluidas = 0;
  for (const { key } of ETAPAS_CHAVES) {
    const valFim = (etapas as any)[`${key}_fim`];
    const status = (etapas as any)[`${key}_status`];
    if (status === 'Concluída' || (valFim && String(valFim).trim() !== '')) {
      concluidas++;
    }
  }

  const customList = etapas.etapas_personalizadas || [];
  for (const c of customList) {
    if (c.status === 'Concluída' || (c.fim && String(c.fim).trim() !== '')) {
      concluidas++;
    }
  }

  const total = ETAPAS_CHAVES.length + customList.length;
  if (total === 0) return 0;
  return Math.round((concluidas / total) * 100);
}

/**
 * Etapa em curso:
 * Primeira etapa que possui data de início preenchida mas data de fim em branco,
 * ou a última etapa iniciada.
 */
export function determinarEtapaEmCurso(etapas?: InovacaoEtapas): string {
  if (!etapas) return 'Não iniciada';

  // 1. Procura etapa padrão iniciada e ainda não finalizada
  for (const { key, label } of ETAPAS_CHAVES) {
    const nomeEtapa = (etapas as any)[`${key}_titulo`] || label;
    const valIni = (etapas as any)[`${key}_inicio`];
    const valFim = (etapas as any)[`${key}_fim`];
    const status = (etapas as any)[`${key}_status`];
    if (status === 'Em Andamento' || (valIni && String(valIni).trim() !== '' && (!valFim || String(valFim).trim() === '') && status !== 'Concluída')) {
      return nomeEtapa;
    }
  }

  // 2. Procura etapa personalizada iniciada e ainda não finalizada
  const customList = etapas.etapas_personalizadas || [];
  for (const c of customList) {
    if (c.status === 'Em Andamento' || (c.inicio && String(c.inicio).trim() !== '' && (!c.fim || String(c.fim).trim() === '') && c.status !== 'Concluída')) {
      return c.titulo || 'Etapa Adicional';
    }
  }

  // 3. Se todas que iniciaram finalizaram, verifica se todas estão concluídas
  let todasConcluidas = true;
  let ultimaIniciada = 'Não iniciada';

  for (const { key, label } of ETAPAS_CHAVES) {
    const nomeEtapa = (etapas as any)[`${key}_titulo`] || label;
    const valIni = (etapas as any)[`${key}_inicio`];
    const valFim = (etapas as any)[`${key}_fim`];
    const status = (etapas as any)[`${key}_status`];
    if (valIni && String(valIni).trim() !== '') {
      ultimaIniciada = nomeEtapa;
    }
    if (status !== 'Concluída' && (!valFim || String(valFim).trim() === '')) {
      todasConcluidas = false;
    }
  }

  for (const c of customList) {
    if (c.inicio && String(c.inicio).trim() !== '') {
      ultimaIniciada = c.titulo || 'Etapa Adicional';
    }
    if (c.status !== 'Concluída' && (!c.fim || String(c.fim).trim() === '')) {
      todasConcluidas = false;
    }
  }

  if (todasConcluidas) return 'Todas Concluídas (100%)';
  return ultimaIniciada;
}

/**
 * Taxa de adoção:
 * (usuarios_ativos_mes / licencas_disponiveis) * 100 (%)
 */
export function calcularTaxaAdocao(item: InovacaoAdocao): number | null {
  if (!item.licencas_disponiveis || item.licencas_disponiveis <= 0) return null;
  const ativos = item.usuarios_ativos_mes || 0;
  return Number(((ativos / item.licencas_disponiveis) * 100).toFixed(1));
}

/**
 * Percentual de participação em treinamento:
 * (pessoas_treinadas / publico_alvo_treinamento) * 100 (%)
 */
export function calcularParticipacaoTreinamento(item: InovacaoAdocao): number | null {
  if (!item.publico_alvo_treinamento || item.publico_alvo_treinamento <= 0) return null;
  const treinadas = item.pessoas_treinadas || 0;
  return Number(((treinadas / item.publico_alvo_treinamento) * 100).toFixed(1));
}

/**
 * Redução de tempo:
 * ((tempo_medio_antes - tempo_medio_depois) / tempo_medio_antes) * 100 (%)
 */
export function calcularReducaoTempo(item: InovacaoValorQualidade): number | null {
  if (!item.tempo_medio_antes || item.tempo_medio_antes <= 0) return null;
  const depois = item.tempo_medio_depois || 0;
  const diff = item.tempo_medio_antes - depois;
  return Number(((diff / item.tempo_medio_antes) * 100).toFixed(1));
}

/**
 * Ganho de qualidade:
 * ((nota_qualidade_depois - nota_qualidade_antes) / nota_qualidade_antes) * 100 (%)
 */
export function calcularGanhoQualidade(item: InovacaoValorQualidade): number | null {
  if (!item.nota_qualidade_antes || item.nota_qualidade_antes <= 0) return null;
  const depois = item.nota_qualidade_depois || 0;
  const diff = depois - item.nota_qualidade_antes;
  return Number(((diff / item.nota_qualidade_antes) * 100).toFixed(1));
}

export interface MetasApuracaoResultado {
  codigo: string;
  realizado: number;
  unidade: string;
  meta: number;
  atingimento: number; // %
}

/**
 * Recalcula o realizado e % de atingimento para cada meta M1 a M9 ao vivo
 */
export function apurarMetasPE(
  metas: InovacaoMetaPE[],
  projetos: InovacaoProjeto[],
  _etapas: InovacaoEtapas[],
  adocoes: InovacaoAdocao[],
  valores: InovacaoValorQualidade[]
): Record<string, MetasApuracaoResultado> {
  const result: Record<string, MetasApuracaoResultado> = {};

  // M1: Horas Economizadas Acumuladas
  const m1Meta = metas.find(m => m.codigo === 'M1')?.meta || 500;
  const m1Realizado = valores.reduce((acc, v) => acc + (v.horas_economizadas_bimestre || 0), 0);

  // M2: Redução Média de Tempo (%)
  const m2Meta = metas.find(m => m.codigo === 'M2')?.meta || 35;
  const reducoes = valores
    .map(v => calcularReducaoTempo(v))
    .filter((r): r is number => r !== null);
  const m2Realizado = reducoes.length > 0
    ? Number((reducoes.reduce((a, b) => a + b, 0) / reducoes.length).toFixed(1))
    : 0;

  // M3: Iniciativas Concluídas (Go Live)
  const m3Meta = metas.find(m => m.codigo === 'M3')?.meta || 6;
  const m3Realizado = projetos.filter(
    p => p.situacao === 'Concluído' || !!p.golive_realizado
  ).length;

  // M4: Taxa Média de Adoção de Ferramentas (%)
  const m4Meta = metas.find(m => m.codigo === 'M4')?.meta || 75;
  const taxasAdocao = adocoes
    .map(a => calcularTaxaAdocao(a))
    .filter((t): t is number => t !== null);
  const m4Realizado = taxasAdocao.length > 0
    ? Number((taxasAdocao.reduce((a, b) => a + b, 0) / taxasAdocao.length).toFixed(1))
    : 0;

  // M5: Profissionais Treinados
  const m5Meta = metas.find(m => m.codigo === 'M5')?.meta || 120;
  const m5Realizado = adocoes.reduce((acc, a) => acc + (a.pessoas_treinadas || 0), 0);

  // M6: Taxa de Adesão a Treinamentos (%)
  const m6Meta = metas.find(m => m.codigo === 'M6')?.meta || 80;
  const adesaoTrein = adocoes
    .map(a => calcularParticipacaoTreinamento(a))
    .filter((t): t is number => t !== null);
  const m6Realizado = adesaoTrein.length > 0
    ? Number((adesaoTrein.reduce((a, b) => a + b, 0) / adesaoTrein.length).toFixed(1))
    : 0;

  // M7: Ganho Médio de Qualidade (%)
  const m7Meta = metas.find(m => m.codigo === 'M7')?.meta || 25;
  const ganhosQualidade = valores
    .map(v => calcularGanhoQualidade(v))
    .filter((g): g is number => g !== null);
  const m7Realizado = ganhosQualidade.length > 0
    ? Number((ganhosQualidade.reduce((a, b) => a + b, 0) / ganhosQualidade.length).toFixed(1))
    : 0;

  // M8: Satisfação Média (1 a 5)
  const m8Meta = metas.find(m => m.codigo === 'M8')?.meta || 4.5;
  const satisfacoes = valores
    .map(v => v.satisfacao_usuarios)
    .filter(s => typeof s === 'number' && s > 0);
  const m8Realizado = satisfacoes.length > 0
    ? Number((satisfacoes.reduce((a, b) => a + b, 0) / satisfacoes.length).toFixed(1))
    : 0;

  // M9: Aderência Orçamentária (%)
  const m9Meta = metas.find(m => m.codigo === 'M9')?.meta || 100;
  const orcamentoTotal = projetos.reduce((acc, p) => acc + (p.orcamento_previsto || 0), 0);
  const custoTotal = projetos.reduce((acc, p) => acc + (p.custo_realizado || 0), 0);
  const m9Realizado = orcamentoTotal > 0
    ? Number(((custoTotal / orcamentoTotal) * 100).toFixed(1))
    : 0;

  const buildResult = (cod: string, real: number, meta: number, unid: string): MetasApuracaoResultado => {
    const at = meta > 0 ? Number(((real / meta) * 100).toFixed(1)) : 0;
    return { codigo: cod, realizado: real, meta, atingimento: at, unidade: unid };
  };

  result['M1'] = buildResult('M1', m1Realizado, m1Meta, 'h');
  result['M2'] = buildResult('M2', m2Realizado, m2Meta, '%');
  result['M3'] = buildResult('M3', m3Realizado, m3Meta, 'un');
  result['M4'] = buildResult('M4', m4Realizado, m4Meta, '%');
  result['M5'] = buildResult('M5', m5Realizado, m5Meta, 'pessoas');
  result['M6'] = buildResult('M6', m6Realizado, m6Meta, '%');
  result['M7'] = buildResult('M7', m7Realizado, m7Meta, '%');
  result['M8'] = buildResult('M8', m8Realizado, m8Meta, 'pts');
  result['M9'] = buildResult('M9', m9Realizado, m9Meta, '%');

  // Suporte a novas metas cadastradas e a valores realizados manuais
  metas.forEach((m) => {
    if (!result[m.codigo]) {
      const real = typeof m.realizado_manual === 'number' && !isNaN(m.realizado_manual) ? m.realizado_manual : 0;
      result[m.codigo] = buildResult(m.codigo, real, m.meta, m.tipo_meta || '');
    } else if (typeof m.realizado_manual === 'number' && !isNaN(m.realizado_manual)) {
      result[m.codigo] = buildResult(m.codigo, m.realizado_manual, m.meta, m.tipo_meta || result[m.codigo].unidade);
    }
  });

  return result;
}

/**
 * Próximo ID sequencial no padrão INV-001, INV-002...
 */
export function gerarProximoIdInovacao(projetos: InovacaoProjeto[]): string {
  let maiorNum = 0;
  for (const p of projetos) {
    if (p.id && p.id.startsWith('INV-')) {
      const parteNum = parseInt(p.id.replace('INV-', ''), 10);
      if (!isNaN(parteNum) && parteNum > maiorNum) {
        maiorNum = parteNum;
      }
    }
  }
  const prox = maiorNum + 1;
  return `INV-${String(prox).padStart(3, '0')}`;
}

/**
 * Formatação de moeda BRL
 */
export function formatarMoeda(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formatação de data amigável DD/MM/AAAA
 */
export function formatarDataBr(dataStr?: string): string {
  if (!dataStr) return '-';
  if (dataStr === 'N.A.') return 'N.A.';
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataStr;
}

/**
 * Remove campos undefined e valores inválidos para o Firestore
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = cleanFirestoreData(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}
