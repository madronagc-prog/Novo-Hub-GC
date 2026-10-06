import React, { useMemo } from 'react';
import { impAtividadesData } from '../../data/imp-atividades.data';
import { impClippingData } from '../../data/imp-clipping.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Newspaper,
  CheckCircle2,
  UserCheck,
  Scissors,
  TrendingUp,
  BarChart3,
  Award,
  Sparkles
} from 'lucide-react';

interface ImpResumoViewProps {
  selectedMonth?: string;
  selectedUn?: string;
}

const MESES_ANO = [
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

const MESES_CHAVES_CLIPPING = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
] as const;

export default function ImpResumoView({ selectedMonth = 'Todos os meses', selectedUn = 'Todas as UNs' }: ImpResumoViewProps) {
  const isAllMonths = selectedMonth === 'Todos os meses';
  const isAllUns = selectedUn === 'Todas as UNs';

  // 1. Filtragem de atividades por mês e UN
  const filteredAtividades = useMemo(() => {
    let data = impAtividadesData;
    if (!isAllMonths) data = data.filter((d) => normalizarMes(d.mes) === selectedMonth);
    if (!isAllUns) data = data.filter((d) => normalizarUN(d.un) === selectedUn);
    return data;
  }, [isAllMonths, selectedMonth, isAllUns, selectedUn]);

  // Clipping filtrado por UN (cada linha já é uma área/UN)
  const filteredClipping = useMemo(() => {
    if (isAllUns) return impClippingData;
    return impClippingData.filter((row) => normalizarUN(row.area) === selectedUn);
  }, [isAllUns, selectedUn]);

  // Card 1: Total de atividades de imprensa
  const totalAtividades = filteredAtividades.length;

  // Card 2: Taxa de conversão em pauta (registros com pauta_convertida = "Sim")
  const conversaoPauta = useMemo(() => {
    const base = filteredAtividades;
    const convertidas = base.filter((d) => {
      const val = String(d.pauta_convertida || '').toLowerCase().trim();
      return val === 'sim' || val === 'true';
    });

    const taxa = base.length > 0 ? (convertidas.length / base.length) * 100 : 0;
    return {
      taxa: taxa.toFixed(1),
      count: convertidas.length,
      total: base.length
    };
  }, [filteredAtividades]);

  // Card 3: Porta-voz mais atuante
  const portaVozMaisAtuante = useMemo(() => {
    const base = filteredAtividades;
    const counts: Record<string, number> = {};

    base.forEach((d) => {
      if (d.porta_voz && d.porta_voz.trim()) {
        const pv = d.porta_voz.trim();
        counts[pv] = (counts[pv] || 0) + 1;
      }
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { nome: 'N/A', total: 0 };

    return {
      nome: entries[0][0],
      total: entries[0][1]
    };
  }, [filteredAtividades]);

  // Card 4: Total de clippings no período (soma de todos os meses de todas as áreas, já filtrado por UN)
  const totalClippingsPeriodo = useMemo(() => {
    return filteredClipping.reduce((acc, row) => {
      const somaLinha = MESES_CHAVES_CLIPPING.reduce((s, m) => {
        const val = row[m];
        return s + (typeof val === 'number' ? val : 0);
      }, 0);
      return acc + somaLinha;
    }, 0);
  }, [filteredClipping]);

  // 2. Gráfico de Evolução Mensal de Atividades (Janeiro a Dezembro; respeita o filtro de UN)
  const evolucaoAtividades = useMemo(() => {
    const base = isAllUns ? impAtividadesData : impAtividadesData.filter((d) => normalizarUN(d.un) === selectedUn);
    return MESES_ANO.map((m) => {
      const count = base.filter((d) => normalizarMes(d.mes) === m).length;
      return {
        mes: m,
        count
      };
    });
  }, [isAllUns, selectedUn]);

  const maxAtividadesMes = useMemo(() => {
    const maxVal = Math.max(...evolucaoAtividades.map((e) => e.count));
    return maxVal > 0 ? maxVal : 1;
  }, [evolucaoAtividades]);

  // 3. Gráfico com as 10 áreas com mais clippings no período (ignora filtro de mês; respeita UN)
  const top10AreasClipping = useMemo(() => {
    const areasTotais = filteredClipping.map((row) => {
      const somaLinha = MESES_CHAVES_CLIPPING.reduce((s, m) => {
        const val = row[m];
        return s + (typeof val === 'number' ? val : 0);
      }, 0);

      return {
        area: row.area,
        total: somaLinha
      };
    });

    return areasTotais
      .filter((a) => a.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredClipping]);

  const maxClippingArea = top10AreasClipping[0]?.total || 1;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOPO)                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Atividades de Imprensa */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Newspaper size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Atividades de Imprensa
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalAtividades}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              {isAllMonths ? 'ações de assessoria e pautas' : `atividades em ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Card 2: Taxa de Conversão em Pauta */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Conversão em Pauta
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {conversaoPauta.taxa}%
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
              {conversaoPauta.count} de {conversaoPauta.total} pautas convertidas
            </div>
          </div>
        </div>

        {/* Card 3: Porta-Voz Mais Atuante */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <UserCheck size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Porta-Voz Mais Atuante
            </div>
            <div className="text-lg sm:text-xl font-serif font-bold text-purple-900 mt-0.5 truncate" title={portaVozMaisAtuante.nome}>
              {portaVozMaisAtuante.nome}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5 truncate">
              {portaVozMaisAtuante.total} {portaVozMaisAtuante.total === 1 ? 'participação' : 'participações'} na mídia
            </div>
          </div>
        </div>

        {/* Card 4: Total de Clippings no Período */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Scissors size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Clippings no Período
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalClippingsPeriodo}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">
              inserções registradas em veículos
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICOS ANALÍTICOS (EVOLUÇÃO MENSAL + TOP 10 CLIPPINGS POR ÁREA) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Mensal de Atividades (Janeiro a Dezembro) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-blue" />
                  <span>Evolução Mensal de Atividades</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Número de atividades de imprensa distribuídas mês a mês (Janeiro a Dezembro)
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-brand-blue border border-blue-100">
                Total: {evolucaoAtividades.reduce((a, e) => a + e.count, 0)}
              </span>
            </div>

            {/* Grid dos 12 meses */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 my-4">
              {evolucaoAtividades.map((item) => {
                const isSelected = selectedMonth === item.mes;
                const heightPct = item.count > 0 ? Math.max(16, Math.round((item.count / maxAtividadesMes) * 100)) : 8;

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
                      <span className="text-xs font-serif font-bold text-gray-800 mb-1">
                        {item.count}
                      </span>
                      <div className="w-6 bg-gray-200 rounded-t-md h-20 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-700 ${
                            isSelected
                              ? 'bg-brand-navy'
                              : item.count > 0
                              ? 'bg-gradient-to-t from-brand-blue to-sky-400'
                              : 'bg-gray-300'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-400 border-t border-gray-200/60 pt-1">
                      {item.count === 1 ? '1 ativ.' : `${item.count} ativ.`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Período selecionado no filtro:</span>
            <strong className="text-brand-navy font-semibold">
              {selectedMonth} ({totalAtividades} {totalAtividades === 1 ? 'atividade' : 'atividades'})
            </strong>
          </div>
        </div>

        {/* Gráfico 2: 10 Áreas com Mais Clippings no Período (ignora filtro de mês) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-blue" />
                  <span>Clippings por Área</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  10 áreas com maior volume de veiculações na imprensa (Janeiro a Dezembro)
                </p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Top 10 Áreas
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {top10AreasClipping.map((item, idx) => {
                const barWidth = (item.total / maxClippingArea) * 100;
                const percentualGeral = totalClippingsPeriodo > 0 ? (item.total / totalClippingsPeriodo) * 100 : 0;

                return (
                  <div
                    key={item.area}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-600 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">
                          {item.area}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-serif font-bold text-brand-navy">
                          {item.total} {item.total === 1 ? 'clipping' : 'clippings'}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {percentualGeral.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                            : idx === 1
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                            : 'bg-gradient-to-r from-slate-600 to-slate-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Total consolidado de clipagens:</span>
            <strong className="text-brand-navy font-semibold">
              {totalClippingsPeriodo} clippings em veículos de imprensa
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
