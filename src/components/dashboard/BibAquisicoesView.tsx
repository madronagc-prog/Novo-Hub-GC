import React, { useMemo, useState } from 'react';
import {
  AquisicoesRegistro,
  bibAquisicoesData
} from '../../data/bib-aquisicoes.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  BookOpen,
  DollarSign,
  Building,
  MapPin,
  Calendar,
  Search,
  Download,
  BarChart3,
  TrendingUp,
  Tag,
  PieChart,
  Layers,
  Sparkles
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

const LOCALIDADE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'SP': {
    bg: 'bg-blue-50',
    text: 'text-[#007cb8]',
    border: 'border-blue-200'
  },
  'BH': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  'E-book': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200'
  }
};

const UN_COLORS = [
  'bg-[#00b2ff]',
  'bg-[#0a1e3f]',
  'bg-[#FC745C]',
  'bg-[#10b981]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#06b6d4]',
  'bg-[#ec4899]'
];

interface BibAquisicoesViewProps {
  selectedMonth: string;
  selectedUn: string;
}

export default function BibAquisicoesView({ selectedMonth, selectedUn }: BibAquisicoesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [chartView, setChartView] = useState<'unan' | 'localidade' | 'mes'>('unan');

  // Base com dados normalizados (UN e Mês)
  const normalizedData = useMemo(() => {
    return bibAquisicoesData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un_an: normalizarUN(d.un_an)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Agosto)
  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedData;
    }
    return sortedData.filter((d) => d.mes === selectedMonth);
  }, [sortedData, selectedMonth]);

  // Filtro de UN (do seletor superior da página) - aplicado sobre o período já filtrado por mês
  const filteredData = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return monthFilteredData;
    return monthFilteredData.filter((d) => d.un_an === selectedUn);
  }, [monthFilteredData, selectedUn]);

  // Filtro de busca textual (mês e UN já vêm de filteredData)
  const displayRecords = useMemo(() => {
    if (!searchTerm.trim()) return filteredData;
    const term = searchTerm.toLowerCase();
    return filteredData.filter(
      (d) =>
        d.titulo.toLowerCase().includes(term) ||
        d.un_an.toLowerCase().includes(term) ||
        d.localidade.toLowerCase().includes(term) ||
        d.mes.toLowerCase().includes(term) ||
        (d.tipo && d.tipo.toLowerCase().includes(term))
    );
  }, [filteredData, searchTerm]);

  // Totais do Resumo (no período e UN filtrados)
  const totalAquisicoes = filteredData.length;
  const valorTotalGasto = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.valor, 0),
    [filteredData]
  );
  const valorMedio = totalAquisicoes > 0 ? valorTotalGasto / totalAquisicoes : 0;

  // Quebra por UN/AN
  const statsPorUnAn = useMemo(() => {
    const map: Record<string, { total: number; qtd: number }> = {};
    filteredData.forEach((d) => {
      if (!map[d.un_an]) {
        map[d.un_an] = { total: 0, qtd: 0 };
      }
      map[d.un_an].total += d.valor;
      map[d.un_an].qtd += 1;
    });

    return Object.entries(map)
      .map(([un_an, stats]) => ({
        un_an,
        total: stats.total,
        qtd: stats.qtd,
        media: stats.total / stats.qtd,
        percentual: valorTotalGasto > 0 ? (stats.total / valorTotalGasto) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData, valorTotalGasto]);

  // Quebra por Localidade
  const statsPorLocalidade = useMemo(() => {
    const map: Record<string, { total: number; qtd: number }> = {};
    filteredData.forEach((d) => {
      const loc = d.localidade || 'Não especificada';
      if (!map[loc]) {
        map[loc] = { total: 0, qtd: 0 };
      }
      map[loc].total += d.valor;
      map[loc].qtd += 1;
    });

    return Object.entries(map)
      .map(([localidade, stats]) => ({
        localidade,
        total: stats.total,
        qtd: stats.qtd,
        percentual: valorTotalGasto > 0 ? (stats.total / valorTotalGasto) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData, valorTotalGasto]);

  // Evolução Mensal (Janeiro a Dezembro; respeita o filtro de UN)
  const statsPorMes = useMemo(() => {
    const map: Record<string, { total: number; qtd: number }> = {};
    const base = selectedUn === 'Todas as UNs' ? sortedData : sortedData.filter((d) => d.un_an === selectedUn);
    base.forEach((d) => {
      if (!map[d.mes]) {
        map[d.mes] = { total: 0, qtd: 0 };
      }
      map[d.mes].total += d.valor;
      map[d.mes].qtd += 1;
    });

    return Object.entries(map)
      .map(([mes, stats]) => ({
        mes,
        total: stats.total,
        qtd: stats.qtd,
        media: stats.total / stats.qtd
      }))
      .sort((a, b) => (MONTH_ORDER[a.mes] || 99) - (MONTH_ORDER[b.mes] || 99));
  }, [sortedData, selectedUn]);

  // Exportar para Excel
  const handleExportExcel = () => {
    const exportData = monthFilteredData.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Título da Obra': d.titulo,
      'UN / AN': d.un_an,
      'Tipo': d.tipo || 'Livro físico',
      'Valor (R$)': d.valor,
      'Localidade': d.localidade
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aquisições');
    XLSX.writeFile(wb, `Aquisicoes_Biblioteca_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS E QUEBRA POR UN/AN)                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Total de Aquisições */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Obras Adquiridas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalAquisicoes} {totalAquisicoes === 1 ? 'título' : 'títulos'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {selectedMonth === 'Todos os meses' ? 'Janeiro a Agosto de 2026' : `Mês de ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Card: Valor Total Gasto */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Investido
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5 text-emerald-700">
              {formatCurrency(valorTotalGasto)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Orçamento de acervo
            </div>
          </div>
        </div>

        {/* Card: Valor Médio por Obra */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ticket Médio / Livro
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {formatCurrency(valorMedio)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Custo médio por aquisição
            </div>
          </div>
        </div>

        {/* Card: UNs/ANs Atendidas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Building size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              UNs / ANs Beneficiadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {statsPorUnAn.length} áreas
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Distribuição institucional
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. DESTAQUE: QUEBRA POR UN / AN (MINI PAINEL)                        */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-serif font-bold text-gray-900 flex items-center gap-1.5">
              <Building size={16} className="text-brand-blue" />
              <span>Investimento por Área)</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Volume financeiro e obras solicitadas por cada unidade de negócio
            </p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            {statsPorUnAn.length} áreas com compras
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {statsPorUnAn.map((un, index) => {
            const barColor = UN_COLORS[index % UN_COLORS.length];
            return (
              <div
                key={un.un_an}
                className="bg-gray-50/80 hover:bg-blue-50/30 border border-gray-200/70 rounded-xl p-3.5 transition-all"
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-gray-800 line-clamp-1" title={un.un_an}>
                    {un.un_an}
                  </span>
                  <span className="text-[10px] bg-white border border-gray-200 font-semibold px-1.5 py-0.5 rounded text-gray-600 flex-shrink-0">
                    {un.qtd} {un.qtd === 1 ? 'obra' : 'obras'}
                  </span>
                </div>
                <div className="text-base font-serif font-bold text-gray-900">
                  {formatCurrency(un.total)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 my-2 overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full`}
                    style={{ width: `${Math.min(100, un.percentual)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between">
                  <span>{un.percentual.toFixed(1)}% do total</span>
                  <span>Média: {formatCurrency(un.media)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ANÁLISE GRÁFICA (POR UN/AN, POR LOCALIDADE OU EVOLUÇÃO)           */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Análise de Gastos</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparativo financeiro por área demandante, praça (SP x BH x E-book) e evolução mensal
            </p>
          </div>

          {/* Seletor de Tipo de Gráfico */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setChartView('unan')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                chartView === 'unan'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por UN / AN
            </button>
            <button
              onClick={() => setChartView('localidade')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                chartView === 'localidade'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Localidade (SP x BH x E-book)
            </button>
            {selectedMonth === 'Todos os meses' && (
              <button
                onClick={() => setChartView('mes')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  chartView === 'mes'
                    ? 'bg-white text-brand-navy shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Evolução Mensal
              </button>
            )}
          </div>
        </div>

        {totalAquisicoes === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Nenhuma aquisição registrada para o mês selecionado ({selectedMonth}).</p>
          </div>
        ) : chartView === 'unan' ? (
          /* Gráfico de Barras Horizontais: Por UN / AN */
          <div className="space-y-3">
            {statsPorUnAn.map((un, index) => {
              const maxVal = Math.max(...statsPorUnAn.map((s) => s.total), 1);
              const barWidth = (un.total / maxVal) * 100;
              const barColor = UN_COLORS[index % UN_COLORS.length];

              return (
                <div
                  key={un.un_an}
                  className="bg-gray-50/70 hover:bg-gray-100/70 p-3 rounded-xl border border-gray-200/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {un.un_an}
                      </span>
                      <span className="text-[10px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                        {un.qtd} {un.qtd === 1 ? 'título' : 'títulos'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-shrink-0 self-end sm:self-auto">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatCurrency(un.total)}
                      </span>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        {un.percentual.toFixed(1)}% do total
                      </span>
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
        ) : chartView === 'localidade' ? (
          /* Gráfico Comparativo: SP x BH x E-book */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statsPorLocalidade.map((item) => {
                const badge = LOCALIDADE_BADGES[item.localidade] || {
                  bg: 'bg-gray-50',
                  text: 'text-gray-700',
                  border: 'border-gray-200'
                };
                const barColor =
                  item.localidade === 'SP'
                    ? 'bg-[#00b2ff]'
                    : item.localidade === 'BH'
                    ? 'bg-emerald-500'
                    : 'bg-purple-600';

                return (
                  <div
                    key={item.localidade}
                    className={`rounded-xl border ${badge.border} ${badge.bg} p-5 transition-all hover:shadow-xs`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold ${badge.text} uppercase tracking-wider flex items-center gap-1`}>
                        <MapPin size={14} />
                        Praça: {item.localidade}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {item.qtd} {item.qtd === 1 ? 'aquisição' : 'aquisições'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">
                        {formatCurrency(item.total)}
                      </span>
                    </div>

                    <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden border border-black/5 mb-2">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, item.percentual)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{item.percentual.toFixed(1)}% do valor total</span>
                      <span className="font-medium">
                        Média: {formatCurrency(item.total / item.qtd)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Evolução Mensal (Janeiro a Dezembro) */
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-3">
            {statsPorMes.map((m) => {
              const maxMonthly = Math.max(...statsPorMes.map((s) => s.total));
              const heightPct = Math.round((m.total / maxMonthly) * 100);
              const isCurrentFilter = selectedMonth === m.mes;

              return (
                <div
                  key={m.mes}
                  className={`bg-gray-50 rounded-xl p-3.5 border transition-all text-center flex flex-col justify-between ${
                    isCurrentFilter
                      ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/40'
                      : 'border-gray-200/70 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {m.mes}
                  </span>

                  <div className="my-3 flex flex-col items-center justify-end h-28">
                    <span className="text-[11px] font-bold text-brand-navy mb-1.5">
                      {formatCurrency(m.total).replace(',00', '')}
                    </span>
                    <div className="w-8 bg-gray-200 rounded-t-lg h-24 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-brand-blue rounded-t-lg transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    <div>{m.qtd} {m.qtd === 1 ? 'livro' : 'livros'}</div>
                    <div className="text-[10px] text-gray-400">
                      Méd: {formatCurrency(m.media).replace(',00', '')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM CADA AQUISIÇÃO (ORDEM CRONOLÓGICA)            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Ação de Exportar */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-brand-blue" />
                <span>Histórico de Aquisições</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} {displayRecords.length === 1 ? 'registro' : 'registros'})
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ordenado cronologicamente, Janeiro a Dezembro de 2026
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Campo de Busca Rápida */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar obra, UN/AN ou praça..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-52 sm:w-64"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar dados para planilha Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados com Rolagem Interna */}
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin" style={{ height: '480px' }}>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4">Título da Obra</th>
                <th className="py-3 px-4 w-48">UN / AN</th>
                <th className="py-3 px-4 w-32">Tipo</th>
                <th className="py-3 px-4 text-center w-28">Localidade</th>
                <th className="py-3 px-4 text-right w-32">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhuma aquisição encontrada para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const locBadge = LOCALIDADE_BADGES[item.localidade] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-200'
                  };

                  return (
                    <tr
                      key={`${item.titulo}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Título da Obra */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 leading-snug">
                        {item.titulo}
                      </td>

                      {/* UN / AN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.un_an}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        {item.tipo ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Tag size={12} className="text-gray-400" />
                            {item.tipo}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Livro físico</span>
                        )}
                      </td>

                      {/* Localidade */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${locBadge.bg} ${locBadge.text} ${locBadge.border}`}
                        >
                          {item.localidade}
                        </span>
                      </td>

                      {/* Valor em R$ */}
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.valor)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Totais */}
        {displayRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Total exibido: <strong>{displayRecords.length} obras</strong> no período de{' '}
              <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Valor Total Gasto:{' '}
                <strong className="text-gray-900 text-sm">
                  {formatCurrency(displayRecords.reduce((acc, d) => acc + d.valor, 0))}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
