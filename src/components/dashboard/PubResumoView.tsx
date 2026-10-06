import React, { useMemo } from 'react';
import { pubControleData } from '../../data/pub-controle.data';
import { pubCapitalData } from '../../data/pub-capital.data';
import { pubUNsEmNumerosData } from '../../data/pub-uns-numeros.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  FileText,
  Eye,
  Award,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  Building
} from 'lucide-react';

interface PubResumoViewProps {
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

export default function PubResumoView({ selectedMonth = 'Todos os meses', selectedUn = 'Todas as UNs' }: PubResumoViewProps) {
  const isAllMonths = selectedMonth === 'Todos os meses';
  const isAllUns = selectedUn === 'Todas as UNs';

  // 1. Filtragem por mês e UN para cards e dados analíticos
  // Observação: Capital Aberto não tem campo de UN padronizado (é texto livre em "areas"),
  // então o filtro de UN não se aplica a essa base — só à de Controle de Publicações.
  const filteredControle = useMemo(() => {
    let data = pubControleData;
    if (!isAllMonths) data = data.filter((d) => normalizarMes(d.mes) === selectedMonth);
    if (!isAllUns) data = data.filter((d) => normalizarUN(d.un) === selectedUn);
    return data;
  }, [isAllMonths, selectedMonth, isAllUns, selectedUn]);

  const filteredCapital = useMemo(() => {
    if (isAllMonths) return pubCapitalData;
    return pubCapitalData.filter((d) => normalizarMes(d.mes) === selectedMonth);
  }, [isAllMonths, selectedMonth]);

  // Card 1: Total de publicações
  const totalPublicacoes = filteredControle.length + filteredCapital.length;

  // Card 2: Total de views (ignorando registros com views null)
  const totalViews = useMemo(() => {
    return filteredControle.reduce((acc, d) => {
      const v = typeof d.views === 'number' && !isNaN(d.views) ? d.views : 0;
      return acc + v;
    }, 0);
  }, [filteredControle]);

  // Card 3: UN mais ativa (agrupada por normalizarUN)
  const unMaisAtiva = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredControle.forEach((d) => {
      const unName = normalizarUN(d.un || d.area_principal || 'Não informada');
      counts[unName] = (counts[unName] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { nome: 'N/A', total: 0 };
    return {
      nome: entries[0][0],
      total: entries[0][1]
    };
  }, [filteredControle]);

  // Card 4: Publicação mais vista
  const publicacaoMaisVista = useMemo(() => {
    // Busca na base filtrada primeiro; se não houver registros com views na seleção, busca na base geral
    let candidate = filteredControle.find((d) => typeof d.views === 'number' && d.views > 0);
    if (!candidate && !isAllMonths) {
      // Se no mês filtrado não houver views registradas, busca na base geral para não deixar vazio
      candidate = pubControleData.find((d) => typeof d.views === 'number' && d.views > 0);
    }

    let maxItem = candidate || null;
    const baseSearch = maxItem && !filteredControle.some((d) => (d.views || 0) > 0) ? pubControleData : filteredControle;

    baseSearch.forEach((d) => {
      if (typeof d.views === 'number' && (!maxItem || d.views > (maxItem.views || 0))) {
        maxItem = d;
      }
    });

    return maxItem;
  }, [filteredControle, isAllMonths]);

  // 2. Gráfico de Evolução Mensal (Janeiro a Dezembro) - Controle respeita o filtro de UN; Capital não tem UN
  const evolucaoMensal = useMemo(() => {
    return MESES_ANO.map((m) => {
      let controleDoMes = pubControleData.filter((d) => normalizarMes(d.mes) === m);
      if (!isAllUns) controleDoMes = controleDoMes.filter((d) => normalizarUN(d.un) === selectedUn);
      const cControle = controleDoMes.length;
      const cCapital = pubCapitalData.filter((d) => normalizarMes(d.mes) === m).length;
      const total = cControle + cCapital;
      return {
        mes: m,
        controle: cControle,
        capital: cCapital,
        total
      };
    });
  }, [isAllUns, selectedUn]);

  const maxEvolucaoTotal = useMemo(() => {
    const maxVal = Math.max(...evolucaoMensal.map((e) => e.total));
    return maxVal > 0 ? maxVal : 1;
  }, [evolucaoMensal]);

  // 3. Gráfico de Distribuição por Categoria (pubUNsEmNumerosData sem "Total Geral"), respeitando o filtro de UN
  const distribuicaoCategorias = useMemo(() => {
    let filteredRows = pubUNsEmNumerosData.filter((d) => d.area !== 'Total Geral');
    if (!isAllUns) filteredRows = filteredRows.filter((d) => d.area === selectedUn);

    const categoriasConfig: Array<{ id: keyof typeof filteredRows[0]; label: string; color: string }> = [
      { id: 'art_madrona_lab', label: 'Art. Madrona Lab', color: 'from-blue-600 to-blue-500' },
      { id: 'imprensa', label: 'Imprensa', color: 'from-emerald-600 to-emerald-500' },
      { id: 'imprensa_ingles', label: 'Imprensa em Inglês', color: 'from-teal-600 to-teal-500' },
      { id: 'tema_frio', label: 'Tema Frio', color: 'from-indigo-600 to-indigo-500' },
      { id: 'energy_news', label: 'Energy News', color: 'from-amber-600 to-amber-500' },
      { id: 'radar_tributario', label: 'Radar Tributário', color: 'from-purple-600 to-purple-500' },
      { id: 'art_ingles', label: 'Art. em Inglês', color: 'from-sky-600 to-sky-500' },
      { id: 'webinars', label: 'Webinars', color: 'from-rose-600 to-rose-500' },
      { id: 'jornal_int', label: 'Jornal Int.', color: 'from-slate-600 to-slate-500' }
    ];

    const result = categoriasConfig.map((cat) => {
      const soma = filteredRows.reduce((acc, row) => {
        const val = row[cat.id];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);

      return {
        label: cat.label,
        total: soma,
        color: cat.color
      };
    });

    const totalGeral = result.reduce((acc, c) => acc + c.total, 0);

    return result
      .map((c) => ({
        ...c,
        percentual: totalGeral > 0 ? (c.total / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [isAllUns, selectedUn]);

  const maxCategoriaTotal = distribuicaoCategorias[0]?.total || 1;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOPO)                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Publicações */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <FileText size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Total de Publicações
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalPublicacoes}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              Controle ({filteredControle.length}) + Capital Aberto ({filteredCapital.length})
            </div>
          </div>
        </div>

        {/* Card 2: Total de Views */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Eye size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Total de Visualizações
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalViews.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              Views registradas em publicações
            </div>
          </div>
        </div>

        {/* Card 3: UN Mais Ativa */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Building size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              UN Mais Ativa
            </div>
            <div className="text-lg sm:text-xl font-serif font-bold text-purple-900 mt-0.5 truncate" title={unMaisAtiva.nome}>
              {unMaisAtiva.nome}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {unMaisAtiva.total} {unMaisAtiva.total === 1 ? 'publicação' : 'publicações'} no período
            </div>
          </div>
        </div>

        {/* Card 4: Publicação Mais Vista */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Award size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Publicação Mais Vista
            </div>
            <div className="text-lg sm:text-xl font-serif font-bold text-amber-900 mt-0.5 flex items-baseline gap-1.5 truncate">
              <span>{publicacaoMaisVista?.views ? `${publicacaoMaisVista.views} views` : '--'}</span>
            </div>
            <div
              className="text-[11px] text-gray-600 mt-0.5 truncate font-medium"
              title={publicacaoMaisVista?.titulo || 'Sem registros de visualizações'}
            >
              {publicacaoMaisVista?.titulo || 'Sem registros de views'}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICOS ANALÍTICOS (EVOLUÇÃO MENSAL + DISTRIBUIÇÃO POR CATEGORIA)*/}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Mensal (Janeiro a Dezembro) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-blue" />
                  <span>Evolução Mensal de Publicações</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Número de publicações consolidadas mês a mês
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-brand-blue border border-blue-100">
                Total Anual: {evolucaoMensal.reduce((acc, m) => acc + m.total, 0)}
              </span>
            </div>

            {/* Grid com os 12 meses */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 my-4">
              {evolucaoMensal.map((item) => {
                const heightPct = item.total > 0 ? Math.max(16, Math.round((item.total / maxEvolucaoTotal) * 100)) : 8;
                const isSelected = selectedMonth === item.mes;

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
                        {item.total}
                      </span>
                      <div className="w-6 bg-gray-200 rounded-t-md h-20 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-700 ${
                            isSelected
                              ? 'bg-brand-navy'
                              : item.total > 0
                              ? 'bg-gradient-to-t from-brand-blue to-sky-400'
                              : 'bg-gray-300'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-400 border-t border-gray-200/60 pt-1">
                      {item.total === 1 ? '1 pub.' : `${item.total} pubs.`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Período selecionado no filtro:</span>
            <strong className="text-brand-navy font-semibold">
              {selectedMonth} ({totalPublicacoes} publicações)
            </strong>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Categoria (9 Categorias) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-blue" />
                  <span>Distribuição por Categoria Editorial</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Volume de entregas agrupado pelas 9 categorias do escritório
                </p>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                9 Categorias
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {distribuicaoCategorias.map((cat, idx) => {
                const barWidth = (cat.total / maxCategoriaTotal) * 100;

                return (
                  <div
                    key={cat.label}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-600 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">
                          {cat.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-serif font-bold text-brand-navy">
                          {cat.total} {cat.total === 1 ? 'pub.' : 'pubs.'}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {cat.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Total na matriz de UNs:</span>
            <strong className="text-brand-navy font-semibold">
              {distribuicaoCategorias.reduce((acc, c) => acc + c.total, 0)} publicações mapeadas
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
