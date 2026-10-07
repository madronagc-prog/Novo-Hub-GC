import React, { useMemo, useState } from 'react';
import {
  PortDataRegistro,
  ferrPortDataData
} from '../../data/ferr-portdata.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  Database,
  DollarSign,
  Search,
  Download,
  Users,
  Award,
  BarChart3,
  Calendar,
  Building,
  TrendingUp,
  Shield,
  Briefcase,
  FileSpreadsheet,
  PieChart,
  Layers
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

const MESES_PORTDATA = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Helper para formatar moeda brasileira
function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface FerrPortDataViewProps {
  selectedMonth: string;
  selectedUn: string;
}

export default function FerrPortDataView({ selectedMonth, selectedUn }: FerrPortDataViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada com padronização de UN e Mês
  const normalizedData = useMemo(() => {
    return ferrPortDataData.map((d) => ({
      ...d,
      un: normalizarUN(d.un),
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Setembro)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.valor - a.valor;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtro de UN (do seletor superior da página) - aplicado sobre o período já filtrado por mês
  const filteredData = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return monthFilteredData;
    return monthFilteredData.filter((d) => d.un === selectedUn);
  }, [monthFilteredData, selectedUn]);

  // Mesma base de UN, mas sem o filtro de mês (para o gráfico de evolução, que mostra todos os meses)
  const unFilteredAllMonths = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return normalizedData;
    return normalizedData.filter((d) => d.un === selectedUn);
  }, [normalizedData, selectedUn]);

  // Filtro de busca textual da tabela (mês e UN já vêm de filteredData)
  const displayRecords = useMemo(() => {
    return filteredData.filter((d) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.usuario.toLowerCase().includes(term) ||
          d.cliente_caso.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [filteredData, searchTerm]);

  // Totais do Resumo (no período e UN filtrados)
  const totalConsultas = filteredData.length;

  const totalValor = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.valor, 0),
    [filteredData]
  );

  const usuariosUnicosSet = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach((d) => set.add(d.usuario));
    return set;
  }, [filteredData]);

  const totalUsuariosUnicos = usuariosUnicosSet.size;

  const ticketMedio = totalConsultas > 0 ? totalValor / totalConsultas : 0;

  // Evolução Mensal (Janeiro a Dezembro; respeita o filtro de UN)
  const evolucaoMensal = useMemo(() => {
    return MESES_PORTDATA.map((m) => {
      const itensDoMes = unFilteredAllMonths.filter((d) => d.mes === m);
      const valorTotalMes = itensDoMes.reduce((acc, d) => acc + d.valor, 0);
      const consultasCount = itensDoMes.length;
      const usuariosCount = new Set(itensDoMes.map((d) => d.usuario)).size;

      return {
        mes: m,
        valorTotal: valorTotalMes,
        consultasCount,
        usuariosCount
      };
    });
  }, [unFilteredAllMonths]);

  const maxEvolucaoValor = Math.max(...evolucaoMensal.map((e) => e.valorTotal), 1);

  // Agrupamento por UN (no período filtrado)
  const statsPorUn = useMemo(() => {
    const map: Record<string, { valor: number; consultas: number; users: Set<string> }> = {};

    filteredData.forEach((d) => {
      const unName = d.un || 'Não informada';
      if (!map[unName]) {
        map[unName] = { valor: 0, consultas: 0, users: new Set() };
      }
      map[unName].valor += d.valor;
      map[unName].consultas += 1;
      map[unName].users.add(d.usuario);
    });

    return Object.entries(map)
      .map(([un, data]) => ({
        un,
        valor: data.valor,
        consultas: data.consultas,
        usuariosAtivos: data.users.size,
        percentual: totalValor > 0 ? (data.valor / totalValor) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredData, totalValor]);

  const maxUnValor = statsPorUn[0]?.valor || 1;

  // Ranking Top 10 Usuários por Valor Consumido (no período filtrado)
  const topUsuarios = useMemo(() => {
    const map: Record<string, { valor: number; consultas: number; un: string }> = {};

    filteredData.forEach((d) => {
      if (!map[d.usuario]) {
        map[d.usuario] = { valor: 0, consultas: 0, un: d.un };
      }
      map[d.usuario].valor += d.valor;
      map[d.usuario].consultas += 1;
    });

    return Object.entries(map)
      .map(([usuario, stats]) => ({
        usuario,
        valor: stats.valor,
        consultas: stats.consultas,
        un: stats.un
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [filteredData]);

  const maxTopValor = topUsuarios[0]?.valor || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Usuário / Colaborador': d.usuario,
      'UN': d.un,
      'Cliente / Caso': d.cliente_caso || '—',
      'Valor (R$)': d.valor
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PortData');
    XLSX.writeFile(wb, `PortData_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total Gasto */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Investimento em Consultas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {formatCurrency(totalValor)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Consumo acumulado em {selectedMonth}
            </div>
          </div>
        </div>

        {/* Consultas Realizadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Database size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Consultas Realizadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalConsultas} {totalConsultas === 1 ? 'pesquisa' : 'pesquisas'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Pesquisas cartorárias e societárias
            </div>
          </div>
        </div>

        {/* Usuários Únicos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Usuários Solicitantes
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {totalUsuariosUnicos} colaboradores
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Com consumo registrado no período
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Custo Médio / Consulta
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {formatCurrency(ticketMedio)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Ticket médio por certidão/relatório
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
              <span>Evolução Mensal do Gasto</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Valores faturados em consultas de suporte às operações jurídicas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl font-semibold">
              Total acumulado: {formatCurrency(evolucaoMensal.reduce((a, b) => a + b.valorTotal, 0))}
            </span>
          </div>
        </div>

        {/* Grid de Barras Mensais (9 Meses) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.max(15, Math.round((item.valorTotal / maxEvolucaoValor) * 100));
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
                  <span className="text-[11px] font-serif font-bold text-gray-900 mb-1 truncate max-w-full">
                    R$ {(item.valorTotal / 1000).toFixed(1)}k
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

                {/* Quantidade de consultas */}
                <div className="pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-500 font-semibold">
                  {item.consultasCount} {item.consultasCount === 1 ? 'cons.' : 'cons.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING DE UNs E TOP 10 USUÁRIOS                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Adoção por UN */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Building size={17} className="text-brand-blue" />
                  <span>Consumo por UN</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Consolidação com normalizarUN() (ex.: Corporativo vs Corporativa)
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
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
                          {formatCurrency(item.valor)}
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
                      <span>Consultas: <strong>{item.consultas}</strong></span>
                      <span>Colaboradores: <strong>{item.usuariosAtivos}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel 2: Ranking Top 10 Usuários */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Award size={17} className="text-brand-blue" />
                  <span>Top 10 Usuários por Consumo</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Colaboradores com maior volume financeiro consumido no PortData
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {topUsuarios.map((u, idx) => {
                const barWidth = (u.valor / maxTopValor) * 100;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={u.usuario}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
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
                        <div className="truncate">
                          <span className="font-semibold text-gray-900 text-xs sm:text-sm block truncate">
                            {u.usuario}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {u.un} • {u.consultas} {u.consultas === 1 ? 'consulta' : 'consultas'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-emerald-800 text-xs sm:text-sm">
                          {formatCurrency(u.valor)}
                        </div>
                      </div>
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
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM CADA REGISTRO                                 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Database size={18} className="text-brand-blue" />
                <span>Consultas na PortData</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-600" />
                <span>Dados de consumo interno protegidos pelo controle corporativo</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Usuário ou Cliente/Caso */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário, caso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa do PortData para Excel"
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
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4 min-w-[200px]">Colaborador / Usuário</th>
                <th className="py-3 px-4 w-44">UN (Padronizada)</th>
                <th className="py-3 px-4 w-36">Cliente / Caso</th>
                <th className="py-3 px-4 text-center w-36 font-bold">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  return (
                    <tr
                      key={`${item.usuario}-${item.cliente_caso}-${item.mes}-${idx}`}
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

                      {/* Usuário */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.usuario}
                      </td>

                      {/* UN */}
                      <td className="py-3.5 px-4 text-gray-700 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                          {item.un}
                        </span>
                      </td>

                      {/* Cliente / Caso */}
                      <td className="py-3.5 px-4 font-mono text-gray-800 text-xs whitespace-nowrap">
                        {item.cliente_caso ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100 font-medium">
                            {item.cliente_caso}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Não informado</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-emerald-800">
                        {formatCurrency(item.valor)}
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
              Exibindo <strong>{displayRecords.length} consultas</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Valor total filtrado: <strong className="text-emerald-700">{formatCurrency(totalValor)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
