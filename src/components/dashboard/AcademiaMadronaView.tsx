import React, { useMemo, useState } from 'react';
import {
  AcadMadronaRegistro,
  acadMadronaData
} from '../../data/acad-madrona.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  GraduationCap,
  Users,
  UserCheck,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Search,
  Download,
  Award,
  Layers,
  Sparkles,
  ArrowUpDown
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

const PILAR_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'Treinamentos': {
    bg: 'bg-blue-50',
    text: 'text-[#007cb8]',
    border: 'border-blue-200',
    bar: 'bg-[#00b2ff]'
  },
  'Madrona Lab': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    bar: 'bg-[#0a1e3f]'
  },
  'De olho no full service': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    bar: 'bg-[#FC745C]'
  }
};

interface AcademiaMadronaViewProps {
  selectedMonth: string;
}

export default function AcademiaMadronaView({ selectedMonth }: AcademiaMadronaViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [chartView, setChartView] = useState<'pilar' | 'sessao' | 'mes'>('pilar');

  // Base com dados normalizados (Mês)
  const normalizedData = useMemo(() => {
    return acadMadronaData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Março a Setembro)
  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês (herdado do seletor da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedData;
    }
    return sortedData.filter((d) => d.mes === selectedMonth);
  }, [sortedData, selectedMonth]);

  // Filtro de texto para a tabela
  const displaySessions = useMemo(() => {
    if (!searchTerm.trim()) return monthFilteredData;
    const term = searchTerm.toLowerCase();
    return monthFilteredData.filter(
      (d) =>
        d.titulo.toLowerCase().includes(term) ||
        d.apresentado_por.toLowerCase().includes(term) ||
        d.pilar.toLowerCase().includes(term) ||
        d.mes.toLowerCase().includes(term)
    );
  }, [monthFilteredData, searchTerm]);

  // Totais do Resumo
  const totalSessoes = monthFilteredData.length;
  const totalParticipantes = useMemo(
    () => monthFilteredData.reduce((acc, curr) => acc + curr.participantes, 0),
    [monthFilteredData]
  );
  const totalConvidados = useMemo(
    () => monthFilteredData.reduce((acc, curr) => acc + curr.convidados, 0),
    [monthFilteredData]
  );
  const mediaParticipantes = totalSessoes > 0 ? Math.round(totalParticipantes / totalSessoes) : 0;
  const taxaAdesaoGeral =
    totalConvidados > 0 ? ((totalParticipantes / totalConvidados) * 100).toFixed(1) : '0';

  // Agrupamento por Pilar (para gráfico e métricas)
  const statsPorPilar = useMemo(() => {
    const map: Record<string, { sessoes: number; participantes: number; convidados: number }> = {};
    monthFilteredData.forEach((d) => {
      if (!map[d.pilar]) {
        map[d.pilar] = { sessoes: 0, participantes: 0, convidados: 0 };
      }
      map[d.pilar].sessoes += 1;
      map[d.pilar].participantes += d.participantes;
      map[d.pilar].convidados += d.convidados;
    });

    return Object.entries(map).map(([pilar, stats]) => ({
      pilar,
      sessoes: stats.sessoes,
      participantes: stats.participantes,
      convidados: stats.convidados,
      media: Math.round(stats.participantes / stats.sessoes),
      percentualDoTotal: totalParticipantes > 0 ? (stats.participantes / totalParticipantes) * 100 : 0
    })).sort((a, b) => b.participantes - a.participantes);
  }, [monthFilteredData, totalParticipantes]);

  // Agrupamento por Mês (para evolução)
  const statsPorMes = useMemo(() => {
    const map: Record<string, { sessoes: number; participantes: number; convidados: number }> = {};
    sortedData.forEach((d) => {
      if (!map[d.mes]) {
        map[d.mes] = { sessoes: 0, participantes: 0, convidados: 0 };
      }
      map[d.mes].sessoes += 1;
      map[d.mes].participantes += d.participantes;
      map[d.mes].convidados += d.convidados;
    });

    return Object.entries(map)
      .map(([mes, stats]) => ({
        mes,
        sessoes: stats.sessoes,
        participantes: stats.participantes,
        convidados: stats.convidados,
        media: Math.round(stats.participantes / stats.sessoes)
      }))
      .sort((a, b) => (MONTH_ORDER[a.mes] || 99) - (MONTH_ORDER[b.mes] || 99));
  }, [sortedData]);

  // Exportar para Excel
  const handleExportExcel = () => {
    const exportData = monthFilteredData.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Título da Sessão': d.titulo,
      'Pilar': d.pilar,
      'Apresentado por': d.apresentado_por,
      'Participantes': d.participantes,
      'Convidados': d.convidados,
      'Taxa de Adesão (%)': ((d.participantes / d.convidados) * 100).toFixed(1) + '%'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Academia Madrona');
    XLSX.writeFile(wb, `Academia_Madrona_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS)                                          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Total de Sessões */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Sessões Realizadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalSessoes}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {selectedMonth === 'Todos os meses' ? 'Março a Setembro de 2026' : `Mês de ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Card: Soma de Participantes */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Soma de Participantes
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalParticipantes.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp size={12} />
              Média de {mediaParticipantes} pessoas/sessão
            </div>
          </div>
        </div>

        {/* Card: Soma de Convidados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Soma de Convidados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalConvidados.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Base média de ~229 pessoas
            </div>
          </div>
        </div>

        {/* Card: Taxa de Adesão */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Taxa Média de Adesão
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {taxaAdesaoGeral}%
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Presença sobre convidados
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICOS VISUAIS (POR PILAR, POR SESSÃO OU EVOLUÇÃO)              */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Análise de Participação</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Distribuição e alcance das capacitações da Academia Madrona
            </p>
          </div>

          {/* Seletor de Tipo de Gráfico */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setChartView('pilar')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                chartView === 'pilar'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Pilar
            </button>
            <button
              onClick={() => setChartView('sessao')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                chartView === 'sessao'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Sessão
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

        {totalSessoes === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Nenhuma sessão registrada para o mês selecionado ({selectedMonth}).</p>
          </div>
        ) : chartView === 'pilar' ? (
          /* Visualização Por Pilar */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statsPorPilar.map((item) => {
                const color = PILAR_COLORS[item.pilar] || {
                  bg: 'bg-gray-50',
                  text: 'text-gray-700',
                  border: 'border-gray-200',
                  bar: 'bg-brand-blue'
                };
                return (
                  <div
                    key={item.pilar}
                    className={`rounded-xl border ${color.border} ${color.bg} p-4 transition-all hover:shadow-xs`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${color.text} uppercase tracking-wider`}>
                        {item.pilar}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {item.sessoes} {item.sessoes === 1 ? 'sessão' : 'sessões'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold font-serif text-gray-900">
                        {item.participantes}
                      </span>
                      <span className="text-xs text-gray-500">participantes</span>
                    </div>

                    {/* Barra de Proporção */}
                    <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden border border-black/5 mb-2">
                      <div
                        className={`h-full ${color.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, item.percentualDoTotal)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-600">
                      <span>{item.percentualDoTotal.toFixed(1)}% do público total</span>
                      <span className="font-medium">Média: {item.media}/sessão</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : chartView === 'sessao' ? (
          /* Visualização Por Sessão (Barras Horizontais com Título e Pilar) */
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
            {monthFilteredData.map((d, idx) => {
              const maxPart = Math.max(...monthFilteredData.map((s) => s.participantes), 127);
              const pct = (d.participantes / maxPart) * 100;
              const taxa = ((d.participantes / d.convidados) * 100).toFixed(0);
              const color = PILAR_COLORS[d.pilar] || {
                bg: 'bg-blue-50',
                text: 'text-blue-800',
                border: 'border-blue-200',
                bar: 'bg-brand-blue'
              };

              return (
                <div
                  key={`${d.titulo}-${idx}`}
                  className="bg-gray-50/70 hover:bg-gray-100/70 p-3 rounded-xl border border-gray-200/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-500 w-16 flex-shrink-0">
                        {d.mes}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {d.titulo}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border}`}
                      >
                        {d.pilar}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0 self-end sm:self-auto">
                      <span className="text-gray-400 text-[11px]">Por: {d.apresentado_por}</span>
                      <span className="font-bold text-gray-900 text-sm">{d.participantes} part.</span>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        {taxa}% adesão
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${color.bar} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visualização Evolução Mensal */
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {statsPorMes.map((m) => {
              const maxMonthly = Math.max(...statsPorMes.map((s) => s.participantes));
              const heightPct = Math.round((m.participantes / maxMonthly) * 100);
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
                    <span className="text-xs font-bold text-brand-navy mb-1.5">
                      {m.participantes}
                    </span>
                    <div className="w-8 bg-gray-200 rounded-t-lg h-24 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-brand-blue rounded-t-lg transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    <div>{m.sessoes} {m.sessoes === 1 ? 'sessão' : 'sessões'}</div>
                    <div className="text-[10px] text-gray-400">Média: {m.media}/sessão</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA SESSÃO (ORDEM CRONOLÓGICA)               */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Ação de Exportar */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-brand-blue" />
                <span>Histórico de Sessões Realizadas</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displaySessions.length} {displaySessions.length === 1 ? 'registro' : 'registros'})
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ordenado cronologicamente de Março a Setembro de 2026
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Campo de Busca Rápida */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar sessão ou apresentador..."
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

        {/* Tabela de Dados com Rolagem Interna (10 linhas completas) */}
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin" style={{ height: '480px' }}>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200/80">
              <tr className="h-[40px] text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-28">Mês</th>
                <th className="py-2.5 px-4">Título da Sessão</th>
                <th className="py-2.5 px-4 w-44">Pilar</th>
                <th className="py-2.5 px-4">Apresentado por</th>
                <th className="py-2.5 px-4 text-center w-28">Participantes</th>
                <th className="py-2.5 px-4 text-center w-24">Convidados</th>
                <th className="py-2.5 px-4 text-center w-28">Adesão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displaySessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhuma sessão encontrada para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                displaySessions.map((item, idx) => {
                  const pilarStyle = PILAR_COLORS[item.pilar] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-200'
                  };
                  const taxa = ((item.participantes / item.convidados) * 100).toFixed(1);

                  return (
                    <tr
                      key={`${item.titulo}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors h-[44px]"
                    >
                      {/* Mês */}
                      <td className="py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Título da Sessão */}
                      <td className="py-2.5 px-4 font-medium text-gray-900">
                        {item.titulo}
                      </td>

                      {/* Pilar */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pilarStyle.bg} ${pilarStyle.text} ${pilarStyle.border}`}
                        >
                          {item.pilar}
                        </span>
                      </td>

                      {/* Apresentado por */}
                      <td className="py-2.5 px-4 text-gray-600">
                        {item.apresentado_por}
                      </td>

                      {/* Participantes */}
                      <td className="py-2.5 px-4 text-center font-bold text-gray-900">
                        {item.participantes}
                      </td>

                      {/* Convidados */}
                      <td className="py-2.5 px-4 text-center text-gray-500">
                        {item.convidados}
                      </td>

                      {/* Taxa de Adesão */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-700 text-xs">
                            {taxa}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Totais */}
        {displaySessions.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Total exibido: <strong>{displaySessions.length} sessões</strong> no período de{' '}
              <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Participantes:{' '}
                <strong className="text-gray-900">
                  {displaySessions.reduce((acc, d) => acc + d.participantes, 0)}
                </strong>
              </span>
              <span>
                Convidados:{' '}
                <strong className="text-gray-900">
                  {displaySessions.reduce((acc, d) => acc + d.convidados, 0)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
