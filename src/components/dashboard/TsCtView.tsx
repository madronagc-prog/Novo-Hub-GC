import React, { useMemo, useState } from 'react';
import { tsCtDetalhadoData, TSCTDetalhadoRegistro } from '../../data/ts-ct-detalhado.data';
import { tsCtData, BaseCtRegistro } from '../../data/ts-ct.data';
import { normalizarUN, normalizarMes, normalizarPosicao } from '../../utils/padronizacao';
import {
  Clock,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  BarChart3,
  Search,
  Download,
  Award,
  Building,
  Layers,
  Calendar,
  Briefcase,
  Shield,
  Filter
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

const MESES_EVOLUCAO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatarMinutos(minutos: number): string {
  if (!minutos || minutos <= 0) return '0h 00min';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return `${h}h ${m < 10 ? '0' : ''}${m}min`;
}

function formatarMoeda(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface TsCtViewProps {
  selectedMonth?: string;
  selectedUn?: string;
}

export default function TsCtView({ selectedMonth = 'Todos os meses', selectedUn = 'Todas as UNs' }: TsCtViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFrente, setSelectedFrente] = useState('todas');
  const [localMonth, setLocalMonth] = useState('todos');
  const [rankingMetric, setRankingMetric] = useState<'valor' | 'tempo'>('valor');
  const [activeTabSection, setActiveTabSection] = useState<'analise' | 'referencia'>('analise');

  // Mapa de referência rápida de colaboradores (Nome -> Cadastro)
  const refColaboradores = useMemo(() => {
    const map = new Map<string, BaseCtRegistro>();
    tsCtData.forEach((c) => {
      map.set(c.nome.trim().toLowerCase(), c);
    });
    return map;
  }, []);

  // Base normalizada de apontamentos detalhados
  const normalizedData = useMemo(() => {
    return tsCtDetalhadoData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un: normalizarUN(d.un),
      valorSeguro: d.valor || 0,
      tempoMinutosSeguro: d.tempo_minutos || 0
    }));
  }, []);

  // Meses e Frentes disponíveis
  const frentesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.frente && d.frente.trim()) set.add(d.frente.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtro de mês (do Dashboard geral ou local)
  const monthFiltered = useMemo(() => {
    let data = normalizedData;
    // Se selecionado no topo da página
    if (selectedMonth && selectedMonth !== 'Todos os meses') {
      data = data.filter((d) => d.mes === selectedMonth);
    } else if (localMonth !== 'todos') {
      data = data.filter((d) => d.mes === localMonth);
    }
    return data;
  }, [normalizedData, selectedMonth, localMonth]);

  // Filtro de UN (do seletor superior da página) - aplicado sobre o período já filtrado por mês
  const filteredData = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return monthFiltered;
    return monthFiltered.filter((d) => d.un === selectedUn);
  }, [monthFiltered, selectedUn]);

  // Mesma base de UN, mas sem o filtro de mês (para o gráfico de evolução, que mostra todos os meses)
  const unFilteredAllMonths = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return normalizedData;
    return normalizedData.filter((d) => d.un === selectedUn);
  }, [normalizedData, selectedUn]);

  // Filtro de frente e busca textual para a tabela e rankings (mês e UN já vêm de filteredData)
  const displayRecords = useMemo(() => {
    return filteredData.filter((d) => {
      if (selectedFrente !== 'todas' && d.frente !== selectedFrente) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          d.nome.toLowerCase().includes(term) ||
          d.frente.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [filteredData, selectedFrente, searchTerm]);

  // Totais do Resumo (no período e UN filtrados)
  const totalValor = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.valorSeguro, 0),
    [filteredData]
  );

  const totalMinutos = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.tempoMinutosSeguro, 0),
    [filteredData]
  );

  const totalApontamentos = filteredData.length;

  const colaboradoresUnicos = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach((d) => set.add(d.nome.trim().toLowerCase()));
    return set.size;
  }, [filteredData]);

  // Evolução Mensal (Janeiro a Dezembro; respeita o filtro de UN)
  const evolucaoMensal = useMemo(() => {
    return MESES_EVOLUCAO.map((m) => {
      const itens = unFilteredAllMonths.filter((d) => d.mes === m);
      const valor = itens.reduce((acc, d) => acc + d.valorSeguro, 0);
      const minutos = itens.reduce((acc, d) => acc + d.tempoMinutosSeguro, 0);
      const apontamentos = itens.length;

      return {
        mes: m,
        valor,
        minutos,
        horas: Math.round(minutos / 60),
        apontamentos
      };
    });
  }, [unFilteredAllMonths]);

  const maxEvolucaoValor = Math.max(...evolucaoMensal.map((e) => e.valor), 1);
  const maxEvolucaoHoras = Math.max(...evolucaoMensal.map((e) => e.horas), 1);

  // Agrupamento por Frente
  const statsPorFrente = useMemo(() => {
    const map: Record<string, { valor: number; minutos: number; count: number; users: Set<string> }> = {};

    filteredData.forEach((d) => {
      const f = d.frente || 'Não informada';
      if (!map[f]) {
        map[f] = { valor: 0, minutos: 0, count: 0, users: new Set() };
      }
      map[f].valor += d.valorSeguro;
      map[f].minutos += d.tempoMinutosSeguro;
      map[f].count += 1;
      map[f].users.add(d.nome.trim().toLowerCase());
    });

    return Object.entries(map)
      .map(([frente, s]) => ({
        frente,
        valor: s.valor,
        minutos: s.minutos,
        count: s.count,
        colaboradores: s.users.size,
        pctValor: totalValor > 0 ? (s.valor / totalValor) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredData, totalValor]);

  const maxFrenteValor = statsPorFrente[0]?.valor || 1;

  // Agrupamento por UN
  const statsPorUn = useMemo(() => {
    const map: Record<string, { valor: number; minutos: number; count: number; users: Set<string> }> = {};

    filteredData.forEach((d) => {
      const unName = d.un || 'Não informada';
      if (!map[unName]) {
        map[unName] = { valor: 0, minutos: 0, count: 0, users: new Set() };
      }
      map[unName].valor += d.valorSeguro;
      map[unName].minutos += d.tempoMinutosSeguro;
      map[unName].count += 1;
      map[unName].users.add(d.nome.trim().toLowerCase());
    });

    return Object.entries(map)
      .map(([un, s]) => ({
        un,
        valor: s.valor,
        minutos: s.minutos,
        count: s.count,
        colaboradores: s.users.size,
        pctValor: totalValor > 0 ? (s.valor / totalValor) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredData, totalValor]);

  const maxUnValor = statsPorUn[0]?.valor || 1;

  // Ranking Top 15 Colaboradores
  const top15Colaboradores = useMemo(() => {
    const map: Record<string, { nome: string; un: string; valor: number; minutos: number; apontamentos: number }> = {};

    filteredData.forEach((d) => {
      const chave = d.nome.trim().toLowerCase();
      if (!map[chave]) {
        map[chave] = {
          nome: d.nome,
          un: d.un,
          valor: 0,
          minutos: 0,
          apontamentos: 0
        };
      }
      map[chave].valor += d.valorSeguro;
      map[chave].minutos += d.tempoMinutosSeguro;
      map[chave].apontamentos += 1;
    });

    const lista = Object.values(map).map((colab) => {
      const ref = refColaboradores.get(colab.nome.trim().toLowerCase());
      return {
        ...colab,
        posicao: ref ? normalizarPosicao(ref.posicao) : 'Não mapeada'
      };
    });

    return lista
      .sort((a, b) => {
        if (rankingMetric === 'valor') return b.valor - a.valor;
        return b.minutos - a.minutos;
      })
      .slice(0, 15);
  }, [filteredData, rankingMetric, refColaboradores]);

  const maxRankingVal = top15Colaboradores[0]
    ? rankingMetric === 'valor'
      ? top15Colaboradores[0].valor
      : top15Colaboradores[0].minutos
    : 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => {
      const ref = refColaboradores.get(d.nome.trim().toLowerCase());
      return {
        '#': index + 1,
        'Frente': d.frente,
        'Mês': d.mes,
        'Colaborador': d.nome,
        'Posição (Cadastro)': ref ? ref.posicao : '—',
        'UN (Padronizada)': d.un,
        'Valor (R$)': d.valorSeguro,
        'Tempo (Minutos)': d.tempoMinutosSeguro,
        'Tempo Formatado': formatarMinutos(d.tempoMinutosSeguro)
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TS CT Detalhado');
    XLSX.writeFile(wb, `Timesheet_CT_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* CABEÇALHO COM TABS (ANÁLISE DETALHADA VS BASE REFERENCIAL)          */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-gray-900">
              Timesheet e Contribuição Técnica
            </h2>
            <p className="text-xs text-gray-500">
              Apontamentos por frentes de conhecimento, valor financeiro e tempo investido
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabSection('analise')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTabSection === 'analise'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Análise de Apontamentos
          </button>
          <button
            onClick={() => setActiveTabSection('referencia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTabSection === 'referencia'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Base Referencial ({tsCtData.length} colaboradores)
          </button>
        </div>
      </div>

      {activeTabSection === 'analise' ? (
        <>
          {/* ================================================================ */}
          {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                           */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valor Total */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Valor Total Investido
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
                  {formatarMoeda(totalValor)}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  Equivalente em horas técnicas
                </div>
              </div>
            </div>

            {/* Tempo Total Investido */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
                <Clock size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Tempo Total Investido
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy mt-0.5">
                  {formatarMinutos(totalMinutos)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {totalMinutos.toLocaleString('pt-BR')} minutos dedicados
                </div>
              </div>
            </div>

            {/* Número de Apontamentos */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                <FileText size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Total de Apontamentos
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
                  {totalApontamentos.toLocaleString('pt-BR')}
                </div>
                <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                  Lançamentos de horas no sistema
                </div>
              </div>
            </div>

            {/* Colaboradores Únicos */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                <Users size={24} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Colaboradores Ativos
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
                  {colaboradoresUnicos} colaboradores
                </div>
                <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                  Participantes nas frentes de GC
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (VALOR TOTAL E HORAS)              */}
          {/* ================================================================ */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-blue" />
                  <span>Evolução do Investimento</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparativo de valor financeiro investido (R$) e horas dedicadas
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span className="font-semibold text-gray-700">Valor Total (R$)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
                  <span className="font-semibold text-gray-700">Horas Técnicas</span>
                </div>
              </div>
            </div>

            {/* Grid de Barras Mensais (em linhas de 6 meses) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2">
              {evolucaoMensal.map((item) => {
                const heightPct = Math.max(15, Math.round((item.valor / maxEvolucaoValor) * 100));
                const isSelected = selectedMonth === item.mes || localMonth === item.mes;

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
                      <span className="text-[10px] font-serif font-bold text-emerald-800 mb-1">
                        R$ {(item.valor / 1000).toFixed(0)}k
                      </span>
                      <div className="w-8 bg-gray-200 rounded-t-lg h-16 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-700 ${
                            isSelected
                              ? 'bg-brand-navy'
                              : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Subtítulo: Horas e Apontamentos */}
                    <div className="pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-500 font-semibold">
                      {item.horas}h • {item.apontamentos} lanç.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* 3. AGRUPAMENTO POR FRENTE E POR UN                               */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Painel por Frente */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                      <Layers size={17} className="text-brand-blue" />
                      <span>Investimento por Frente de Conhecimento</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Distribuição do tempo e valor entre as iniciativas de GC
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {statsPorFrente.map((item) => {
                    const barWidth = (item.valor / maxFrenteValor) * 100;

                    return (
                      <div
                        key={item.frente}
                        className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {item.frente}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-emerald-800">
                              {formatarMoeda(item.valor)}
                            </span>
                            <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                              {item.pctValor.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1.5">
                          <div
                            className="bg-brand-blue h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Tempo: <strong>{formatarMinutos(item.minutos)}</strong></span>
                          <span><strong>{item.colaboradores}</strong> colaboradores ({item.count} apontamentos)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Painel por UN */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                      <Building size={17} className="text-brand-blue" />
                      <span>Investimento por UN</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Práticas jurídicas que mais investem em contribuição técnica
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {statsPorUn.map((item) => {
                    const barWidth = (item.valor / maxUnValor) * 100;

                    return (
                      <div
                        key={item.un}
                        className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {item.un}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-emerald-800">
                              {formatarMoeda(item.valor)}
                            </span>
                            <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                              {item.pctValor.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1.5">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Tempo: <strong>{formatarMinutos(item.minutos)}</strong></span>
                          <span><strong>{item.colaboradores}</strong> colaboradores ({item.count} apontamentos)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* 4. RANKING TOP 15 COLABORADORES COM CRUZAMENTO DE POSIÇÃO        */}
          {/* ================================================================ */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Award size={18} className="text-brand-blue" />
                  <span>Top 15 Colaboradores em Contribuição Técnica</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cruzamento direto com a base de referência cadastral para exibição da posição do colaborador
                </p>
              </div>

              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setRankingMetric('valor')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    rankingMetric === 'valor'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Por Valor (R$)
                </button>
                <button
                  onClick={() => setRankingMetric('tempo')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    rankingMetric === 'tempo'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Por Tempo (Horas)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {top15Colaboradores.map((colab, idx) => {
                const metricValue = rankingMetric === 'valor' ? colab.valor : colab.minutos;
                const barWidth = (metricValue / maxRankingVal) * 100;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={colab.nome}
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
                            {colab.nome}
                          </span>
                        </div>

                        <span className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 px-2 py-0.5 rounded font-medium flex-shrink-0">
                          {colab.posicao}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 mb-2 truncate">
                        {colab.un} • {colab.apontamentos} apontamentos
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">
                          {formatarMinutos(colab.minutos)}
                        </span>
                        <span className="font-bold text-emerald-800 font-serif">
                          {formatarMoeda(colab.valor)}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop3 ? 'bg-emerald-600' : 'bg-slate-600'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================ */}
          {/* 5. TABELA COMPLETA COM CADA APONTAMENTO DETALHADO               */}
          {/* ================================================================ */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            {/* Header da Tabela com Filtros */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-brand-blue" />
                    <span>Apontamentos Técnicos</span>
                    <span className="text-xs font-sans font-normal text-gray-500">
                      ({displayRecords.length} de {monthFiltered.length} registros)
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Shield size={12} className="text-amber-600" />
                    <span>Dados de apontamentos e horas técnicas sujeitos a controle interno</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Filtro por Frente */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500 font-medium">Frente:</span>
                    <select
                      value={selectedFrente}
                      onChange={(e) => setSelectedFrente(e.target.value)}
                      className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[170px]"
                    >
                      <option value="todas">Todas as Frentes</option>
                      {frentesDisponiveis.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Mês (Local, caso o seletor da página seja "Todos os meses") */}
                  {selectedMonth === 'Todos os meses' && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500 font-medium">Mês:</span>
                      <select
                        value={localMonth}
                        onChange={(e) => setLocalMonth(e.target.value)}
                        className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                      >
                        <option value="todos">Todos os meses</option>
                        {MESES_EVOLUCAO.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Busca por Nome ou Frente */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar colaborador, frente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                    />
                  </div>

                  {/* Botão Exportar Excel */}
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                    title="Exportar base detalhada de TS CT para Excel"
                  >
                    <Download size={14} className="text-emerald-600" />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela de Dados */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-200/80 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[200px]">Frente de GC</th>
                    <th className="py-3 px-4 w-28">Mês</th>
                    <th className="py-3 px-4 min-w-[220px]">Colaborador</th>
                    <th className="py-3 px-4 w-36">Posição (Cadastro)</th>
                    <th className="py-3 px-4 w-44">UN (Padronizada)</th>
                    <th className="py-3 px-4 text-center w-32 font-bold text-gray-900">Tempo</th>
                    <th className="py-3 px-4 text-center w-36 font-bold text-emerald-800">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        Nenhum apontamento encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    displayRecords.slice(0, 100).map((item, idx) => {
                      const ref = refColaboradores.get(item.nome.trim().toLowerCase());

                      return (
                        <tr
                          key={`${item.nome}-${item.frente}-${item.mes}-${idx}`}
                          className="hover:bg-blue-50/20 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-gray-400 text-xs">
                            {idx + 1}
                          </td>

                          <td className="py-3 px-4 font-semibold text-gray-900 text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100">
                              {item.frente}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap text-xs">
                            {item.mes}
                          </td>

                          <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                            {item.nome}
                          </td>

                          <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                            {ref ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                                {normalizarPosicao(ref.posicao)}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-gray-700 text-xs whitespace-nowrap">
                            {item.un}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs font-semibold text-gray-800">
                            {formatarMinutos(item.tempoMinutosSeguro)}
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap font-serif font-bold text-emerald-800 text-xs sm:text-sm">
                            {formatarMoeda(item.valorSeguro)}
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
                  Exibindo os primeiros <strong>{Math.min(displayRecords.length, 100)} de {displayRecords.length} lançamentos</strong> filtrados.
                </span>
                <div className="flex items-center gap-4">
                  <span>
                    Tempo total: <strong className="text-brand-navy">{formatarMinutos(totalMinutos)}</strong>
                  </span>
                  <span>
                    Valor total: <strong className="text-emerald-700">{formatarMoeda(totalValor)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ================================================================ */
        /* ABA SECUNDÁRIA: BASE REFERENCIAL DE COLABORADORES (TS-CT.DATA.TS)*/
        /* ================================================================ */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden p-6">
          <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-brand-blue" />
                <span>Base Cadastral Referencial de Colaboradores</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Base institucional para cruzamento de cargos, áreas e posições (392 colaboradores cadastrados)
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-xl font-semibold">
              {tsCtData.length} registros
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Nome Completo</th>
                  <th className="py-2.5 px-3">UN / Área</th>
                  <th className="py-2.5 px-3">Posição</th>
                  <th className="py-2.5 px-3">Data de Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tsCtData.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="py-2 px-3 text-center text-gray-400">{i + 1}</td>
                    <td className="py-2 px-3 font-semibold text-gray-900">{c.nome}</td>
                    <td className="py-2 px-3 text-gray-700">{normalizarUN(c.un)}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100 font-medium">
                        {normalizarPosicao(c.posicao)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 font-mono">{c.entrada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
