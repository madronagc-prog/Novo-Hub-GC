import React, { useMemo } from 'react';
import { tsCtDetalhadoData } from '../../data/ts-ct-detalhado.data';
import { tsGcAtividadesData } from '../../data/ts-gc-atividades.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Clock,
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';

interface TsResumoViewProps {
  selectedMonth?: string;
  selectedUn?: string;
}

const MESES_ANALISE = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

function formatarMoeda(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarHorasMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return `${h}h ${m}min`;
}

export default function TsResumoView({ selectedMonth = 'Todos os meses', selectedUn = 'Todas as UNs' }: TsResumoViewProps) {
  const isAllMonths = selectedMonth === 'Todos os meses';
  const isAllUns = selectedUn === 'Todas as UNs';

  // 1. Filtragem por mês e UN para os dados de TS CT (TS GC não tem campo de UN, só filtra por mês)
  const filteredCt = useMemo(() => {
    let data = tsCtDetalhadoData;
    if (!isAllMonths) data = data.filter((d) => normalizarMes(d.mes) === selectedMonth);
    if (!isAllUns) data = data.filter((d) => normalizarUN(d.un) === selectedUn);
    return data;
  }, [isAllMonths, selectedMonth, isAllUns, selectedUn]);

  const filteredGc = useMemo(() => {
    if (isAllMonths) return tsGcAtividadesData;
    return tsGcAtividadesData.filter((d) => normalizarMes(d.mes) === selectedMonth);
  }, [isAllMonths, selectedMonth]);

  // Card 1: Valor total investido (TS CT)
  const valorTotalCt = useMemo(() => {
    return filteredCt.reduce((acc, d) => {
      const v = typeof d.valor === 'number' && !isNaN(d.valor) ? d.valor : 0;
      return acc + v;
    }, 0);
  }, [filteredCt]);

  // Card 2: Tempo total investido (TS CT)
  const tempoMinutosCt = useMemo(() => {
    return filteredCt.reduce((acc, d) => {
      const m = typeof d.tempo_minutos === 'number' && !isNaN(d.tempo_minutos) ? d.tempo_minutos : 0;
      return acc + m;
    }, 0);
  }, [filteredCt]);

  // Card 3: Colaboradores de outras áreas envolvidos
  const colaboradoresUnicosCt = useMemo(() => {
    const nomes = new Set<string>();
    filteredCt.forEach((d) => {
      if (d.nome && d.nome.trim()) {
        nomes.add(d.nome.trim());
      }
    });
    return nomes.size;
  }, [filteredCt]);

  // Card 4: Tempo total da equipe de GC (TS GC)
  const tempoMinutosGc = useMemo(() => {
    return filteredGc.reduce((acc, d) => {
      const m = typeof d.tempo_investido_minutos === 'number' && !isNaN(d.tempo_investido_minutos)
        ? d.tempo_investido_minutos
        : 0;
      return acc + m;
    }, 0);
  }, [filteredGc]);

  // 2. Gráfico de Evolução Mensal: Valor (R$) e Tempo (horas) em TS CT (Janeiro a Dezembro; respeita o filtro de UN)
  const evolucaoMensalCt = useMemo(() => {
    const base = isAllUns ? tsCtDetalhadoData : tsCtDetalhadoData.filter((d) => normalizarUN(d.un) === selectedUn);
    return MESES_ANALISE.map((m) => {
      const itens = base.filter((d) => normalizarMes(d.mes) === m);
      const valor = itens.reduce((acc, d) => acc + (typeof d.valor === 'number' ? d.valor : 0), 0);
      const minutos = itens.reduce((acc, d) => acc + (typeof d.tempo_minutos === 'number' ? d.tempo_minutos : 0), 0);
      const horas = minutos / 60;

      return {
        mes: m,
        count: itens.length,
        valor,
        minutos,
        horas: Number(horas.toFixed(1))
      };
    });
  }, [isAllUns, selectedUn]);

  const maxValorMensal = useMemo(() => {
    const maxVal = Math.max(...evolucaoMensalCt.map((e) => e.valor));
    return maxVal > 0 ? maxVal : 1;
  }, [evolucaoMensalCt]);

  const maxHorasMensal = useMemo(() => {
    const maxVal = Math.max(...evolucaoMensalCt.map((e) => e.horas));
    return maxVal > 0 ? maxVal : 1;
  }, [evolucaoMensalCt]);

  // 3. Gráfico Comparativo: Tempo por Frente em TS CT
  const tempoPorFrenteCt = useMemo(() => {
    const frentesMap: Record<string, number> = {};

    filteredCt.forEach((d) => {
      const f = d.frente ? d.frente.replace('GC | ', '').trim() : 'Outros';
      frentesMap[f] = (frentesMap[f] || 0) + (d.tempo_minutos || 0);
    });

    const totalMin = Object.values(frentesMap).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(frentesMap)
      .map(([frente, minutos]) => ({
        frente,
        minutos,
        horas: (minutos / 60).toFixed(1),
        percentual: (minutos / totalMin) * 100
      }))
      .sort((a, b) => b.minutos - a.minutos);
  }, [filteredCt]);

  const maxFrenteCtMin = tempoPorFrenteCt[0]?.minutos || 1;

  // 4. Gráfico Comparativo: Tempo por Categoria em TS GC
  const tempoPorCategoriaGc = useMemo(() => {
    const base = filteredGc.length > 0 ? filteredGc : tsGcAtividadesData;
    const catMap: Record<string, number> = {};

    base.forEach((d) => {
      const c = d.categoria ? d.categoria.trim() : 'Outros';
      catMap[c] = (catMap[c] || 0) + (d.tempo_investido_minutos || 0);
    });

    const totalMin = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(catMap)
      .map(([categoria, minutos]) => ({
        categoria,
        minutos,
        horas: (minutos / 60).toFixed(1),
        percentual: (minutos / totalMin) * 100
      }))
      .sort((a, b) => b.minutos - a.minutos);
  }, [filteredGc]);

  const maxCategoriaGcMin = tempoPorCategoriaGc[0]?.minutos || 1;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOPO)                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Valor total investido (TS CT) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Valor Investido (TS CT)
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-800 mt-0.5 truncate" title={formatarMoeda(valorTotalCt)}>
              {formatarMoeda(valorTotalCt)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              {isAllMonths ? 'investimento financeiro acumulado' : `investimento em ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Card 2: Tempo total investido (TS CT) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Clock size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Tempo Investido (TS CT)
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {formatarHorasMinutos(tempoMinutosCt)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              horas dedicadas por outras áreas
            </div>
          </div>
        </div>

        {/* Card 3: Colaboradores de outras áreas envolvidos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Colaboradores Envolvidos
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {colaboradoresUnicosCt}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5 truncate">
              advogados e sócios de UNs ativas
            </div>
          </div>
        </div>

        {/* Card 4: Tempo total da equipe de GC (TS GC) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Briefcase size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Tempo Equipe de GC (TS GC)
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-900 mt-0.5">
              {formatarHorasMinutos(tempoMinutosGc)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">
              dedicação interna da equipe de GC
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (VALOR R$ E HORAS INVESTIDAS)          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-blue" />
              <span>Evolução Mensal - Valor Investido e Horas (TS CT)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhamento de alocação de tempo e valor monetário aportado por mês
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span>Valor (R$)</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span>Tempo (Horas)</span>
            </div>
          </div>
        </div>

        {/* Grid em linhas de 6 meses */}
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 my-4">
          {evolucaoMensalCt.map((item) => {
            const isSelected = selectedMonth === item.mes;
            const valorHeight = item.valor > 0 ? Math.max(15, Math.round((item.valor / maxValorMensal) * 100)) : 8;
            const horasHeight = item.horas > 0 ? Math.max(15, Math.round((item.horas / maxHorasMensal) * 100)) : 8;

            return (
              <div
                key={item.mes}
                className={`rounded-xl border p-2 flex flex-col justify-between text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/60 shadow-xs'
                    : 'border-gray-200/70 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate">
                    {item.mes.slice(0, 3)}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>
                  )}
                </div>

                {/* Colunas lado a lado: Valor e Horas */}
                <div className="my-2 flex items-end justify-center gap-1.5 h-28">
                  {/* Coluna Valor (R$) */}
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-emerald-700 font-bold mb-0.5 truncate max-w-[36px]" title={formatarMoeda(item.valor)}>
                      {item.valor > 0 ? `${(item.valor / 1000).toFixed(0)}k` : '0'}
                    </span>
                    <div className="w-3 bg-gray-200 rounded-t-sm h-20 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-emerald-600 rounded-t-sm transition-all duration-700"
                        style={{ height: `${valorHeight}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Coluna Horas */}
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-brand-navy font-bold mb-0.5">
                      {item.horas > 0 ? `${item.horas.toFixed(0)}h` : '0h'}
                    </span>
                    <div className="w-3 bg-gray-200 rounded-t-sm h-20 flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-700 ${
                          isSelected ? 'bg-brand-navy' : 'bg-brand-blue'
                        }`}
                        style={{ height: `${horasHeight}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-gray-500 border-t border-gray-200/60 pt-1 leading-tight">
                  <span className="font-semibold text-gray-800">{item.count} ap.</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>Total acumulado no período: <strong>{formatarMoeda(evolucaoMensalCt.reduce((acc, e) => acc + e.valor, 0))}</strong></span>
          <span className="text-brand-navy font-semibold">
            {formatarHorasMinutos(evolucaoMensalCt.reduce((acc, e) => acc + e.minutos, 0))} alocados em projetos de GC
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. GRÁFICOS COMPARATIVOS LADO A LADO: FRENTES TS CT vs CATEGORIAS TS GC */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Esquerdo: Tempo por Frente em TS CT (Outras Áreas) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <Layers size={18} className="text-brand-blue" />
                  <span>Tempo por Frente (TS CT)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dedicação das áreas jurídicas às frentes do Conhecimento
                </p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100">
                {tempoPorFrenteCt.length} frentes
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {tempoPorFrenteCt.map((item, idx) => {
                const barWidth = (item.minutos / maxFrenteCtMin) * 100;

                return (
                  <div
                    key={item.frente}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-600 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">
                          {item.frente}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-serif font-bold text-brand-navy">
                          {formatarHorasMinutos(item.minutos)}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-blue to-sky-500 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between mt-4">
            <span>Frente mais demandada:</span>
            <strong className="text-brand-navy font-semibold">
              {tempoPorFrenteCt[0]?.frente} ({formatarHorasMinutos(tempoPorFrenteCt[0]?.minutos || 0)})
            </strong>
          </div>
        </div>

        {/* Gráfico Direito: Tempo por Categoria em TS GC (Equipe Interna de GC) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <Briefcase size={18} className="text-amber-600" />
                  <span>Tempo por Categoria (TS GC)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Alocação interna de tempo das analistas e equipe de Gestão do Conhecimento
                </p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {tempoPorCategoriaGc.length} categorias
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {tempoPorCategoriaGc.map((item, idx) => {
                const barWidth = (item.minutos / maxCategoriaGcMin) * 100;

                return (
                  <div
                    key={item.categoria}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-600 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">
                          {item.categoria}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-serif font-bold text-amber-900">
                          {formatarHorasMinutos(item.minutos)}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between mt-4">
            <span>Categoria prioritária de GC:</span>
            <strong className="text-amber-900 font-semibold">
              {tempoPorCategoriaGc[0]?.categoria} ({formatarHorasMinutos(tempoPorCategoriaGc[0]?.minutos || 0)})
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
