import React, { useMemo, useState } from 'react';
import {
  ControlePublicacaoRegistro,
  pubControleData
} from '../../data/pub-controle.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  FileText,
  Eye,
  Award,
  Building,
  Calendar,
  ExternalLink,
  Search,
  Download,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  BookOpen,
  TrendingUp,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTH_ORDER: Record<string, number> = {
  'Janeiro': 1,
  'Fevereiro': 2,
  'Março': 3,
  'Abril': 4,
  'Maio': 5,
  'Junho': 6,
  'Julho': 7,
  'Agosto': 8,
  'Setembro': 9,
  'Outubro': 10,
  'Novembro': 11,
  'Dezembro': 12
};

const CLASSIFICACAO_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Artigo Madrona Lab': { bg: 'bg-blue-50', text: 'text-brand-blue', border: 'border-blue-200' },
  'Imprensa': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Imprensa em inglês': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  'Energy News': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Radar tributário': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Tema frio': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'Webinars': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Jornal internacional': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' }
};

const BAR_COLORS = [
  'bg-[#00b2ff]',
  'bg-[#0a1e3f]',
  'bg-[#FC745C]',
  'bg-[#10b981]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#06b6d4]',
  'bg-[#ec4899]',
  'bg-[#6366f1]',
  'bg-[#14b8a6]',
  'bg-[#d946ef]',
  'bg-[#84cc16]'
];

interface PubControleViewProps {
  selectedMonth: string;
}

