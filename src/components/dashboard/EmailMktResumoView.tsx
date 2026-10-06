import React, { useMemo } from 'react';
import { emailMailingData } from '../../data/email-mailing.data';
import { emailContribuicoesData } from '../../data/email-contribuicoes.data';
import { emailRadarData } from '../../data/email-radar.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Mail,
  BookOpen,
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  Percent,
  Sparkles
} from 'lucide-react';

interface EmailMktResumoViewProps {
  selectedMonth?: string;
  selectedUn?: string;
}

export default function EmailMktResumoView({ selectedMonth = 'Todos os meses', selectedUn = 'Todas as UNs' }: EmailMktResumoViewProps) {
  const isAllUns = selectedUn === 'Todas as UNs';

  // 1. Linha ativa do emailMailingData: "Todos", ou a UN selecionada quando houver correspondência
  // (Mailing não tem campo de UN padronizado, usa o próprio "area"; Radar Tributário não tem UN)
  const todosRow = useMemo(() => {
    if (isAllUns) return emailMailingData.find((d) => d.area === 'Todos');
    return emailMailingData.find((d) => d.area !== 'Todos' && normalizarUN(d.area) === selectedUn);
  }, [isAllUns, selectedUn]);

  // Último mês com dado apurado na linha ativa (calculado a partir da base, não fixo no código)
  const MESES_COLUNAS = [
    { key: 'janeiro', label: 'Janeiro' }, { key: 'fevereiro', label: 'Fevereiro' },
    { key: 'marco', label: 'Março' }, { key: 'abril', label: 'Abril' },
    { key: 'maio', label: 'Maio' }, { key: 'junho', label: 'Junho' },
    { key: 'julho', label: 'Julho' }, { key: 'agosto', label: 'Agosto' },
    { key: 'setembro', label: 'Setembro' }, { key: 'outubro', label: 'Outubro' },
    { key: 'novembro', label: 'Novembro' }, { key: 'dezembro', label: 'Dezembro' }
  ] as const;

  const ultimoMesApurado = useMemo(() => {
    if (!todosRow) return MESES_COLUNAS[0];
    let ultimo = MESES_COLUNAS[0];
    MESES_COLUNAS.forEach((col) => {
      if ((todosRow as any)[col.key] !== null && (todosRow as any)[col.key] !== undefined) {
        ultimo = col;
      }
    });
    return ultimo;
  }, [todosRow]);

  // Total de inscritos no mês mais recente disponível (calculado, não fixo)
  const totalInscritosAgosto = todosRow ? ((todosRow as any)[ultimoMesApurado.key] || 0) : 0;

  // 2. Edições do Jornal B&F (respeitando o filtro de UN, já que essa base tem campo "un")
  const contribuicoesFiltradas = useMemo(() => {
    if (isAllUns) return emailContribuicoesData;
    return emailContribuicoesData.filter((d) => normalizarUN(d.un) === selectedUn);
  }, [isAllUns, selectedUn]);

  const edicoesJornalBF = contribuicoesFiltradas.length;

  // 3. Edições do Radar Tributário (sem UN na base, não filtra)
  const edicoesRadar = emailRadarData.length;

  // 4. Taxa de abertura média do Radar Tributário
  const taxaAberturaMediaRadar = useMemo(() => {
    const valid = emailRadarData
      .map((d) => d.taxa_abertura)
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));

    if (valid.length === 0) return '0.00';
    const sum = valid.reduce((a, b) => a + b, 0);
    return (sum / valid.length).toFixed(2);
  }, []);

  // 5. Evolução mensal de inscritos (Janeiro a Dezembro; meses sem dado ainda ficam de fora, não travam no mais recente apurado)
  const mesesEvolucaoMailing = useMemo(() => {
    const meses = [
      { mes: 'Janeiro', valor: todosRow?.janeiro },
      { mes: 'Fevereiro', valor: todosRow?.fevereiro },
      { mes: 'Março', valor: todosRow?.marco },
      { mes: 'Abril', valor: todosRow?.abril },
      { mes: 'Maio', valor: todosRow?.maio },
      { mes: 'Junho', valor: todosRow?.junho },
      { mes: 'Julho', valor: todosRow?.julho },
      { mes: 'Agosto', valor: todosRow?.agosto },
      { mes: 'Setembro', valor: todosRow?.setembro },
      { mes: 'Outubro', valor: todosRow?.outubro },
      { mes: 'Novembro', valor: todosRow?.novembro },
      { mes: 'Dezembro', valor: todosRow?.dezembro }
    ];

    // Exclui meses nulos
    return meses.filter((m): m is { mes: string; valor: number } => typeof m.valor === 'number');
  }, [todosRow]);

  const minInscritos = useMemo(() => {
    if (mesesEvolucaoMailing.length === 0) return 18000;
    return Math.min(...mesesEvolucaoMailing.map((m) => m.valor));
  }, [mesesEvolucaoMailing]);

  const maxInscritos = useMemo(() => {
    if (mesesEvolucaoMailing.length === 0) return 21000;
    return Math.max(...mesesEvolucaoMailing.map((m) => m.valor));
  }, [mesesEvolucaoMailing]);

  const crescimentoInscritos = useMemo(() => {
    if (mesesEvolucaoMailing.length < 2) return 0;
    const primeiro = mesesEvolucaoMailing[0].valor;
    const ultimo = mesesEvolucaoMailing[mesesEvolucaoMailing.length - 1].valor;
    return ultimo - primeiro;
  }, [mesesEvolucaoMailing]);

  // 6. Comparativo de Taxas de Abertura por Edição
  // Radar Tributário (10 edições)
  const radarEdicoesTaxas = useMemo(() => {
    return emailRadarData.map((d, index) => ({
      id: `radar-${index + 1}`,
      edicaoLabel: `Ed. ${index + 1}`,
      newsletter: 'Radar Tributário',
      mes: d.mes,
      tema: d.tema.replace('Radar Tributário | ', ''),
      taxa: d.taxa_abertura
    }));
  }, []);

  // Jornal B&F (agrupado por edição para pegar a taxa não nula de cada edição; respeita o filtro de UN)
  const jornalBFEdicoesTaxas = useMemo(() => {
    const edicoesMap = new Map<string, { edicao: string; mes: string; taxa: number }>();

    contribuicoesFiltradas.forEach((d) => {
      const edKey = d.edicao || d.mes;
      if (typeof d.taxa_abertura === 'number' && !edicoesMap.has(edKey)) {
        edicoesMap.set(edKey, {
          edicao: edKey,
          mes: d.mes,
          taxa: d.taxa_abertura
        });
      }
    });

    return Array.from(edicoesMap.values()).map((d) => ({
      id: `bf-${d.edicao}`,
      edicaoLabel: d.edicao,
      newsletter: 'Jornal B&F',
      mes: d.mes,
      tema: `Edição de ${d.mes}`,
      taxa: d.taxa
    }));
  }, [contribuicoesFiltradas]);

  const maxTaxaGeral = useMemo(() => {
    const todasTaxas = [
      ...radarEdicoesTaxas.map((d) => d.taxa),
      ...jornalBFEdicoesTaxas.map((d) => d.taxa)
    ].filter((t): t is number => typeof t === 'number');

    return todasTaxas.length > 0 ? Math.max(...todasTaxas) : 50;
  }, [radarEdicoesTaxas, jornalBFEdicoesTaxas]);

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOPO)                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Inscritos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              {isAllUns ? 'Total de Inscritos' : `Inscritos — ${selectedUn}`}
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalInscritosAgosto.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              {isAllUns ? `dado de ${ultimoMesApurado.label} • linha Todos` : `dado de ${ultimoMesApurado.label}`} (+{crescimentoInscritos.toLocaleString('pt-BR')} no ano)
            </div>
          </div>
        </div>

        {/* Card 2: Edições do Jornal B&F */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Edições do Jornal B&F
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {edicoesJornalBF}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5 truncate">
              artigos e contribuições publicadas
            </div>
          </div>
        </div>

        {/* Card 3: Edições do Radar Tributário */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <FileText size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Edições Radar Tributário
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-900 mt-0.5">
              {edicoesRadar}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
              disparos temáticos técnicos realizados
            </div>
          </div>
        </div>

        {/* Card 4: Taxa de Abertura Média */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <TrendingUp size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Taxa de Abertura Média
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {taxaAberturaMediaRadar}%
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">
              Radar Tributário (média das 10 edições)
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICOS ANALÍTICOS (EVOLUÇÃO DE INSCRITOS + TAXA DE ABERTURA)     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Mensal de Inscritos (Janeiro a Dezembro) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <Users size={18} className="text-brand-blue" />
                  <span>Evolução de Inscritos no Mailing</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Crescimento da base geral de contatos ativos (Janeiro a Dezembro)
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-brand-blue border border-blue-100">
                +{crescimentoInscritos.toLocaleString('pt-BR')} no ano
              </span>
            </div>

            {/* Grid em linhas de 6 meses */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2.5 my-4">
              {mesesEvolucaoMailing.map((item) => {
                const isSelected = selectedMonth === item.mes;
                const heightPct = Math.max(
                  25,
                  Math.round(
                    ((item.valor - (minInscritos - 800)) / ((maxInscritos - (minInscritos - 800)) || 1)) * 100
                  )
                );

                return (
                  <div
                    key={item.mes}
                    className={`rounded-xl border p-2 flex flex-col justify-between text-center transition-all ${
                      isSelected
                        ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/60 shadow-xs'
                        : 'border-gray-200/70 bg-gray-50/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate">
                      {item.mes.slice(0, 3)}
                    </span>

                    <div className="my-2 flex flex-col items-center justify-end h-28">
                      <span className="text-[11px] font-serif font-bold text-gray-900 mb-1">
                        {item.valor.toLocaleString('pt-BR')}
                      </span>
                      <div className="w-6 bg-gray-200 rounded-t-md h-20 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-700 ${
                            isSelected
                              ? 'bg-brand-navy'
                              : 'bg-gradient-to-t from-brand-blue to-sky-400'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-400 border-t border-gray-200/60 pt-1 truncate">
                      inscritos
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Meses monitorados: <strong>Janeiro a Dezembro/2026</strong></span>
            <span className="text-brand-navy font-semibold">
              Taxa de crescimento: +{((crescimentoInscritos / (minInscritos || 1)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Gráfico 2: Comparativo de Taxa de Abertura por Edição */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-blue" />
                  <span>Taxa de Abertura por Edição</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparativo de engajamento entre o Radar Tributário e o Jornal B&F
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span>Radar Tributário ({radarEdicoesTaxas.length} eds.)</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                  <span>Jornal B&F ({jornalBFEdicoesTaxas.length} eds.)</span>
                </div>
              </div>
            </div>

            {/* Lista com as edições das 2 newsletters */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {/* Seção Radar Tributário */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-md mb-2 flex items-center justify-between">
                  <span>Radar Tributário (Média: {taxaAberturaMediaRadar}%)</span>
                  <span>10 Edições</span>
                </div>

                <div className="space-y-2">
                  {radarEdicoesTaxas.map((item) => {
                    const barWidth = (item.taxa / maxTaxaGeral) * 100;

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-200 px-1.5 py-0.5 rounded flex-shrink-0">
                              {item.edicaoLabel} ({item.mes})
                            </span>
                            <span className="text-gray-800 truncate text-[11px]" title={item.tema}>
                              {item.tema}
                            </span>
                          </div>

                          <span className="font-serif font-bold text-emerald-800 flex-shrink-0">
                            {item.taxa.toFixed(2)}%
                          </span>
                        </div>

                        <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção Jornal B&F */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50/80 px-2.5 py-1 rounded-md mb-2 flex items-center justify-between">
                  <span>Jornal B&F (Média: 34,39%)</span>
                  <span>4 Edições com métricas</span>
                </div>

                <div className="space-y-2">
                  {jornalBFEdicoesTaxas.map((item) => {
                    const barWidth = (item.taxa / maxTaxaGeral) * 100;

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-purple-800 bg-white border border-purple-200 px-1.5 py-0.5 rounded flex-shrink-0">
                              {item.edicaoLabel} ({item.mes})
                            </span>
                            <span className="text-gray-800 truncate text-[11px]">
                              {item.tema}
                            </span>
                          </div>

                          <span className="font-serif font-bold text-purple-800 flex-shrink-0">
                            {item.taxa.toFixed(2)}%
                          </span>
                        </div>

                        <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-600 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between mt-3">
            <span>Padrão de benchmark de mercado:</span>
            <strong className="text-emerald-700 font-semibold">Todas as edições acima de 30% de abertura</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
