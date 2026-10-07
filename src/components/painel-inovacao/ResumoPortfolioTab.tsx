import React, { useMemo } from 'react';
import {
  InovacaoProjeto,
  InovacaoValorQualidade
} from '../../types/painelInovacao';
import {
  calcularIdadeItemEmAberto,
  calcularCicloAteGoLive,
  calcularDesvioPrazo,
  formatarMoeda,
  formatarDataBr
} from '../../utils/painelInovacaoCalculos';
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Ban
} from 'lucide-react';

interface Props {
  projetos: InovacaoProjeto[];
  valores: InovacaoValorQualidade[];
  onSelectTab: (tab: string) => void;
}

interface PontoAtencaoItem {
  id: string;
  projeto: InovacaoProjeto;
  alerta: 'Bloqueado' | 'Go live vencido' | 'Acima do orçamento' | 'Sem atualização há mais de 30 dias';
  diasDecorridos: number;
  dataRelevante: string;
  detalhe: string;
}

export const ResumoPortfolioTab: React.FC<Props> = ({ projetos, valores, onSelectTab }) => {
  // ── 1. Cálculos de Top KPIs ───────────────────────────────────────────────
  const concluidos = projetos.filter(p => p.situacao === 'Concluído').length;

  // Saúde dos Projetos (Semáforo)
  const noPrazo = projetos.filter(p => p.saude_projeto === 'No prazo').length;
  const atencao = projetos.filter(p => p.saude_projeto === 'Atenção').length;
  const atrasados = projetos.filter(p => p.saude_projeto === 'Atrasado').length;

  // Financeiro
  const orcamentoTotal = projetos.reduce((acc, p) => acc + (p.orcamento_previsto || 0), 0);
  const custoTotal = projetos.reduce((acc, p) => acc + (p.custo_realizado || 0), 0);
  const percentualConsumido = orcamentoTotal > 0 ? ((custoTotal / orcamentoTotal) * 100).toFixed(1) : '0';

  // Horas Economizadas
  const horasTotal = valores.reduce((acc, v) => acc + (v.horas_economizadas_bimestre || 0), 0);

  // Idade Média dos Itens em Aberto (em dias)
  const projetosAbertos = projetos.filter(p => p.situacao !== 'Concluído' && p.situacao !== 'Cancelado');
  const idades = projetosAbertos.map(p => calcularIdadeItemEmAberto(p));
  const idadeMedia = idades.length > 0 ? Math.round(idades.reduce((a, b) => a + b, 0) / idades.length) : 0;

  // Ciclo Médio até o Go Live (em dias)
  const ciclos = projetos
    .map(p => calcularCicloAteGoLive(p))
    .filter((c): c is number => c !== null);
  const cicloMedio = ciclos.length > 0 ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : 0;

  // ── 2. Pontos de Atenção (Lista por Iniciativa com Alerta Ativo) ────────────
  const pontosDeAtencao = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];

    const getDias = (dataStr?: string): number => {
      if (!dataStr) return 0;
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return 0;
      d.setHours(0, 0, 0, 0);
      const diff = hoje.getTime() - d.getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      return dias >= 0 ? dias : 0;
    };

    const lista: PontoAtencaoItem[] = [];

    for (const p of projetos) {
      if (p.situacao === 'Concluído' || p.situacao === 'Cancelado') continue;

      const dataAtualizacao = p.ultima_atualizacao || p.data_pedido;
      const dataGoLive = p.golive_previsto_atual || p.golive_previsto_linha_base;
      const estourouOrcamento = p.orcamento_previsto > 0 && (p.custo_realizado || 0) > p.orcamento_previsto;

      // 1. Bloqueado
      if (p.bloqueado === 'Sim' || (p as any).alerta_automatico === 'Bloqueado') {
        const dias = getDias(dataAtualizacao);
        lista.push({
          id: `${p.id}-bloqueado`,
          projeto: p,
          alerta: 'Bloqueado',
          diasDecorridos: dias,
          dataRelevante: dataAtualizacao,
          detalhe: p.risco_principal || 'Iniciativa com impedimento declarado'
        });
        continue;
      }

      // 2. Go live vencido
      const goLiveVencido = (!p.golive_realizado && dataGoLive && dataGoLive < hojeStr) ||
        (p as any).alerta_automatico === 'Go live vencido';

      if (goLiveVencido) {
        const dias = getDias(dataGoLive);
        lista.push({
          id: `${p.id}-golive`,
          projeto: p,
          alerta: 'Go live vencido',
          diasDecorridos: dias,
          dataRelevante: dataGoLive,
          detalhe: `Data prevista era ${formatarDataBr(dataGoLive)}`
        });
        continue;
      }

      // 3. Acima do orçamento
      if (estourouOrcamento || (p as any).alerta_automatico === 'Acima do orçamento') {
        const dias = getDias(dataAtualizacao);
        const excedente = (p.custo_realizado || 0) - p.orcamento_previsto;
        lista.push({
          id: `${p.id}-orcamento`,
          projeto: p,
          alerta: 'Acima do orçamento',
          diasDecorridos: dias,
          dataRelevante: dataAtualizacao,
          detalhe: `Excedente de ${formatarMoeda(excedente)}`
        });
        continue;
      }

      // 4. Sem atualização há mais de 30 dias
      const diasSemAtt = getDias(dataAtualizacao);
      if (diasSemAtt > 30 || (p as any).alerta_automatico === 'Sem atualização há mais de 30 dias') {
        lista.push({
          id: `${p.id}-att`,
          projeto: p,
          alerta: 'Sem atualização há mais de 30 dias',
          diasDecorridos: diasSemAtt,
          dataRelevante: dataAtualizacao,
          detalhe: `Último registro em ${formatarDataBr(dataAtualizacao)}`
        });
        continue;
      }
    }

    // Ordenar da iniciativa com alerta mais antigo (maior tempo) para a mais recente
    lista.sort((a, b) => b.diasDecorridos - a.diasDecorridos);
    return lista;
  }, [projetos]);

  // ── 3. Carteira Ativa (Iniciativas com situacao = 'Em Andamento' / 'Ativo') ──
  const carteiraAtiva = useMemo(() => {
    const ativas = projetos.filter(
      p => p.situacao === 'Em Andamento' || (p.situacao as any) === 'Ativo'
    );

    // Ordenação por saúde: Atrasado no topo, depois Atenção, depois No prazo
    const saudePeso = (saude: string) => {
      if (saude === 'Atrasado') return 1;
      if (saude === 'Atenção') return 2;
      if (saude === 'No prazo') return 3;
      return 4;
    };

    ativas.sort((a, b) => {
      const pesoA = saudePeso(a.saude_projeto);
      const pesoB = saudePeso(b.saude_projeto);
      if (pesoA !== pesoB) return pesoA - pesoB;
      const desvA = calcularDesvioPrazo(a) ?? -999;
      const desvB = calcularDesvioPrazo(b) ?? -999;
      return desvB - desvA;
    });

    return ativas;
  }, [projetos]);

  const formatarTempo = (dias: number): string => {
    if (dias === 0) return 'hoje';
    if (dias === 1) return 'há 1 dia';
    return `há ${dias} dias`;
  };

  return (
    <div className="space-y-6">
      {/* ── Top KPIs Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Portfólio Total */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total de Iniciativas
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-[#00B2FF]">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 tracking-tight">
            {projetos.length}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="text-[#00B2FF] font-semibold">{carteiraAtiva.length} ativas</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">{concluidos} concluídas</span>
          </div>
        </div>

        {/* Card 2: Horas Economizadas */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Horas Economizadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 tracking-tight">
            {horasTotal} <span className="text-lg font-normal text-emerald-700">h</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Poupadas acumuladas em automações e IA
          </p>
        </div>

        {/* Card 3: Orçamento e Custo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Custo vs. Orçamento
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-[#00B2FF]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatarMoeda(custoTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Teto: {formatarMoeda(orcamentoTotal)}</span>
            <span className="font-semibold text-gray-700">{percentualConsumido}%</span>
          </div>
        </div>

        {/* Card 4: Velocidade e Ciclo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tempo & Ciclo Médio
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {cicloMedio} <span className="text-sm font-normal text-gray-500">dias</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Ciclo Go Live</span>
            <span>Idade média: <strong>{idadeMedia}d</strong></span>
          </div>
        </div>
      </div>

      {/* ── Segunda Linha: Semáforo de Saúde & Pontos de Atenção ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 1. Painel Semáforo de Saúde (Mantido Conforme Solicitado) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  Saúde do Portfólio
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Monitoramento da aderência aos prazos e riscos
                </p>
              </div>
              <button
                onClick={() => onSelectTab('projetos')}
                className="text-xs text-[#00B2FF] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                Ver tabela <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {/* Verde: No Prazo */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <CheckCircle2 size={18} />
                </div>
                <div className="text-2xl font-bold text-emerald-800">{noPrazo}</div>
                <div className="text-xs font-medium text-emerald-700 mt-1">No prazo</div>
              </div>

              {/* Amarelo: Atenção */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <AlertTriangle size={18} />
                </div>
                <div className="text-2xl font-bold text-amber-800">{atencao}</div>
                <div className="text-xs font-medium text-amber-700 mt-1">Atenção</div>
              </div>

              {/* Vermelho: Atrasado (Madrona #FC745C) */}
              <div className="p-4 rounded-xl bg-rose-50/70 border border-[#FC745C]/30 text-center">
                <div className="w-8 h-8 rounded-full bg-[#FC745C] text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <XCircle size={18} />
                </div>
                <div className="text-2xl font-bold text-[#b83822]">{atrasados}</div>
                <div className="text-xs font-medium text-[#b83822] mt-1">Atrasado</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Novo Componente: Pontos de Atenção (Substitui Situação das Iniciativas) */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-serif flex items-center gap-2">
                  Pontos de Atenção
                  {pontosDeAtencao.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FC745C]/15 text-[#b83822] border border-[#FC745C]/30">
                      {pontosDeAtencao.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Iniciativas com alertas automáticos ativos ordenadas por antiguidade
                </p>
              </div>
              <button
                onClick={() => onSelectTab('projetos')}
                className="text-xs text-[#00B2FF] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                Gerenciar <ArrowRight size={13} />
              </button>
            </div>

            {/* Conteúdo da Lista de Pontos de Atenção */}
            {pontosDeAtencao.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center flex flex-col items-center justify-center my-auto">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Nenhum ponto de atenção no momento
                </h4>
                <p className="text-[11px] text-emerald-700 mt-1 max-w-sm">
                  Todas as iniciativas estão com cronogramas em dia, dentro do orçamento e sem bloqueios ativos.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {pontosDeAtencao.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:bg-gray-100/60 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-200 shrink-0">
                          {item.projeto.id}
                        </span>
                        <h4
                          onClick={() => onSelectTab('projetos')}
                          className="text-xs font-bold text-gray-900 truncate hover:text-[#00B2FF] cursor-pointer"
                          title={item.projeto.projeto}
                        >
                          {item.projeto.projeto}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 truncate">
                        {item.detalhe}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FC745C]/15 text-[#b83822] border border-[#FC745C]/30">
                        {item.alerta === 'Bloqueado' && <Ban size={10} />}
                        {item.alerta === 'Go live vencido' && <Calendar size={10} />}
                        {item.alerta === 'Acima do orçamento' && <DollarSign size={10} />}
                        {item.alerta === 'Sem atualização há mais de 30 dias' && <Clock size={10} />}
                        {item.alerta}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">
                        {formatarTempo(item.diasDecorridos)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Terceira Linha: Carteira Ativa (Substitui Funil de Etapas) ─────── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 font-serif flex items-center gap-2">
              Carteira Ativa
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#00B2FF] border border-sky-100">
                {carteiraAtiva.length} em andamento
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Lista nominal das iniciativas ativas ordenadas por saúde
            </p>
          </div>
          <button
            onClick={() => onSelectTab('projetos')}
            className="text-xs text-[#00B2FF] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            Ver detalhes na tabela <ArrowRight size={13} />
          </button>
        </div>

        {carteiraAtiva.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-medium bg-gray-50/50 rounded-xl border border-gray-100">
            Nenhuma iniciativa com situação ativa no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3.5 min-w-[220px]">Iniciativa / Projeto</th>
                  <th className="py-2.5 px-3.5 text-center w-32">Saúde</th>
                  <th className="py-2.5 px-3.5 text-center w-36">Desvio de Prazo</th>
                  <th className="py-2.5 px-3.5 min-w-[260px]">Próximo Passo / Ação Imediata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {carteiraAtiva.map((p) => {
                  const desvio = calcularDesvioPrazo(p);
                  let desvioFormatado = '-';
                  let desvioClasse = 'text-gray-500 font-medium';

                  if (desvio !== null) {
                    if (desvio > 0) {
                      desvioFormatado = `+${desvio} dias`;
                      desvioClasse = 'text-[#b83822] font-bold'; // Positivo significa atraso!
                    } else if (desvio < 0) {
                      desvioFormatado = `${desvio} dias`;
                      desvioClasse = 'text-emerald-700 font-medium';
                    } else {
                      desvioFormatado = '0 dias';
                      desvioClasse = 'text-emerald-700 font-medium';
                    }
                  }

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-sky-50/30 transition-colors group"
                    >
                      {/* Nome do Projeto + ID */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                            {p.id}
                          </span>
                          <span
                            onClick={() => onSelectTab('projetos')}
                            className="font-semibold text-gray-900 group-hover:text-[#00B2FF] cursor-pointer transition-colors"
                            title={p.projeto}
                          >
                            {p.projeto}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 pl-0.5">
                          {p.un_area} • {p.etapa_atual}
                        </div>
                      </td>

                      {/* Saúde do Projeto com Cores do Semáforo */}
                      <td className="py-3 px-3.5 text-center">
                        {p.saude_projeto === 'No prazo' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            No prazo
                          </span>
                        )}
                        {p.saude_projeto === 'Atenção' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Atenção
                          </span>
                        )}
                        {p.saude_projeto === 'Atrasado' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-[#b83822] border border-[#FC745C]/30">
                            Atrasado
                          </span>
                        )}
                        {!['No prazo', 'Atenção', 'Atrasado'].includes(p.saude_projeto) && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                            {p.saude_projeto || '-'}
                          </span>
                        )}
                      </td>

                      {/* Desvio de Prazo em Dias com Sinal */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`text-xs ${desvioClasse}`}>
                          {desvioFormatado}
                        </span>
                      </td>

                      {/* Próximo Passo */}
                      <td className="py-3 px-3.5">
                        <span
                          className="text-xs text-gray-600 line-clamp-1 leading-relaxed"
                          title={p.proximo_passo || 'Aguardando definição'}
                        >
                          {p.proximo_passo || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
