import React, { useMemo, useState } from 'react';
import {
  RadarTributarioRegistro,
  emailRadarData
} from '../../data/email-radar.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Mail,
  TrendingUp,
  MousePointerClick,
  Eye,
  Percent,
  Search,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  FileSpreadsheet,
  Activity,
  BarChart3,
  LineChart
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

const MESES_RADAR = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto'];

interface EmailRadarViewProps {
  selectedMonth: string;
}

export default function EmailRadarView({ selectedMonth }: EmailRadarViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada com padronização de mês
  const normalizedData = useMemo(() => {
    return emailRadarData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Agosto)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.views_site - a.views_site;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtro de busca textual
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        d.mes.toLowerCase().includes(term) ||
        d.tema.toLowerCase().includes(term)
      );
    });
  }, [monthFilteredData, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalDisparos = monthFilteredData.length;

  const mediaAbertura = useMemo(() => {
    if (totalDisparos === 0) return 0;
    const soma = monthFilteredData.reduce((acc, d) => acc + d.taxa_abertura, 0);
    return soma / totalDisparos;
  }, [monthFilteredData, totalDisparos]);

  const mediaCliques = useMemo(() => {
    if (totalDisparos === 0) return 0;
    const soma = monthFilteredData.reduce((acc, d) => acc + d.taxa_cliques, 0);
    return soma / totalDisparos;
  }, [monthFilteredData, totalDisparos]);

  const totalViewsSite = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.views_site, 0),
    [monthFilteredData]
  );

  // Evolução Mensal agregada (Janeiro a Agosto)
  const evolucaoMensal = useMemo(() => {
    return MESES_RADAR.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const count = itensDoMes.length;

      if (count === 0) {
        return {
          mes: m,
          count: 0,
          mediaAbertura: 0,
          mediaCliques: 0,
          totalViews: 0
        };
      }

      const somaAbertura = itensDoMes.reduce((acc, d) => acc + d.taxa_abertura, 0);
      const somaCliques = itensDoMes.reduce((acc, d) => acc + d.taxa_cliques, 0);
      const somaViews = itensDoMes.reduce((acc, d) => acc + d.views_site, 0);

      return {
        mes: m,
        count,
        mediaAbertura: +(somaAbertura / count).toFixed(2),
        mediaCliques: +(somaCliques / count).toFixed(2),
        totalViews: somaViews
      };
    });
  }, [normalizedData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Tema / Assunto do Radar Tributário': d.tema,
      'Taxa de Abertura (%)': d.taxa_abertura,
      'Taxa de Cliques (%)': d.taxa_cliques,
      'Visualizações no Site (Views)': d.views_site
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Radar Tributário');
    XLSX.writeFile(wb, `Radar_Tributario_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  // Coordenadas para o Gráfico de 2 Linhas SVG
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 55;
  const paddingTop = 30;
  const paddingBottom = 40;

  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingTop - paddingBottom;

  // Escala Abertura (25% a 50%)
  const minAbertura = 25;
  const maxAbertura = 50;

  // Escala Cliques (0.5% a 2.5%)
  const minCliques = 0.5;
  const maxCliques = 2.5;

  const pointsAbertura = evolucaoMensal.map((item, index) => {
    const x = paddingX + (index / (evolucaoMensal.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - ((item.mediaAbertura - minAbertura) / (maxAbertura - minAbertura)) * graphHeight;
    return { x, y, valor: item.mediaAbertura, mes: item.mes };
  });

  const pointsCliques = evolucaoMensal.map((item, index) => {
    const x = paddingX + (index / (evolucaoMensal.length - 1)) * graphWidth;
    const y = paddingTop + graphHeight - ((item.mediaCliques - minCliques) / (maxCliques - minCliques)) * graphHeight;
    return { x, y, valor: item.mediaCliques, mes: item.mes };
  });

  const pathAbertura = pointsAbertura.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const pathCliques = pointsCliques.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taxa de Abertura Média */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Taxa de Abertura Média
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {mediaAbertura.toFixed(1).replace('.', ',')}%
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Excelente engajamento no setor
            </div>
          </div>
        </div>

        {/* Taxa de Cliques Média */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <MousePointerClick size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Taxa de Cliques Média (CTR)
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {mediaCliques.toFixed(2).replace('.', ',')}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Conversão direta para o portal
            </div>
          </div>
        </div>

        {/* Soma de Views no Site */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Eye size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Views nos Artigos do Site
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {totalViewsSite.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Acessos gerados pelos disparos
            </div>
          </div>
        </div>

        {/* Total de Edições */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Edições Disparadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalDisparos} {totalDisparos === 1 ? 'edição' : 'edições'}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Em {selectedMonth}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (DUAS LINHAS: ABERTURA E CLIQUES)       */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Taxa de Abertura vs. Taxa de Cliques</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparativo das métricas de performance do Radar Tributário mês a mês
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span className="font-semibold text-gray-700">Taxa de Abertura (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-gray-700">Taxa de Cliques (%)</span>
            </div>
          </div>
        </div>

        {/* Gráfico Visual de 2 Linhas SVG */}
        <div className="overflow-x-auto">
          <div className="min-w-[650px] p-2">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
              {/* Linhas de Grade Horizontais */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = paddingTop + graphHeight * pct;
                const valorAbertura = (maxAbertura - pct * (maxAbertura - minAbertura)).toFixed(0);
                const valorCliques = (maxCliques - pct * (maxCliques - minCliques)).toFixed(1);

                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    {/* Eixo Esquerdo (Abertura) */}
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#64748b"
                      fontWeight="500"
                    >
                      {valorAbertura}%
                    </text>
                    {/* Eixo Direito (Cliques) */}
                    <text
                      x={svgWidth - paddingX + 10}
                      y={y + 4}
                      textAnchor="start"
                      fontSize="10"
                      fill="#10b981"
                      fontWeight="500"
                    >
                      {valorCliques}%
                    </text>
                  </g>
                );
              })}

              {/* Linha 1: Taxa de Abertura */}
              <path
                d={pathAbertura}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Linha 2: Taxa de Cliques */}
              <path
                d={pathCliques}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pontos de Ancoragem da Taxa de Abertura */}
              {pointsAbertura.map((p, idx) => (
                <g key={`abertura-${idx}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5.5"
                    fill="#1e3a8a"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all hover:scale-125"
                  />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#1e3a8a"
                  >
                    {p.valor.toFixed(1)}%
                  </text>
                  {/* Rótulo do Mês no Eixo X */}
                  <text
                    x={p.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#475569"
                  >
                    {p.mes.slice(0, 3)}
                  </text>
                </g>
              ))}

              {/* Pontos de Ancoragem da Taxa de Cliques */}
              {pointsCliques.map((p, idx) => (
                <g key={`cliques-${idx}`}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="transition-all hover:scale-125"
                  />
                  <text
                    x={p.x}
                    y={p.y + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#047857"
                  >
                    {p.valor.toFixed(2)}%
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Cards Resumo Mensais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4 pt-4 border-t border-gray-100">
          {evolucaoMensal.map((item) => {
            const isSelected = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50'
                    : 'border-gray-200/70 bg-gray-50/50'
                }`}
              >
                <div className="text-xs font-bold text-gray-900">{item.mes}</div>
                <div className="text-[11px] font-semibold text-brand-navy mt-1">
                  {item.mediaAbertura.toFixed(1)}% abert.
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">
                  {item.mediaCliques.toFixed(2)}% cli.
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {item.totalViews} views
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA REGISTRO                                 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Mail size={18} className="text-brand-blue" />
                <span>Edições do Radar Tributário</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {normalizedData.length} disparos)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Desempenho detalhado de cada informativo tributário disparado
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Tema ou Mês */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tema ou mês..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-60"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa do Radar Tributário para Excel"
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
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4 min-w-[340px]">Tema da Edição</th>
                <th className="py-3 px-4 text-center w-36 font-bold text-brand-navy">Taxa de Abertura</th>
                <th className="py-3 px-4 text-center w-36 font-semibold text-emerald-800">Taxa de Cliques</th>
                <th className="py-3 px-4 text-center w-36 font-semibold text-purple-900">Views no Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhum disparo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  return (
                    <tr
                      key={`${item.tema}-${item.mes}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Numeração */}
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Tema */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 leading-snug">
                        {item.tema}
                      </td>

                      {/* Taxa de Abertura */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-brand-navy text-sm">
                        <span className="bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {item.taxa_abertura.toFixed(2).replace('.', ',')}%
                        </span>
                      </td>

                      {/* Taxa de Cliques */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-emerald-800 text-sm">
                        <span className="bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                          {item.taxa_cliques.toFixed(2).replace('.', ',')}%
                        </span>
                      </td>

                      {/* Views no Site */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-purple-900 text-sm">
                        <span className="bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                          {item.views_site.toLocaleString('pt-BR')}
                        </span>
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
              Exibindo <strong>{displayRecords.length} edições</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Views totais: <strong className="text-purple-900">{totalViewsSite.toLocaleString('pt-BR')}</strong>
              </span>
              <span>
                Abertura média: <strong className="text-brand-navy">{mediaAbertura.toFixed(1).replace('.', ',')}%</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
