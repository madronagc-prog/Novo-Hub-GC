import React, { useMemo, useState } from 'react';
import {
  ScoutRegistro,
  scoutsData
} from '../../data/scouts.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  Compass,
  Building2,
  TrendingUp,
  Award,
  Search,
  Download,
  Calendar,
  Layers,
  Building,
  BarChart3,
  Users,
  Target
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

const MESES_SCOUTS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro'];

interface ScoutsViewProps {
  selectedMonth: string;
}

export default function ScoutsView({ selectedMonth }: ScoutsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUn, setSelectedUn] = useState('todas');

  // Base normalizada com padronização de UN e Mês
  const normalizedData = useMemo(() => {
    return scoutsData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un: d.un ? normalizarUN(d.un) : null
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Setembro)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.cliente.localeCompare(b.cliente);
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
      if (selectedUn === 'sem_un' && d.un !== null) return false;
      if (selectedUn !== 'todas' && selectedUn !== 'sem_un' && d.un !== selectedUn) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          d.cliente.toLowerCase().includes(term) ||
          (d.un && d.un.toLowerCase().includes(term)) ||
          d.mes.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [monthFilteredData, selectedUn, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalScouts = monthFilteredData.length;

  const clientesUnicosSet = useMemo(() => {
    const set = new Set<string>();
    monthFilteredData.forEach((d) => set.add(d.cliente.trim()));
    return set;
  }, [monthFilteredData]);

  const totalClientesUnicos = clientesUnicosSet.size;

  // Evolução Mensal (Janeiro a Setembro)
  const evolucaoMensal = useMemo(() => {
    return MESES_SCOUTS.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const clientesDoMes = new Set(itensDoMes.map((d) => d.cliente)).size;

      return {
        mes: m,
        count: itensDoMes.length,
        clientesUnicos: clientesDoMes
      };
    });
  }, [normalizedData]);

  const maxEvolucaoCount = Math.max(...evolucaoMensal.map((e) => e.count), 1);

  // Ranking Top 10 Clientes Mais Monitorados
  const top10Clientes = useMemo(() => {
    const map: Record<string, { count: number; uns: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      const c = d.cliente.trim();
      if (!map[c]) {
        map[c] = { count: 0, uns: new Set() };
      }
      map[c].count += 1;
      if (d.un) map[c].uns.add(d.un);
    });

    return Object.entries(map)
      .map(([cliente, stats]) => ({
        cliente,
        count: stats.count,
        unsCount: stats.uns.size,
        unsList: Array.from(stats.uns).join(', '),
        percentual: totalScouts > 0 ? (stats.count / totalScouts) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [monthFilteredData, totalScouts]);

  const clienteTop1 = top10Clientes[0] || null;
  const maxClienteCount = top10Clientes[0]?.count || 1;

  // Agrupamento por UN (ignora nulos conforme solicitado, mas mantém na contagem geral)
  const statsPorUn = useMemo(() => {
    const map: Record<string, { count: number; clientes: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      if (!d.un) return; // ignora nulo no agrupamento por UN
      const unName = d.un;
      if (!map[unName]) {
        map[unName] = { count: 0, clientes: new Set() };
      }
      map[unName].count += 1;
      map[unName].clientes.add(d.cliente.trim());
    });

    const totalComUn = Object.values(map).reduce((acc, s) => acc + s.count, 0);

    return Object.entries(map)
      .map(([un, stats]) => ({
        un,
        count: stats.count,
        clientesAtivos: stats.clientes.size,
        percentual: totalComUn > 0 ? (stats.count / totalComUn) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [monthFilteredData]);

  const maxUnCount = statsPorUn[0]?.count || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Cliente / Alvo do Scout': d.cliente,
      'UN de Interesse': d.un ? d.un : 'Sem UN (Temático / Institucional)'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scouts');
    XLSX.writeFile(wb, `Scouts_Monitoramentos_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Scouts */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Compass size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Scouts Realizados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalScouts} {totalScouts === 1 ? 'scout' : 'scouts'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Monitoramentos estratégicos ativos
            </div>
          </div>
        </div>

        {/* Clientes Únicos Monitorados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Clientes Monitorados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {totalClientesUnicos} contas
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Empresas e grupos no radar
            </div>
          </div>
        </div>

        {/* Cliente Mais Monitorado (Top 1) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Conta Mais Monitorada
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5 truncate max-w-[190px]" title={clienteTop1?.cliente}>
              {clienteTop1?.cliente || '—'}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {clienteTop1 ? `${clienteTop1.count} scouts (${clienteTop1.percentual.toFixed(0)}%)` : '—'}
            </div>
          </div>
        </div>

        {/* Média de Scouts / Mês */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Média Mensal
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {Math.round(totalScouts / (selectedMonth === 'Todos os meses' ? 9 : 1))}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              scouts por mês apurado
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (JANEIRO A SETEMBRO)                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução Mensal de Scouts (Janeiro a Setembro de 2026)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Frequência de mapeamento e inteligência comercial setorial
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
              Total acumulado: {normalizedData.length} scouts
            </span>
          </div>
        </div>

        {/* Grid de Barras Mensais (9 Meses) */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.max(15, Math.round((item.count / maxEvolucaoCount) * 100));
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
                    {item.count}
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

                {/* Quantidade de clientes monitorados */}
                <div className="pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-500 font-semibold">
                  {item.clientesUnicos} contas
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING TOP 10 CLIENTES E AGRUPAMENTO POR UN                      */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Top 10 Clientes Mais Monitorados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Award size={17} className="text-brand-blue" />
                  <span>Top 10 Clientes Mais Monitorados</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Contas de maior relevância estratégica e recorrência de notícias
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {top10Clientes.map((item, idx) => {
                const barWidth = (item.count / maxClienteCount) * 100;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={item.cliente}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
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
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {item.cliente}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-brand-navy">
                          {item.count} {item.count === 1 ? 'scout' : 'scouts'}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop3 ? 'bg-brand-blue' : 'bg-slate-600'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>

                    <div className="text-[11px] text-gray-500 truncate">
                      Áreas de interesse: <strong className="text-gray-700">{item.unsList || 'Geral / Temático'}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel 2: Agrupamento por UN (Padronizada) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Building size={17} className="text-brand-blue" />
                  <span>Distribuição por UN Beneficiada</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mapeamentos correlacionados com práticas jurídicas (ignora sem UN)
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorUn.map((item) => {
                const barWidth = (item.count / maxUnCount) * 100;

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
                          {item.count} scouts
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(1)}%
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
                      <span>Contas distintas monitoradas: <strong>{item.clientesAtivos}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM CADA REGISTRO DE SCOUT                        */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Compass size={18} className="text-brand-blue" />
                <span>Base Individual de Monitoramentos de Scouts</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {monthFilteredData.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Oportunidades de negócios e pautas setoriais rastreadas pelo escritório
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
                  <option value="sem_un">Sem UN (Temático / Institucional)</option>
                  {unOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca por Cliente */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa de scouts para Excel"
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
                <th className="py-3 px-4 min-w-[260px]">Cliente / Alvo do Scout</th>
                <th className="py-3 px-4 w-60">UN de Interesse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Nenhum scout encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  return (
                    <tr
                      key={`${item.cliente}-${item.mes}-${idx}`}
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

                      {/* Cliente */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.cliente}
                      </td>

                      {/* UN */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {item.un ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                            {item.un}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-medium text-[11px]">
                            Sem UN (Temático / Setorial)
                          </span>
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
              Exibindo <strong>{displayRecords.length} monitoramentos</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Clientes únicos no filtro: <strong className="text-brand-navy">{new Set(displayRecords.map(d => d.cliente.trim())).size}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
