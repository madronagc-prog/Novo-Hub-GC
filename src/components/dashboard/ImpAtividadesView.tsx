import React, { useMemo, useState } from 'react';
import {
  AtividadeImprensaRegistro,
  impAtividadesData
} from '../../data/imp-atividades.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  Newspaper,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Search,
  Download,
  ExternalLink,
  Calendar,
  Layers,
  FileText,
  Mic,
  Users,
  PieChart,
  BarChart3,
  HelpCircle
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

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; bar: string }
> = {
  'Publicado': {
    label: 'Publicado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500'
  },
  'Em andamento': {
    label: 'Em andamento',
    bg: 'bg-blue-50',
    text: 'text-brand-blue',
    border: 'border-blue-200',
    bar: 'bg-[#00b2ff]'
  },
  'Declinado': {
    label: 'Declinado',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bar: 'bg-rose-500'
  },
  'Outros': {
    label: 'Não especificado',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    bar: 'bg-gray-400'
  }
};

interface ImpAtividadesViewProps {
  selectedMonth: string;
  selectedUn: string;
}

export default function ImpAtividadesView({ selectedMonth, selectedUn }: ImpAtividadesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [chartView, setChartView] = useState<'status' | 'atividade' | 'mes'>('status');

  // Base com dados normalizados (UN, Área e Mês)
  const normalizedData = useMemo(() => {
    return impAtividadesData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      area: normalizarUN(d.area),
      un: normalizarUN(d.un)
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

  // Filtro de mês (do seletor superior)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedData;
    }
    return sortedData.filter((d) => d.mes === selectedMonth);
  }, [sortedData, selectedMonth]);

  // Filtro de UN (do seletor superior) - aplicado sobre o período já filtrado por mês
  const filteredData = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return monthFilteredData;
    return monthFilteredData.filter((d) => d.un === selectedUn);
  }, [monthFilteredData, selectedUn]);

  // Filtro de status + busca textual (mês e UN já vêm de filteredData)
  const displayRecords = useMemo(() => {
    return filteredData.filter((d) => {
      // Filtro de status rápido
      if (statusFilter !== 'todos') {
        const itemStatus = d.status || 'Outros';
        if (itemStatus !== statusFilter) return false;
      }

      // Busca textual ampla
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.tema.toLowerCase().includes(term) ||
          d.porta_voz.toLowerCase().includes(term) ||
          d.area.toLowerCase().includes(term) ||
          d.area2.toLowerCase().includes(term) ||
          d.atividade.toLowerCase().includes(term) ||
          d.status.toLowerCase().includes(term) ||
          d.proposto_por.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.obs.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }

      return true;
    });
  }, [filteredData, statusFilter, searchTerm]);

  // ========================================================================
  // Totais do Resumo
  // ========================================================================
  const totalPautas = filteredData.length;

  const totalConvertidas = useMemo(
    () => filteredData.filter((d) => d.pauta_convertida === 'Sim').length,
    [filteredData]
  );

  const taxaConversao =
    totalPautas > 0 ? ((totalConvertidas / totalPautas) * 100).toFixed(1) : '0';

  // Distribuição por status
  const statsStatus = useMemo(() => {
    let publicados = 0;
    let andamento = 0;
    let declinados = 0;
    let outros = 0;

    filteredData.forEach((d) => {
      const s = (d.status || '').trim();
      if (s === 'Publicado') publicados++;
      else if (s === 'Em andamento') andamento++;
      else if (s === 'Declinado') declinados++;
      else outros++;
    });

    return {
      publicados,
      andamento,
      declinados,
      outros,
      pctPublicados: totalPautas > 0 ? (publicados / totalPautas) * 100 : 0,
      pctAndamento: totalPautas > 0 ? (andamento / totalPautas) * 100 : 0,
      pctDeclinados: totalPautas > 0 ? (declinados / totalPautas) * 100 : 0,
      pctOutros: totalPautas > 0 ? (outros / totalPautas) * 100 : 0
    };
  }, [filteredData, totalPautas]);

  // Distribuição por Atividade
  const statsAtividade = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((d) => {
      const ativ = d.atividade || 'Não especificada';
      map[ativ] = (map[ativ] || 0) + 1;
    });

    return Object.entries(map)
      .map(([atividade, qtd]) => ({
        atividade,
        qtd,
        pct: totalPautas > 0 ? (qtd / totalPautas) * 100 : 0
      }))
      .sort((a, b) => b.qtd - a.qtd);
  }, [filteredData, totalPautas]);

  // Evolução Mensal (Janeiro a Agosto)
  const statsPorMes = useMemo(() => {
    const map: Record<string, { total: number; convertidas: number; publicados: number }> = {};
    const base = selectedUn === 'Todas as UNs' ? sortedData : sortedData.filter((d) => d.un === selectedUn);
    base.forEach((d) => {
      if (!map[d.mes]) {
        map[d.mes] = { total: 0, convertidas: 0, publicados: 0 };
      }
      map[d.mes].total += 1;
      if (d.pauta_convertida === 'Sim') map[d.mes].convertidas += 1;
      if (d.status === 'Publicado') map[d.mes].publicados += 1;
    });

    return Object.entries(map)
      .map(([mes, stats]) => ({
        mes,
        total: stats.total,
        convertidas: stats.convertidas,
        publicados: stats.publicados
      }))
      .sort((a, b) => (MONTH_ORDER[a.mes] || 99) - (MONTH_ORDER[b.mes] || 99));
  }, [sortedData, selectedUn]);

  // Exportar para Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Área': d.area,
      'Área 2': d.area2,
      'Tema': d.tema,
      'Porta-voz': d.porta_voz,
      'Proposto por': d.proposto_por,
      'Atividade': d.atividade,
      'Status': d.status || 'Não especificado',
      'Pauta Convertida': d.pauta_convertida || 'Não especificado',
      'Link': d.link,
      'Observação': d.obs,
      'UN': d.un
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Atividades Imprensa');
    XLSX.writeFile(wb, `Atividades_Imprensa_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  // Helper para renderizar link clicável ou texto simples
  const renderLink = (linkText: string) => {
    if (!linkText || !linkText.trim()) {
      return <span className="text-gray-300">—</span>;
    }
    const trimmed = linkText.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return (
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline font-medium break-all"
          title={trimmed}
        >
          <span>Abrir link</span>
          <ExternalLink size={12} className="flex-shrink-0" />
        </a>
      );
    }
    return (
      <span className="text-xs text-gray-600 italic bg-gray-100 px-2 py-0.5 rounded">
        {trimmed}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS, CONVERSÃO E STATUS)                      */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total de Pautas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Newspaper size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Atividades
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalPautas}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {selectedMonth === 'Todos os meses' ? 'Jan a Ago/2026' : `Mês de ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Pautas Convertidas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Pautas Convertidas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalConvertidas}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp size={12} />
              {taxaConversao}% de conversão
            </div>
          </div>
        </div>

        {/* Status: Publicado */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Publicadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {statsStatus.publicados}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {statsStatus.pctPublicados.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Status: Em Andamento */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Em Andamento
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {statsStatus.andamento}
            </div>
            <div className="text-[11px] text-brand-blue font-medium mt-0.5">
              {statsStatus.pctAndamento.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Status: Declinado */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
            <XCircle size={22} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Declinadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {statsStatus.declinados}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              {statsStatus.pctDeclinados.toFixed(1)}% do total
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO VISUAL (STATUS, ATIVIDADE OU EVOLUÇÃO MENSAL)             */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Distribuição e Alcance</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhamento de status das pautas, formatos de mídia e evolução mensal
            </p>
          </div>

          {/* Alternância de Visualização */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setChartView('status')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                chartView === 'status'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Status
            </button>
            <button
              onClick={() => setChartView('atividade')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                chartView === 'atividade'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Atividade
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

        {totalPautas === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Nenhuma atividade registrada para o mês selecionado ({selectedMonth}).</p>
          </div>
        ) : chartView === 'status' ? (
          /* Visualização Por Status */
          <div className="space-y-4">
            {/* Barra de Progresso Geral Dividida */}
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex shadow-inner">
              {statsStatus.publicados > 0 && (
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${statsStatus.pctPublicados}%` }}
                  title={`Publicados: ${statsStatus.publicados} (${statsStatus.pctPublicados.toFixed(1)}%)`}
                ></div>
              )}
              {statsStatus.andamento > 0 && (
                <div
                  className="bg-[#00b2ff] h-full transition-all duration-500"
                  style={{ width: `${statsStatus.pctAndamento}%` }}
                  title={`Em andamento: ${statsStatus.andamento} (${statsStatus.pctAndamento.toFixed(1)}%)`}
                ></div>
              )}
              {statsStatus.declinados > 0 && (
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${statsStatus.pctDeclinados}%` }}
                  title={`Declinados: ${statsStatus.declinados} (${statsStatus.pctDeclinados.toFixed(1)}%)`}
                ></div>
              )}
              {statsStatus.outros > 0 && (
                <div
                  className="bg-gray-400 h-full transition-all duration-500"
                  style={{ width: `${statsStatus.pctOutros}%` }}
                  title={`Outros: ${statsStatus.outros} (${statsStatus.pctOutros.toFixed(1)}%)`}
                ></div>
              )}
            </div>

            {/* Cards Detalhados dos 3 Status Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Em andamento */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} />
                    Em andamento
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {statsStatus.pctAndamento.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-serif font-bold text-gray-900">
                  {statsStatus.andamento} pautas
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Sob avaliação ou produção com jornalistas
                </div>
              </div>

              {/* Publicado */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Publicado
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {statsStatus.pctPublicados.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-serif font-bold text-gray-900">
                  {statsStatus.publicados} matérias
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Artigos, entrevistas e matérias veiculadas
                </div>
              </div>

              {/* Declinado */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle size={14} />
                    Declinado
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {statsStatus.pctDeclinados.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-serif font-bold text-gray-900">
                  {statsStatus.declinados} pautas
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Pautas sem retorno ou não aproveitadas
                </div>
              </div>
            </div>
          </div>
        ) : chartView === 'atividade' ? (
          /* Visualização Por Atividade */
          <div className="space-y-3">
            {statsAtividade.map((ativ) => {
              const maxQtd = Math.max(...statsAtividade.map((a) => a.qtd), 1);
              const barWidth = (ativ.qtd / maxQtd) * 100;
              return (
                <div
                  key={ativ.atividade}
                  className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-800">
                      {ativ.atividade}
                    </span>
                    <span className="font-bold text-gray-900">
                      {ativ.qtd} {ativ.qtd === 1 ? 'ação' : 'ações'} ({ativ.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-brand-blue rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visualização Evolução Mensal */
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
                    <span className="text-xs font-bold text-brand-navy mb-1.5">
                      {m.total}
                    </span>
                    <div className="w-8 bg-gray-200 rounded-t-lg h-24 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-brand-blue rounded-t-lg transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500">
                    <div className="text-emerald-700 font-semibold">{m.publicados} publ.</div>
                    <div className="text-[10px] text-gray-400">{m.convertidas} conv.</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA ATIVIDADE (ORDEM CRONOLÓGICA)            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca, Filtro de Status e Ação de Exportar */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-brand-blue" />
                <span>Registro de Atividades</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} {displayRecords.length === 1 ? 'registro' : 'registros'})
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ordenado cronologicamente, Janeiro a Dezembro de 2026
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro de Status na Tabela */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todos">Todos os status</option>
                  <option value="Publicado">Publicado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Declinado">Declinado</option>
                </select>
              </div>

              {/* Campo de Busca Rápida (com suporte a temas longos) */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tema, porta-voz, área..."
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

        {/* Lista de Atividades com Rolagem Interna (5 linhas completas) */}
        <div className="p-4 sm:p-5">
          {displayRecords.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">Nenhuma atividade encontrada para os critérios selecionados.</p>
            </div>
          ) : (
            <div
              className="space-y-2 overflow-y-auto pr-1.5 scrollbar-thin"
              style={{ height: '352px' }}
            >
              {displayRecords.map((item, idx) => {
                const statusStyle = STATUS_CONFIG[item.status] || STATUS_CONFIG['Outros'];
                const isConvertida = item.pauta_convertida === 'Sim';

                return (
                  <div
                    key={`${item.tema}-${idx}`}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors flex flex-col justify-between h-[64px]"
                  >
                    {/* Linha 1: Numeração, Mês, Status, Atividade, Convertida, Tema e Link */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-600 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded flex-shrink-0">
                          {item.mes}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {item.status || 'Não especificado'}
                        </span>
                        {item.atividade && (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                            {item.atividade}
                          </span>
                        )}
                        {isConvertida ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                            <CheckCircle2 size={11} />
                            Convertida
                          </span>
                        ) : item.pauta_convertida === 'Não' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200 flex-shrink-0">
                            <XCircle size={11} />
                            Não convertida
                          </span>
                        ) : null}
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate" title={item.tema}>
                          {item.tema}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {renderLink(item.link)}
                      </div>
                    </div>

                    {/* Linha 2: Metadados (Área, UN, Porta-voz, Proposto por, Observações) */}
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 pl-7 truncate">
                      <span className="font-medium text-gray-700">
                        Área: <strong>{item.area || '—'}</strong>{item.area2 ? ` + ${item.area2}` : ''}
                      </span>
                      {item.un && item.un !== item.area && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-medium border border-slate-200">
                            {item.un}
                          </span>
                        </>
                      )}
                      {item.porta_voz && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-600">
                            Porta-voz: <strong className="text-gray-800">{item.porta_voz}</strong>
                          </span>
                        </>
                      )}
                      {item.proposto_por && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500">
                            Proposto por: {item.proposto_por}
                          </span>
                        </>
                      )}
                      {item.obs && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-400 italic truncate max-w-[320px]" title={item.obs}>
                            Obs: {item.obs}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé da Tabela com Totais */}
        {displayRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Total exibido: <strong>{displayRecords.length} atividades</strong> no período de{' '}
              <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Convertidas:{' '}
                <strong className="text-emerald-700 font-semibold">
                  {displayRecords.filter((d) => d.pauta_convertida === 'Sim').length}
                </strong>
              </span>
              <span>
                Publicadas:{' '}
                <strong className="text-gray-900">
                  {displayRecords.filter((d) => d.status === 'Publicado').length}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
