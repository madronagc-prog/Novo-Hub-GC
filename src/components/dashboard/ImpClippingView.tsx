import React, { useMemo, useState } from 'react';
import {
  ClippingComRegistro,
  impClippingComData
} from '../../data/imp-clipping.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  Newspaper,
  TrendingUp,
  Award,
  Building,
  Calendar,
  Download,
  Search,
  Filter,
  Layers,
  Sparkles,
  BarChart3,
  Flame,
  CheckCircle2,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MESES_COLUNAS: { key: keyof Omit<ClippingComRegistro, 'area'>; label: string; short: string }[] = [
  { key: 'janeiro', label: 'Janeiro', short: 'Jan' },
  { key: 'fevereiro', label: 'Fevereiro', short: 'Fev' },
  { key: 'marco', label: 'Março', short: 'Mar' },
  { key: 'abril', label: 'Abril', short: 'Abr' },
  { key: 'maio', label: 'Maio', short: 'Mai' },
  { key: 'junho', label: 'Junho', short: 'Jun' },
  { key: 'julho', label: 'Julho', short: 'Jul' },
  { key: 'agosto', label: 'Agosto', short: 'Ago' },
  { key: 'setembro', label: 'Setembro', short: 'Set' },
  { key: 'outubro', label: 'Outubro', short: 'Out' },
  { key: 'novembro', label: 'Novembro', short: 'Nov' },
  { key: 'dezembro', label: 'Dezembro', short: 'Dez' }
];

interface ImpClippingViewProps {
  selectedMonth: string;
}

