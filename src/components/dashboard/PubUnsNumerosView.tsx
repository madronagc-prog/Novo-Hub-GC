import React, { useMemo, useState } from 'react';
import {
  UNsEmNumerosRegistro,
  pubUNsEmNumerosData
} from '../../data/pub-uns-numeros.data';
import { normalizarUN } from '../../utils/padronizacao';
import {
  FileText,
  TrendingUp,
  BarChart3,
  Award,
  Search,
  Download,
  Building,
  Layers,
  Sparkles,
  BookOpen,
  Newspaper,
  Globe,
  Radio,
  FileCheck,
  Zap,
  Mail
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CATEGORIAS_DEF = [
  { key: 'art_madrona_lab', label: 'Art. Madrona Lab', color: 'bg-blue-600', text: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'imprensa', label: 'Imprensa', color: 'bg-emerald-600', text: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'imprensa_ingles', label: 'Imprensa em Inglês', color: 'bg-teal-600', text: 'text-teal-700', bgLight: 'bg-teal-50', border: 'border-teal-200' },
  { key: 'tema_frio', label: 'Tema Frio', color: 'bg-purple-600', text: 'text-purple-700', bgLight: 'bg-purple-50', border: 'border-purple-200' },
  { key: 'energy_news', label: 'Energy News', color: 'bg-amber-500', text: 'text-amber-800', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'radar_tributario', label: 'Radar Tributário', color: 'bg-rose-600', text: 'text-rose-700', bgLight: 'bg-rose-50', border: 'border-rose-200' },
  { key: 'art_ingles', label: 'Art. em Inglês', color: 'bg-indigo-600', text: 'text-indigo-700', bgLight: 'bg-indigo-50', border: 'border-indigo-200' },
  { key: 'webinars', label: 'Webinars', color: 'bg-sky-500', text: 'text-sky-700', bgLight: 'bg-sky-50', border: 'border-sky-200' },
  { key: 'jornal_int', label: 'Jornal Int.', color: 'bg-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200' }
] as const;

function normalizarNomeArea(area: string): string {
  if (area.startsWith('UN ')) {
    return normalizarUN(area);
  }
  return area;
}

interface PubUnsNumerosViewProps {
  selectedUn?: string;
}

export default function PubUnsNumerosView({ selectedUn = 'Todas as UNs' }: PubUnsNumerosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'total' | 'area'>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Registro Total Geral
  const registroTotalGeral = useMemo(() => {
    return pubUNsEmNumerosData.find((d) => d.area === 'Total Geral') || {
      area: 'Total Geral',
      art_madrona_lab: 40,
      energy_news: 8,
      imprensa: 34,
      imprensa_ingles: 15,
      radar_tributario: 8,
      tema_frio: 10,
      art_ingles: 3,
      webinars: 1,
      jornal_int: 1,
      total: 120
    };
  }, []);

  // Registros das áreas (excluindo a linha de Total Geral), respeitando o filtro de UN do cabeçalho
  const areasData = useMemo(() => {
    let data = pubUNsEmNumerosData
      .filter((d) => d.area !== 'Total Geral')
      .map((d) => ({
        ...d,
        areaNormalizada: normalizarNomeArea(d.area)
      }));
    if (selectedUn !== 'Todas as UNs') {
      data = data.filter((d) => d.areaNormalizada === selectedUn);
    }
    return data;
  }, [selectedUn]);

  // Filtro de busca textual
  const displayRecords = useMemo(() => {
    let result = areasData.filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        d.area.toLowerCase().includes(term) ||
        d.areaNormalizada.toLowerCase().includes(term)
      );
    });

    result.sort((a, b) => {
      if (sortField === 'total') {
        return sortDirection === 'desc' ? b.total - a.total : a.total - b.total;
      }
      return sortDirection === 'desc'
        ? b.areaNormalizada.localeCompare(a.areaNormalizada)
        : a.areaNormalizada.localeCompare(b.areaNormalizada);
    });

    return result;
  }, [areasData, searchTerm, sortField, sortDirection]);

  // Ranking ordenado decrescente por total
  const rankingAreas = useMemo(() => {
    return [...areasData].sort((a, b) => b.total - a.total);
  }, [areasData]);

  const maxTotalArea = rankingAreas[0]?.total || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = areasData.map((d, index) => ({
      '#': index + 1,
      'Área / UN': d.areaNormalizada,
      'Art. Madrona Lab': d.art_madrona_lab,
      'Energy News': d.energy_news,
      'Imprensa': d.imprensa,
      'Imprensa em Inglês': d.imprensa_ingles,
      'Radar Tributário': d.radar_tributario,
      'Tema Frio': d.tema_frio,
      'Art. em Inglês': d.art_ingles,
      'Webinars': d.webinars,
      'Jornal Int.': d.jornal_int,
      'Total de Publicações': d.total
    }));

    // Adiciona linha de Total Geral
    exportData.push({
      '#': areasData.length + 1,
      'Área / UN': 'Total Geral',
      'Art. Madrona Lab': registroTotalGeral.art_madrona_lab,
      'Energy News': registroTotalGeral.energy_news,
      'Imprensa': registroTotalGeral.imprensa,
      'Imprensa em Inglês': registroTotalGeral.imprensa_ingles,
      'Radar Tributário': registroTotalGeral.radar_tributario,
      'Tema Frio': registroTotalGeral.tema_frio,
      'Art. em Inglês': registroTotalGeral.art_ingles,
      'Webinars': registroTotalGeral.webinars,
      'Jornal Int.': registroTotalGeral.jornal_int,
      'Total de Publicações': registroTotalGeral.total
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UNs em Números');
    XLSX.writeFile(wb, 'UNs_em_Numeros_Publicacoes.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. RESUMO: TOTAL GERAL & DIVISÃO POR CATEGORIA                       */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Consolidação Editorial • 2026
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
              <span>UNs em Números • Total de Publicações</span>
            </h3>
            <p className="text-xs text-blue-200/90 mt-0.5">
              Produção técnica intelectual, aparições na imprensa e conteúdo editorial
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/15 text-center">
              <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Total Geral</span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-emerald-400">
                {registroTotalGeral.total}
              </span>
              <span className="text-[10px] text-blue-200 block">conteúdos gerados</span>
            </div>
          </div>
        </div>

        {/* Grid das 9 Categorias de Publicação */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
          {CATEGORIAS_DEF.map((cat) => {
            const val = (registroTotalGeral as any)[cat.key] || 0;
            const pct = ((val / registroTotalGeral.total) * 100).toFixed(0);

            return (
              <div
                key={cat.key}
                className="bg-white/5 rounded-xl p-2.5 border border-white/10 backdrop-blur-xs flex flex-col justify-between text-center"
              >
                <div className="text-[10px] text-blue-200 truncate" title={cat.label}>
                  {cat.label}
                </div>
                <div className="text-lg sm:text-xl font-serif font-bold text-white my-1">
                  {val}
                </div>
                <div className="text-[9px] text-blue-200/70">
                  {pct}% do total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE BARRAS EMPILHADAS (ÁREA × CATEGORIA)                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Distribuição por Área e Categoria</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Barras empilhadas mostrando a composição de cada área (exclui o Total Geral)
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap text-[11px]">
            {CATEGORIAS_DEF.map((cat) => (
              <div key={cat.key} className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-sm ${cat.color}`}></span>
                <span className="text-gray-600">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barras Empilhadas por Área com Rolagem Interna */}
        <div
          className="space-y-3 overflow-y-auto pr-1.5 scrollbar-thin"
          style={{ height: '348px' }}
        >
          {rankingAreas.map((item) => {
            const barWidthPercent = (item.total / maxTotalArea) * 100;

            return (
              <div
                key={item.area}
                className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors h-[60px] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className="font-semibold text-gray-900 truncate">
                    {item.areaNormalizada}
                  </span>
                  <span className="font-serif font-bold text-brand-navy">
                    {item.total} {item.total === 1 ? 'publicação' : 'publicações'}
                  </span>
                </div>

                {/* Barra Empilhada Multicor */}
                <div className="w-full bg-gray-200/80 rounded-full h-3 overflow-hidden flex">
                  {CATEGORIAS_DEF.map((cat) => {
                    const val = (item as any)[cat.key] || 0;
                    if (val === 0) return null;
                    const segmentWidth = (val / item.total) * 100;

                    return (
                      <div
                        key={cat.key}
                        className={`${cat.color} h-full transition-all duration-500`}
                        style={{ width: `${segmentWidth}%` }}
                        title={`${cat.label}: ${val}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING DAS UNs / ÁREAS POR TOTAL DE PUBLICAÇÕES                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Award size={18} className="text-brand-blue" />
              <span>Ranking de Produção de Conteúdo</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Normalização com normalizarUN() aplicada para áreas "UN" (demais categorias mantidas)
            </p>
          </div>

          <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
            {rankingAreas.length} áreas ativas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rankingAreas.map((item, idx) => {
            const barWidth = (item.total / maxTotalArea) * 100;
            const pctDoTotalGeral = ((item.total / registroTotalGeral.total) * 100).toFixed(1);

            return (
              <div
                key={item.area}
                className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-white'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {item.areaNormalizada}
                      </span>
                    </div>

                    <span className="font-serif font-bold text-brand-navy text-sm flex-shrink-0">
                      {item.total}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 mb-2">
                    Representa <strong>{pctDoTotalGeral}%</strong> do total do escritório
                  </div>
                </div>

                <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx < 3 ? 'bg-brand-blue' : 'bg-slate-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA CRUZADA COM TODAS AS CATEGORIAS                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-brand-blue" />
                <span>Publicações por Área e Categoria</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} áreas)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Detalhamento exaustivo de cada formato editorial
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Área */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar área ou UN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar matriz completa de publicações para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados com Rolagem Interna */}
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin" style={{ height: '418px' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200/80">
              <tr className="h-[38px] text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3.5 min-w-[200px]">Área / UN</th>
                <th className="py-2.5 px-2.5 text-center">Madrona Lab</th>
                <th className="py-2.5 px-2.5 text-center">Energy News</th>
                <th className="py-2.5 px-2.5 text-center">Imprensa</th>
                <th className="py-2.5 px-2.5 text-center">Imp. Inglês</th>
                <th className="py-2.5 px-2.5 text-center">Radar Trib.</th>
                <th className="py-2.5 px-2.5 text-center">Tema Frio</th>
                <th className="py-2.5 px-2.5 text-center">Art. Inglês</th>
                <th className="py-2.5 px-2.5 text-center">Webinars</th>
                <th className="py-2.5 px-2.5 text-center">Jornal Int.</th>
                <th className="py-2.5 px-3 text-center font-bold text-gray-900 bg-gray-100/70">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.map((item, idx) => {
                return (
                  <tr
                    key={item.area}
                    className="hover:bg-blue-50/20 transition-colors h-[38px]"
                  >
                    <td className="py-2.5 px-3 text-center text-gray-400 text-xs">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3.5 font-semibold text-gray-900 whitespace-nowrap">
                      {item.areaNormalizada}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.art_madrona_lab > 0 ? 'font-bold text-blue-900' : 'text-gray-300'}`}>
                      {item.art_madrona_lab}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.energy_news > 0 ? 'font-bold text-amber-800' : 'text-gray-300'}`}>
                      {item.energy_news}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.imprensa > 0 ? 'font-bold text-emerald-800' : 'text-gray-300'}`}>
                      {item.imprensa}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.imprensa_ingles > 0 ? 'font-bold text-teal-800' : 'text-gray-300'}`}>
                      {item.imprensa_ingles}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.radar_tributario > 0 ? 'font-bold text-rose-800' : 'text-gray-300'}`}>
                      {item.radar_tributario}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.tema_frio > 0 ? 'font-bold text-purple-800' : 'text-gray-300'}`}>
                      {item.tema_frio}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.art_ingles > 0 ? 'font-bold text-indigo-800' : 'text-gray-300'}`}>
                      {item.art_ingles}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.webinars > 0 ? 'font-bold text-sky-800' : 'text-gray-300'}`}>
                      {item.webinars}
                    </td>

                    <td className={`py-2.5 px-2.5 text-center font-mono ${item.jornal_int > 0 ? 'font-bold text-orange-800' : 'text-gray-300'}`}>
                      {item.jornal_int}
                    </td>

                    <td className="py-2.5 px-3 text-center font-serif font-bold text-gray-900 bg-gray-50/80 text-xs sm:text-sm">
                      {item.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Linha de Total Geral no Rodapé da Tabela */}
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-blue-900 text-white font-bold h-[38px]">
                <td className="py-2.5 px-3 text-center text-blue-200">Σ</td>
                <td className="py-2.5 px-3.5 uppercase tracking-wider text-xs">Total Geral</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.art_madrona_lab}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.energy_news}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.imprensa}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.imprensa_ingles}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.radar_tributario}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.tema_frio}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.art_ingles}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.webinars}</td>
                <td className="py-2.5 px-2.5 text-center font-mono">{registroTotalGeral.jornal_int}</td>
                <td className="py-2.5 px-3 text-center font-serif text-emerald-300 text-sm bg-blue-950">
                  {registroTotalGeral.total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
