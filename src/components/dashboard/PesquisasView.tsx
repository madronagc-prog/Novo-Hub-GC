import React, { useMemo, useState } from 'react';
import {
  PesquisaRegistro,
  pesquisasData
} from '../../data/pesquisas.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Search,
  Clock,
  BookOpen,
  Scale,
  Newspaper,
  Layers,
  Calendar,
  Download,
  Building,
  User,
  TrendingUp,
  BarChart3,
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

const MESES_PESQUISAS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro'];

// Helper para converter minutos para formato "Xh Ymin"
function formatarMinutosParaHoras(minutosTotais: number): string {
  if (!minutosTotais || minutosTotais <= 0) return '0min';
  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;

  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}min`;
}

function getTipoBadge(tipo: string) {
  const t = tipo.toLowerCase();
  if (t.includes('doutrina') && t.includes('jurisprudência')) {
    return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' };
  }
  if (t.includes('doutrina')) {
    return { bg: 'bg-blue-50', text: 'text-brand-blue', border: 'border-blue-200' };
  }
  if (t.includes('jurisprudência')) {
    return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' };
  }
  if (t.includes('notícias')) {
    return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
  }
  return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
}

interface PesquisasViewProps {
  selectedMonth: string;
}

export default function PesquisasView({ selectedMonth }: PesquisasViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUn, setSelectedUn] = useState<string>('todas');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');

  // Base normalizada com padronização de mês e UN
  const normalizedData = useMemo(() => {
    return pesquisasData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un_an: normalizarUN(d.un_an)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Setembro)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.tempo_investido_minutos - a.tempo_investido_minutos;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Opções de UNs e Tipos para dropdowns
  const unOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.un_an && d.un_an.trim()) set.add(d.un_an.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  const tipoOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.tipo && d.tipo.trim()) set.add(d.tipo.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtros combinados da tabela (busca + UN + Tipo)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedUn !== 'todas' && d.un_an !== selectedUn) return false;
      if (selectedTipo !== 'todos' && d.tipo !== selectedTipo) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.titulo.toLowerCase().includes(term) ||
          d.solicitante.toLowerCase().includes(term) ||
          d.un_an.toLowerCase().includes(term) ||
          d.tipo.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedUn, selectedTipo, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalPesquisas = monthFilteredData.length;

  const totalMinutos = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.tempo_investido_minutos, 0),
    [monthFilteredData]
  );

  const tempoTotalFormatado = formatarMinutosParaHoras(totalMinutos);

  const mediaMinutosPorPesquisa = totalPesquisas > 0 ? Math.round(totalMinutos / totalPesquisas) : 0;
  const tempoMedioFormatado = formatarMinutosParaHoras(mediaMinutosPorPesquisa);

  // Divisão por tipo
  const statsPorTipo = useMemo(() => {
    const map: Record<string, { count: number; minutos: number }> = {};

    monthFilteredData.forEach((d) => {
      if (!map[d.tipo]) {
        map[d.tipo] = { count: 0, minutos: 0 };
      }
      map[d.tipo].count += 1;
      map[d.tipo].minutos += d.tempo_investido_minutos;
    });

    return Object.entries(map)
      .map(([tipo, stats]) => ({
        tipo,
        count: stats.count,
        minutos: stats.minutos,
        tempoFormatado: formatarMinutosParaHoras(stats.minutos),
        percentual: totalPesquisas > 0 ? (stats.count / totalPesquisas) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthFilteredData, totalPesquisas]);

  // Evolução Mensal (Janeiro a Setembro)
  const evolucaoMensal = useMemo(() => {
    return MESES_PESQUISAS.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const count = itensDoMes.length;
      const minutos = itensDoMes.reduce((acc, d) => acc + d.tempo_investido_minutos, 0);

      return {
        mes: m,
        count,
        minutos,
        tempoFormatado: formatarMinutosParaHoras(minutos),
        horasDecimal: (minutos / 60).toFixed(1)
      };
    });
  }, [normalizedData]);

  const maxEvolucaoMinutos = Math.max(...evolucaoMensal.map((e) => e.minutos), 1);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Título da Pesquisa': d.titulo,
      'UN / AN': d.un_an,
      'Solicitante': d.solicitante,
      'Tipo de Pesquisa': d.tipo,
      'Tempo Investido (HH:MM:SS)': d.tempo_investido,
      'Tempo Formatado': formatarMinutosParaHoras(d.tempo_investido_minutos),
      'Minutos Totais': d.tempo_investido_minutos
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pesquisas');
    XLSX.writeFile(wb, `Pesquisas_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS, TEMPO INVESTIDO E MÉDIAS)                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Pesquisas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Search size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Pesquisas Realizadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalPesquisas} {totalPesquisas === 1 ? 'pesquisa' : 'pesquisas'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Demandas temáticas atendidas
            </div>
          </div>
        </div>

        {/* Tempo Total Investido */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Tempo Total Investido
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {tempoTotalFormatado}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {totalMinutos.toLocaleString('pt-BR')} minutos dedicados
            </div>
          </div>
        </div>

        {/* Média por Pesquisa */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Tempo Médio / Demanda
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {tempoMedioFormatado}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Dedicado a cada parecer/levantamento
            </div>
          </div>
        </div>

        {/* Tipo Mais Demandado */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Tipo Mais Frequente
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5 truncate max-w-[190px]" title={statsPorTipo[0]?.tipo}>
              {statsPorTipo[0]?.tipo || '—'}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {statsPorTipo[0]?.count || 0} demandas ({statsPorTipo[0]?.percentual.toFixed(0) || 0}%)
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL E DIVISÃO POR TIPO                     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Evolução Mensal (2 Colunas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-blue" />
                  <span>Evolução de Pesquisas e Horas Investidas</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Volume de demandas técnicas e tempo total dedicado (Janeiro a Setembro)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
                  Total de {evolucaoMensal.reduce((a, b) => a + b.count, 0)} pesquisas realizadas
                </span>
              </div>
            </div>

            {/* Grid de Barras Mensais (9 Meses) */}
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {evolucaoMensal.map((item) => {
                const heightPct = Math.max(15, Math.round((item.minutos / maxEvolucaoMinutos) * 100));
                const isSelected = selectedMonth === item.mes;

                return (
                  <div
                    key={item.mes}
                    className={`rounded-2xl border p-2.5 flex flex-col justify-between text-center transition-all ${
                      isSelected
                        ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                        : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy">
                        {item.mes.slice(0, 3)}
                      </span>
                    </div>

                    {/* Coluna / Barra do Gráfico */}
                    <div className="my-2 flex flex-col items-center justify-end h-24">
                      <span className="text-[11px] font-serif font-bold text-gray-900 mb-1">
                        {item.tempoFormatado}
                      </span>
                      <div className="w-8 bg-gray-200 rounded-t-lg h-16 flex items-end overflow-hidden">
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

                    {/* Quantidade de pesquisas */}
                    <div className="pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-500 font-semibold">
                      {item.count} {item.count === 1 ? 'pesq.' : 'pesq.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divisão por Tipo (1 Coluna) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <PieChart size={17} className="text-brand-blue" />
                  <span>Distribuição por Tipo</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Natureza das fontes consultadas em {selectedMonth}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {statsPorTipo.map((item) => {
                const badge = getTipoBadge(item.tipo);

                return (
                  <div
                    key={item.tipo}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {item.tipo}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-bold text-gray-900">
                          {item.count} {item.count === 1 ? 'demanda' : 'demandas'}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden mb-1">
                      <div
                        className="bg-brand-blue h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentual}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] text-gray-500 text-right">
                      Tempo dedicado: <strong className="text-purple-900">{item.tempoFormatado}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA PESQUISA                                 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-brand-blue" />
                <span>Pesquisas Jurídicas</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {totalPesquisas} pesquisas)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pautas consultadas, solicitantes, áreas beneficiadas e tempo despendido
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

              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Tipo:</span>
                <select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[170px]"
                >
                  <option value="todos">Todos os tipos</option>
                  {tipoOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca por Texto */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar título, solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa de pesquisas para Excel"
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
                <th className="py-3 px-4 min-w-[280px]">Título da Pesquisa</th>
                <th className="py-3 px-4 w-44">UN / AN</th>
                <th className="py-3 px-4 w-40">Solicitante</th>
                <th className="py-3 px-4 w-44">Tipo</th>
                <th className="py-3 px-4 text-center w-36 font-bold">Tempo Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhuma pesquisa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const badge = getTipoBadge(item.tipo);
                  const tempoFormatado = formatarMinutosParaHoras(item.tempo_investido_minutos);

                  return (
                    <tr
                      key={`${item.titulo}-${item.mes}-${idx}`}
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

                      {/* Título da Pesquisa */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 leading-snug">
                        {item.titulo}
                      </td>

                      {/* UN / AN */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                          {item.un_an}
                        </span>
                      </td>

                      {/* Solicitante */}
                      <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                        {item.solicitante}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {item.tipo}
                        </span>
                      </td>

                      {/* Tempo Investido */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-serif font-bold text-gray-900 text-sm">
                          {tempoFormatado}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {item.tempo_investido}
                        </div>
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
              Exibindo <strong>{displayRecords.length} pesquisas</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Tempo total filtrado: <strong className="text-purple-900">{tempoTotalFormatado}</strong> ({totalMinutos.toLocaleString('pt-BR')} minutos)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