export default function ImpClippingView({ selectedMonth }: ImpClippingViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [focusSelectedMonthOnly, setFocusSelectedMonthOnly] = useState(false);

  // Normalização das áreas
  const normalizedData = useMemo(() => {
    return impClippingComData.map((d) => ({
      ...d,
      area: normalizarUN(d.area)
    }));
  }, []);

  // Mapeamento do mês selecionado para a chave correspondente
  const activeMonthKey = useMemo(() => {
    if (selectedMonth === 'Todos os meses') return null;
    const norm = normalizarMes(selectedMonth).toLowerCase();
    const found = MESES_COLUNAS.find((m) => m.label.toLowerCase() === norm);
    return found ? found.key : null;
  }, [selectedMonth]);

  // Cálculo de totais por linha (área)
  const rowsWithTotals = useMemo(() => {
    return normalizedData.map((row) => {
      const totalAno =
        row.janeiro +
        row.fevereiro +
        row.marco +
        row.abril +
        row.maio +
        row.junho +
        row.julho +
        row.agosto +
        row.setembro +
        row.outubro +
        row.novembro +
        row.dezembro;

      const valorMesAtual = activeMonthKey ? row[activeMonthKey] : totalAno;

      return {
        ...row,
        totalAno,
        valorMesAtual,
        isZerado: totalAno === 0
      };
    });
  }, [normalizedData, activeMonthKey]);

  // Ordenação: áreas com ocorrências primeiro (ordem decrescente de menções), depois as zeradas
  const sortedRows = useMemo(() => {
    return [...rowsWithTotals].sort((a, b) => {
      // Se um mês específico estiver selecionado, prioriza a contagem daquele mês, depois o ano
      if (activeMonthKey) {
        if (b.valorMesAtual !== a.valorMesAtual) {
          return b.valorMesAtual - a.valorMesAtual;
        }
      }
      if (a.isZerado !== b.isZerado) {
        return a.isZerado ? 1 : -1;
      }
      return b.totalAno - a.totalAno;
    });
  }, [rowsWithTotals, activeMonthKey]);

  // Filtro de busca textual
  const displayRows = useMemo(() => {
    if (!searchTerm.trim()) return sortedRows;
    const term = searchTerm.toLowerCase();
    return sortedRows.filter((r) => r.area.toLowerCase().includes(term));
  }, [sortedRows, searchTerm]);

  // Totais do Resumo Geral
  const totalClippingsAno = useMemo(
    () => rowsWithTotals.reduce((acc, r) => acc + r.totalAno, 0),
    [rowsWithTotals]
  );

  const totalClippingsMes = useMemo(() => {
    if (!activeMonthKey) return totalClippingsAno;
    return rowsWithTotals.reduce((acc, r) => acc + r[activeMonthKey], 0);
  }, [rowsWithTotals, activeMonthKey]);

  // Top Áreas com Mais Ocorrências
  const topAreas = useMemo(() => {
    return [...rowsWithTotals]
      .filter((r) => r.totalAno > 0)
      .sort((a, b) => b.totalAno - a.totalAno)
      .slice(0, 4);
  }, [rowsWithTotals]);

  // Total por Mês (coluna do rodapé)
  const totaisPorMes = useMemo(() => {
    const res: Record<string, number> = {};
    MESES_COLUNAS.forEach((m) => {
      res[m.key] = rowsWithTotals.reduce((acc, r) => acc + r[m.key], 0);
    });
    return res;
  }, [rowsWithTotals]);

  // Célula Heatmap Stylist
  const getHeatmapColor = (val: number, isColumnHighlighted: boolean) => {
    if (val === 0) {
      return isColumnHighlighted
        ? 'bg-amber-50/60 text-gray-300'
        : 'text-gray-300 hover:text-gray-400';
    }
    if (val === 1) {
      return isColumnHighlighted
        ? 'bg-blue-100 text-blue-900 font-bold ring-2 ring-brand-blue'
        : 'bg-blue-50 text-brand-blue font-semibold';
    }
    if (val === 2) {
      return isColumnHighlighted
        ? 'bg-blue-200 text-blue-950 font-bold ring-2 ring-brand-blue'
        : 'bg-blue-100 text-blue-900 font-bold';
    }
    if (val <= 5) {
      return isColumnHighlighted
        ? 'bg-[#00b2ff] text-white font-bold ring-2 ring-brand-navy shadow-xs'
        : 'bg-blue-400 text-white font-bold';
    }
    return isColumnHighlighted
      ? 'bg-[#0a1e3f] text-white font-bold ring-2 ring-amber-400 shadow-sm'
      : 'bg-[#007cb8] text-white font-bold';
  };

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = sortedRows.map((r, index) => ({
      '#': index + 1,
      'Área / UN': r.area,
      'Jan': r.janeiro,
      'Fev': r.fevereiro,
      'Mar': r.marco,
      'Abr': r.abril,
      'Mai': r.maio,
      'Jun': r.junho,
      'Jul': r.julho,
      'Ago': r.agosto,
      'Set': r.setembro,
      'Out': r.outubro,
      'Nov': r.novembro,
      'Dez': r.dezembro,
      'Total Ano': r.totalAno
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clipping COM');
    XLSX.writeFile(wb, `Clipping_COM_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS E DESTAQUES DE CLIPPING)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Clippings */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Newspaper size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {activeMonthKey ? `Clippings em ${selectedMonth}` : 'Total de Clippings no Ano'}
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalClippingsMes}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {activeMonthKey ? `Acumulado do ano: ${totalClippingsAno}` : 'Consolidado Janeiro a Dezembro'}
            </div>
          </div>
        </div>

        {/* 1º Lugar em Menções */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Área Líder de Imprensa
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5 truncate max-w-[190px]" title={topAreas[0]?.area}>
              {topAreas[0]?.area || '—'}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {topAreas[0]?.totalAno} ocorrências ({((topAreas[0]?.totalAno / totalClippingsAno) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* 2º Lugar em Menções */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              2º Destaque do Período
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5 truncate max-w-[190px]" title={topAreas[1]?.area}>
              {topAreas[1]?.area || '—'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {topAreas[1]?.totalAno} ocorrências ({((topAreas[1]?.totalAno / totalClippingsAno) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Áreas Ativas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Building size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Áreas com Veiculação
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {rowsWithTotals.filter((r) => r.totalAno > 0).length} de {rowsWithTotals.length}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {rowsWithTotals.filter((r) => r.isZerado).length} áreas sem menções
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. HEATMAP E TABELA DE CLIPPING COM (24 ÁREAS X 12 MESES)            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header do Heatmap */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-brand-blue" />
                <span>Clipping por Área e Mês</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  (24 áreas x 12 meses)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeMonthKey ? (
                  <span>
                    Mês destacado pelo filtro geral:{' '}
                    <strong className="text-brand-navy bg-amber-100/80 px-2 py-0.5 rounded text-gray-900">
                      {selectedMonth}
                    </strong>
                  </span>
                ) : (
                  'Visão consolidada anual de todas as menções espontâneas e pautas'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Botão de Foco na Coluna */}
              {activeMonthKey && (
                <button
                  onClick={() => setFocusSelectedMonthOnly(!focusSelectedMonthOnly)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                    focusSelectedMonthOnly
                      ? 'bg-brand-navy text-white border-brand-navy shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {focusSelectedMonthOnly ? `Ver Todos os Meses` : `Focar em ${selectedMonth}`}
                </button>
              )}

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

              {/* Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar matriz completa para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela Heatmap com Scroll Horizontal */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4 text-left min-w-[220px]">Área / UN</th>
                {MESES_COLUNAS.map((m) => {
                  const isHighlighted = activeMonthKey === m.key;
                  if (focusSelectedMonthOnly && !isHighlighted) return null;

                  return (
                    <th
                      key={m.key}
                      className={`py-3 px-2 w-14 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-100/90 text-brand-navy font-bold border-x-2 border-brand-blue'
                          : ''
                      }`}
                    >
                      <span className="block">{m.short}</span>
                    </th>
                  );
                })}
                <th className="py-3 px-3 w-20 bg-slate-100 text-gray-800 font-bold border-l border-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-gray-400">
                    Nenhuma área encontrada para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => {
                  return (
                    <tr
                      key={`${row.area}-${idx}`}
                      className={`hover:bg-blue-50/20 transition-colors ${
                        row.isZerado ? 'opacity-60 bg-gray-50/30' : ''
                      }`}
                    >
                      {/* Nome da Área */}
                      <td className="py-3 px-4 text-left font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              row.totalAno > 0 ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                          ></span>
                          <span className={row.totalAno > 0 ? 'font-semibold' : 'text-gray-500'}>
                            {row.area}
                          </span>
                          {row.isZerado && (
                            <span className="text-[10px] text-gray-400 italic">
                              (sem menções)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Células de Cada Mês */}
                      {MESES_COLUNAS.map((m) => {
                        const val = row[m.key];
                        const isHighlighted = activeMonthKey === m.key;
                        if (focusSelectedMonthOnly && !isHighlighted) return null;

                        const colorClass = getHeatmapColor(val, isHighlighted);

                        return (
                          <td
                            key={m.key}
                            className={`py-2 px-1 transition-colors ${
                              isHighlighted ? 'border-x-2 border-brand-blue bg-amber-50/40' : ''
                            }`}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs transition-all ${colorClass}`}
                            >
                              {val > 0 ? val : '·'}
                            </span>
                          </td>
                        );
                      })}

                      {/* Coluna Total por Área */}
                      <td className="py-2 px-3 border-l border-gray-200 bg-slate-50/80 font-serif font-bold text-gray-900">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md ${
                            row.totalAno > 0
                              ? 'bg-blue-50 text-brand-blue font-bold'
                              : 'text-gray-400 font-normal'
                          }`}
                        >
                          {row.totalAno}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Rodapé: Total Geral por Mês */}
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
                <td className="py-3 px-4 text-left font-serif">
                  Total Geral por Mês
                </td>
                {MESES_COLUNAS.map((m) => {
                  const isHighlighted = activeMonthKey === m.key;
                  if (focusSelectedMonthOnly && !isHighlighted) return null;
                  const mesTotal = totaisPorMes[m.key] || 0;

                  return (
                    <td
                      key={m.key}
                      className={`py-3 px-2 ${
                        isHighlighted
                          ? 'bg-amber-200/90 text-brand-navy border-x-2 border-brand-blue font-extrabold'
                          : ''
                      }`}
                    >
                      {mesTotal > 0 ? mesTotal : '0'}
                    </td>
                  );
                })}
                <td className="py-3 px-3 border-l border-gray-300 bg-slate-200 text-brand-navy font-serif font-bold text-sm">
                  {totalClippingsAno}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Rodapé Informativo */}
        <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-brand-blue" />
            <span>
              Legenda do Heatmap: <strong>·</strong> (0 menções) |{' '}
              <span className="text-brand-blue font-bold">1 a 2</span> (Baixo/Médio) |{' '}
              <span className="text-[#007cb8] font-bold">3 a 5</span> (Alto) |{' '}
              <span className="text-gray-900 font-bold">6+</span> (Muito Alto)
            </span>
          </div>
          <div>
            Total de áreas monitoradas: <strong>{normalizedData.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