export default function PubControleView({ selectedMonth }: PubControleViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassificacao, setSelectedClassificacao] = useState<string>('todas');
  const [selectedArea, setSelectedArea] = useState<string>('todas');

  // Base normalizada com padronização de UN e Mês
  const normalizedData = useMemo(() => {
    return pubControleData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un: normalizarUN(d.un)
    }));
  }, []);

  // Ordenação cronológica por mês
  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedData;
    }
    return sortedData.filter((d) => d.mes === selectedMonth);
  }, [sortedData, selectedMonth]);

  // Opções para os filtros dropdown
  const classificacaoOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.classificacao && d.classificacao.trim()) set.add(d.classificacao.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  const areaPrincipalOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      const area = (d.area_principal || 'Não informada').trim();
      set.add(area);
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtros combinados da tabela (busca + classificação + área principal)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedClassificacao !== 'todas' && d.classificacao !== selectedClassificacao) return false;
      const area = (d.area_principal || 'Não informada').trim();
      if (selectedArea !== 'todas' && area !== selectedArea) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.titulo.toLowerCase().includes(term) ||
          d.area_principal.toLowerCase().includes(term) ||
          d.area_secundaria.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.autores.toLowerCase().includes(term) ||
          d.classificacao.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedClassificacao, selectedArea, searchTerm]);

  // Totais do Resumo (considerando o mês filtrado)
  const totalPublicacoes = monthFilteredData.length;

  const somaViews = useMemo(() => {
    return monthFilteredData.reduce((acc, curr) => {
      return curr.views !== null ? acc + curr.views : acc;
    }, 0);
  }, [monthFilteredData]);

  const publicacoesComViews = useMemo(() => {
    return monthFilteredData.filter((d) => d.views !== null).length;
  }, [monthFilteredData]);

  // Agrupamento por ÁREA PRINCIPAL para o gráfico de barras horizontais
  const statsPorAreaPrincipal = useMemo(() => {
    const map: Record<string, { count: number; views: number }> = {};

    monthFilteredData.forEach((d) => {
      const area = (d.area_principal && d.area_principal.trim()) ? d.area_principal.trim() : 'Institucional / Geral';
      if (!map[area]) {
        map[area] = { count: 0, views: 0 };
      }
      map[area].count += 1;
      if (d.views !== null) {
        map[area].views += d.views;
      }
    });

    return Object.entries(map)
      .map(([area, data]) => ({
        area,
        count: data.count,
        views: data.views,
        percentual: totalPublicacoes > 0 ? (data.count / totalPublicacoes) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthFilteredData, totalPublicacoes]);

  // Área líder
  const areaLider = statsPorAreaPrincipal[0] || null;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Título': d.titulo,
      'Classificação': d.classificacao,
      'Área Principal': d.area_principal || 'Não informada',
      'Área Secundária': d.area_secundaria || '—',
      'UN': d.un,
      'Autor(es)': d.autores || '—',
      'Link': d.link || '—',
      'Views': d.views !== null ? d.views : '—'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle Publicações');
    XLSX.writeFile(wb, `Controle_Publicacoes_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS, SOMA DE VIEWS E ÁREA PRINCIPAL LÍDER)    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Publicações */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Publicações
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalPublicacoes}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {selectedMonth === 'Todos os meses' ? 'Consolidado Jan a Ago/2026' : `Mês de ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Soma de Views */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Eye size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Soma de Visualizações
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {somaViews.toLocaleString('pt-BR')} views
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {publicacoesComViews} publicações com métrica apurada
            </div>
          </div>
        </div>

        {/* Área Principal Líder */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Área com Mais Publicações
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5 truncate max-w-[200px]" title={areaLider?.area}>
              {areaLider?.area || '—'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {areaLider?.count || 0} publicações ({areaLider?.percentual.toFixed(1)}% do total)
            </div>
          </div>
        </div>

        {/* Diversidade de Áreas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Building size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Áreas Principais Ativas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {statsPorAreaPrincipal.length} áreas
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Práticas jurídicas produtoras de conteúdo
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE BARRAS HORIZONTAIS POR ÁREA PRINCIPAL                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Publicações por Área</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Volume total de produção e artigos distribuídos por prática jurídica ({statsPorAreaPrincipal.length} áreas mapeadas)
            </p>
          </div>

          <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold self-start sm:self-auto">
            {totalPublicacoes} publicações registradas
          </span>
        </div>

        {statsPorAreaPrincipal.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Nenhuma publicação registrada no mês selecionado ({selectedMonth}).</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {statsPorAreaPrincipal.map((item, index) => {
              const maxCount = statsPorAreaPrincipal[0]?.count || 1;
              const barWidth = (item.count / maxCount) * 100;
              const barColor = BAR_COLORS[index % BAR_COLORS.length];

              return (
                <div
                  key={item.area}
                  className="bg-gray-50/70 hover:bg-gray-100/70 p-3 rounded-xl border border-gray-200/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                      {item.area}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-gray-900 text-sm">
                        {item.count} {item.count === 1 ? 'publicação' : 'publicações'}
                      </span>
                      <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                        {item.percentual.toFixed(1)}%
                      </span>
                      {item.views > 0 && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                          {item.views.toLocaleString('pt-BR')} views
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA PUBLICAÇÃO E FILTROS                     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-brand-blue" />
                <span>Controle de Publicações</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {totalPublicacoes} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Artigos, informes, webinars, energy news e aparições na imprensa
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Classificação */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Tipo:</span>
                <select
                  value={selectedClassificacao}
                  onChange={(e) => setSelectedClassificacao(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[160px]"
                >
                  <option value="todas">Todas classificações</option>
                  {classificacaoOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Área Principal */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Área:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[180px]"
                >
                  <option value="todas">Todas as áreas</option>
                  {areaPrincipalOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca por Texto */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar título, autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-40 sm:w-52"
                />
              </div>

              {/* Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base filtrada para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-24">Mês</th>
                <th className="py-3 px-3.5 min-w-[280px]">Título da Publicação</th>
                <th className="py-3 px-3.5 w-36">Classificação</th>
                <th className="py-3 px-3.5 w-44">Área Principal</th>
                <th className="py-3 px-3.5 w-36">Área Secundária</th>
                <th className="py-3 px-3.5 w-36">UN</th>
                <th className="py-3 px-3.5 min-w-[200px]">Autor(es)</th>
                <th className="py-3 px-3.5 text-center w-24">Link</th>
                <th className="py-3 px-3.5 text-center w-24">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhuma publicação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const badge = CLASSIFICACAO_BADGES[item.classificacao] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-200'
                  };
                  const hasLink = item.link && (item.link.startsWith('http://') || item.link.startsWith('https://'));

                  return (
                    <tr
                      key={`${item.titulo}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Mês */}
                      <td className="py-3 px-3.5 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Título */}
                      <td className="py-3 px-3.5 font-medium text-gray-900 leading-snug">
                        {item.titulo}
                      </td>

                      {/* Classificação */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {item.classificacao}
                        </span>
                      </td>

                      {/* Área Principal */}
                      <td className="py-3 px-3.5 font-semibold text-gray-800 text-xs">
                        {item.area_principal || '—'}
                      </td>

                      {/* Área Secundária */}
                      <td className="py-3 px-3.5 text-gray-500 text-xs">
                        {item.area_secundaria || '—'}
                      </td>

                      {/* UN */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {item.un ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {item.un}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Autores */}
                      <td className="py-3 px-3.5 text-gray-700 text-xs leading-relaxed">
                        {item.autores || '—'}
                      </td>

                      {/* Link */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {hasLink ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline font-semibold"
                            title="Acessar publicação no LinkedIn ou portal"
                          >
                            <span>Link</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap font-mono text-xs">
                        {item.views !== null ? (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {item.views.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-sans">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        {displayRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Exibindo <strong>{displayRecords.length}</strong> de <strong>{totalPublicacoes} publicações</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-3">
              <span>
                Views somadas no filtro: <strong className="text-emerald-700">{somaViews.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
