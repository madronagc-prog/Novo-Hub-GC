import React, { useMemo, useState } from 'react';
import {
  ProViewRegistro,
  bibProViewData
} from '../../data/bib-proview.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  BookOpen,
  Library,
  Building,
  TrendingUp,
  BarChart3,
  Search,
  Download,
  Calendar,
  Layers,
  Award,
  Sparkles,
  PieChart
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

const MESES_PROVIEW = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto'];

interface BibProViewViewProps {
  selectedMonth: string;
}

export default function BibProViewView({ selectedMonth }: BibProViewViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUn, setSelectedUn] = useState<string>('todas');

  // Base normalizada com padronização de UN e Mês
  const normalizedData = useMemo(() => {
    return bibProViewData.map((d) => ({
      ...d,
      un: normalizarUN(d.un),
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Agosto)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.acessos - a.acessos;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Opções de UNs para filtro
  const unOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.un && d.un.trim()) set.add(d.un.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtros combinados da tabela (busca + UN)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedUn !== 'todas' && d.un !== selectedUn) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.un.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedUn, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalAcessos = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.acessos, 0),
    [monthFilteredData]
  );

  // Evolução Mensal (Janeiro a Agosto) - Base Consolidada Global
  const evolucaoMensal = useMemo(() => {
    return MESES_PROVIEW.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const totalAcessosMes = itensDoMes.reduce((acc, d) => acc + d.acessos, 0);
      const unsCount = itensDoMes.length;

      return {
        mes: m,
        totalAcessos: totalAcessosMes,
        unsCount
      };
    });
  }, [normalizedData]);

  const maxEvolucaoAcessos = Math.max(...evolucaoMensal.map((e) => e.totalAcessos), 1);

  // Agrupamento por UN (no período filtrado), ordenado decrescente
  const statsPorUn = useMemo(() => {
    const map: Record<string, { acessos: number; meses: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      const unName = d.un || 'Não informada';
      if (!map[unName]) {
        map[unName] = { acessos: 0, meses: new Set() };
      }
      map[unName].acessos += d.acessos;
      map[unName].meses.add(d.mes);
    });

    return Object.entries(map)
      .map(([un, data]) => ({
        un,
        acessos: data.acessos,
        mesesAtivos: data.meses.size,
        percentual: totalAcessos > 0 ? (data.acessos / totalAcessos) * 100 : 0
      }))
      .sort((a, b) => b.acessos - a.acessos);
  }, [monthFilteredData, totalAcessos]);

  const unLider = statsPorUn[0] || null;
  const maxUnAcessos = statsPorUn[0]?.acessos || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'UN (Unidade de Negócio)': d.un,
      'Mês': d.mes,
      'Acessos': d.acessos
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ProView');
    XLSX.writeFile(wb, `Biblioteca_ProView_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Acessos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Acessos ProView
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalAcessos.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Consultas ao acervo Thomson Reuters
            </div>
          </div>
        </div>

        {/* UN com Mais Acessos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              UN com Mais Acessos
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5 truncate max-w-[190px]" title={unLider?.un}>
              {unLider?.un || '—'}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {unLider?.acessos ? `${unLider.acessos.toLocaleString('pt-BR')} acessos (${unLider.percentual.toFixed(0)}%)` : '—'}
            </div>
          </div>
        </div>

        {/* UNs Ativas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Building size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              UNs Engajadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {statsPorUn.length} UNs
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Com leitura registrada no período
            </div>
          </div>
        </div>

        {/* Média de Acessos / Mês */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Média Mensal
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {Math.round(totalAcessos / (selectedMonth === 'Todos os meses' ? 8 : 1)).toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              consultas por mês apurado
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (JANEIRO A AGOSTO)                     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução Mensal de Acessos ProView (Janeiro a Agosto de 2026)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Total consolidado de acessos somado entre todas as práticas jurídicas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
              Total acumulado: {totalAcessos.toLocaleString('pt-BR')} consultas
            </span>
          </div>
        </div>

        {/* Grid de Barras Mensais (8 Meses) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.max(15, Math.round((item.totalAcessos / maxEvolucaoAcessos) * 100));
            const isSelected = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-3 flex flex-col justify-between text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.mes}
                  </span>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-3 flex flex-col items-center justify-end h-28">
                  <span className="text-xs font-serif font-bold text-gray-900 mb-1.5">
                    {item.totalAcessos.toLocaleString('pt-BR')}
                  </span>
                  <div className="w-10 bg-gray-200 rounded-t-lg h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        isSelected
                          ? 'bg-brand-navy'
                          : 'bg-gradient-to-t from-brand-navy to-brand-blue'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Subtítulo do Card */}
                <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500">
                  {item.unsCount} UNs ativas
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. GRÁFICO DE BARRA HORIZONTAL POR UN (ORDEM DECRESCENTE)             */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Building size={18} className="text-brand-blue" />
              <span>Acessos por UN (Padronizada) • Ordem Decrescente</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Consolidação de leituras com normalizarUN() em {selectedMonth}
            </p>
          </div>

          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl font-semibold self-start sm:self-auto">
            {statsPorUn.length} UNs mapeadas
          </span>
        </div>

        <div className="space-y-3.5">
          {statsPorUn.map((item, index) => {
            const barWidth = (item.acessos / maxUnAcessos) * 100;
            const isTop3 = index < 3;

            return (
              <div
                key={item.un}
                className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                        index === 0
                          ? 'bg-amber-400 text-white'
                          : index === 1
                          ? 'bg-slate-300 text-slate-800'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {item.un}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-serif font-bold text-gray-900 text-sm">
                      {item.acessos.toLocaleString('pt-BR')} acessos
                    </span>
                    <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                      {item.percentual.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200/80 rounded-full h-2.5 overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop3
                        ? 'bg-gradient-to-r from-brand-blue to-purple-600'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>

                <div className="text-[11px] text-gray-500 text-right">
                  Meses com leitura registrada: <strong>{item.mesesAtivos}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM TODOS OS REGISTROS                            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Library size={18} className="text-brand-blue" />
                <span>Base Completa de Registros ProView</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {normalizedData.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Histórico de acessos por prática e mês
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por UN */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">UN:</span>
                <select
                  value={selectedUn}
                  onChange={(e) => setSelectedUn(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[170px]"
                >
                  <option value="todas">Todas as UNs</option>
                  {unOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca por Texto */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar UN ou mês..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa do ProView para Excel"
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
                <th className="py-3 px-4 min-w-[240px]">UN (Unidade de Negócio)</th>
                <th className="py-3 px-4 w-32">Mês</th>
                <th className="py-3 px-4 text-center w-36 font-bold">Acessos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  return (
                    <tr
                      key={`${item.un}-${item.mes}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Numeração */}
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* UN */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.un}
                      </td>

                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Acessos */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-gray-900">
                        <span className="text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {item.acessos.toLocaleString('pt-BR')}
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
              Exibindo <strong>{displayRecords.length} registros</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Total de acessos filtrado: <strong className="text-brand-navy">{totalAcessos.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
