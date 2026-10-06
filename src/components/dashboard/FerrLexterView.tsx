import React, { useMemo, useState } from 'react';
import {
  LexterRegistro,
  ferrLexterData
} from '../../data/ferr-lexter.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  Bot,
  FileText,
  MessageSquare,
  Users,
  Search,
  Download,
  Award,
  BarChart3,
  Calendar,
  Layers,
  Shield,
  Activity,
  Filter,
  TrendingUp,
  Zap,
  Building
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

const MESES_LEXTER = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface FerrLexterViewProps {
  selectedMonth: string;
  selectedUn: string;
}

export default function FerrLexterView({ selectedMonth, selectedUn }: FerrLexterViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada com padronização de UN e Mês
  const normalizedData = useMemo(() => {
    return ferrLexterData.map((d) => ({
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
      return b.documentos - a.documentos;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtros combinados da tabela (busca + UN)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedUn !== 'Todas as UNs' && d.un !== selectedUn) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.usuario.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedUn, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const somaDocumentos = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.documentos, 0),
    [monthFilteredData]
  );

  const somaRespostas = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.respostas, 0),
    [monthFilteredData]
  );

  const usuariosUnicosSet = useMemo(() => {
    const set = new Set<string>();
    monthFilteredData.forEach((d) => {
      if (d.documentos > 0 || d.respostas > 0) {
        set.add(d.usuario);
      }
    });
    return set;
  }, [monthFilteredData]);

  const totalUsuariosUnicos = usuariosUnicosSet.size;

  const mediaRespostasPorDoc = somaDocumentos > 0 ? (somaRespostas / somaDocumentos).toFixed(1) : '0';

  // Evolução Mensal (Janeiro a Agosto) - Base Consolidada Global
  const evolucaoMensal = useMemo(() => {
    return MESES_LEXTER.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const totalDocs = itensDoMes.reduce((acc, d) => acc + d.documentos, 0);
      const totalResp = itensDoMes.reduce((acc, d) => acc + d.respostas, 0);
      const ativosCount = new Set(itensDoMes.filter((d) => d.documentos > 0 || d.respostas > 0).map((d) => d.usuario)).size;

      return {
        mes: m,
        totalDocs,
        totalResp,
        ativosCount
      };
    });
  }, [normalizedData]);

  // Agrupamento por UN (no período filtrado)
  const statsPorUn = useMemo(() => {
    const map: Record<string, { docs: number; respostas: number; users: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      const unName = d.un || 'Não informada';
      if (!map[unName]) {
        map[unName] = { docs: 0, respostas: 0, users: new Set() };
      }
      map[unName].docs += d.documentos;
      map[unName].respostas += d.respostas;
      if (d.documentos > 0 || d.respostas > 0) {
        map[unName].users.add(d.usuario);
      }
    });

    return Object.entries(map)
      .map(([un, data]) => ({
        un,
        docs: data.docs,
        respostas: data.respostas,
        usuariosAtivos: data.users.size,
        percentualDocs: somaDocumentos > 0 ? (data.docs / somaDocumentos) * 100 : 0
      }))
      .sort((a, b) => b.docs - a.docs);
  }, [monthFilteredData, somaDocumentos]);

  // Ranking Top 10 Usuários por Documentos Processados (no período filtrado)
  const topUsuarios = useMemo(() => {
    const map: Record<string, { docs: number; respostas: number; un: string }> = {};

    monthFilteredData.forEach((d) => {
      if (!map[d.usuario]) {
        map[d.usuario] = { docs: 0, respostas: 0, un: d.un };
      }
      map[d.usuario].docs += d.documentos;
      map[d.usuario].respostas += d.respostas;
    });

    return Object.entries(map)
      .map(([usuario, stats]) => ({
        usuario,
        docs: stats.docs,
        respostas: stats.respostas,
        un: stats.un
      }))
      .filter((u) => u.docs > 0 || u.respostas > 0)
      .sort((a, b) => b.docs - a.docs)
      .slice(0, 10);
  }, [monthFilteredData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Colaborador / Usuário': d.usuario,
      'UN': d.un,
      'Mês': d.mes,
      'Documentos Processados': d.documentos,
      'Respostas Geradas': d.respostas
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Uso Lexter');
    XLSX.writeFile(wb, `Uso_Lexter_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  const maxEvolucaoDocs = Math.max(...evolucaoMensal.map((e) => e.totalDocs), 1);
  const maxTopDocs = topUsuarios[0]?.docs || 1;
  const maxUnDocs = statsPorUn[0]?.docs || 1;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Documentos Processados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Documentos Processados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {somaDocumentos.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Leituras e análises na Lexter
            </div>
          </div>
        </div>

        {/* Respostas Geradas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Respostas Geradas (IA)
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {somaRespostas.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Insights e sínteses analíticas
            </div>
          </div>
        </div>

        {/* Usuários Únicos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Usuários Únicos
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalUsuariosUnicos} colaboradores
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Com atividade no período
            </div>
          </div>
        </div>

        {/* Média de Respostas / Doc */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Profundidade Média
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {mediaRespostasPorDoc}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              respostas por documento analisado
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
              <span>Evolução do Uso</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Volume total somado de documentos processados e respostas geradas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
              Total acumulado: {evolucaoMensal.reduce((a, b) => a + b.totalDocs, 0).toLocaleString('pt-BR')} docs / {evolucaoMensal.reduce((a, b) => a + b.totalResp, 0).toLocaleString('pt-BR')} respostas
            </span>
          </div>
        </div>

{/* Grid de Barras Mensais (em linhas de 6 meses) */}
<div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-3">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.round((item.totalDocs / maxEvolucaoDocs) * 100);
            const isCurrentMonth = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-3 flex flex-col justify-between text-center transition-all ${
                  isCurrentMonth
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.mes}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {item.ativosCount} usuários
                  </div>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-3 flex flex-col items-center justify-end h-28">
                  <span className="text-xs font-serif font-bold text-gray-900 mb-1.5 truncate max-w-full">
                    {item.totalDocs.toLocaleString('pt-BR')}
                  </span>
                  <div className="w-9 bg-gray-200 rounded-t-lg h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        isCurrentMonth
                          ? 'bg-brand-navy'
                          : 'bg-gradient-to-t from-brand-navy to-brand-blue'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Subtítulo do Card */}
                <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500">
                  <div>Resp: <strong>{item.totalResp >= 1000 ? `${(item.totalResp / 1000).toFixed(1)}k` : item.totalResp}</strong></div>
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
                  <span>Uso por UN</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorUn.map((item) => {
                const barWidth = (item.docs / maxUnDocs) * 100;

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
                        <span className="font-bold text-gray-900">
                          {item.docs.toLocaleString('pt-BR')} docs
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentualDocs.toFixed(1)}%
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
                      <span>Respostas: <strong>{item.respostas.toLocaleString('pt-BR')}</strong></span>
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
                  <span>Top 10 Usuários por Documentos</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Colaboradores com mais análises realizadas em {selectedMonth}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {topUsuarios.map((u, idx) => {
                const barWidth = (u.docs / maxTopDocs) * 100;
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
                            {u.un}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">
                          {u.docs.toLocaleString('pt-BR')} docs
                        </div>
                        <div className="text-[10px] text-purple-700 font-medium">
                          {u.respostas.toLocaleString('pt-BR')} respostas
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop3 ? 'bg-brand-blue' : 'bg-slate-600'
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
                <Bot size={18} className="text-brand-blue" />
                <span>Uso da Lexter</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-600" />
                <span>Uso interno protegido pelo controle de acesso corporativo</span>
              </p>
            </div>

                   <div className="flex items-center gap-2.5 flex-wrap">

              {/* Busca por Nome */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa filtrada para Excel"
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
                <th className="py-3 px-4 min-w-[220px]">Colaborador</th>
                <th className="py-3 px-4 w-44">UN (Padronizada)</th>
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4 text-center w-36 font-bold">Documentos</th>
                <th className="py-3 px-4 text-center w-36">Respostas</th>
                <th className="py-3 px-4 text-center w-32">Média Resp/Doc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const media = item.documentos > 0 ? (item.respostas / item.documentos).toFixed(1) : '0';
                  const isZerado = item.documentos === 0 && item.respostas === 0;

                  return (
                    <tr
                      key={`${item.usuario}-${item.mes}-${idx}`}
                      className={`hover:bg-blue-50/20 transition-colors ${
                        isZerado ? 'opacity-40 bg-gray-50/20' : ''
                      }`}
                    >
                      {/* Numeração */}
                      <td className="py-3 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Usuário */}
                      <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.usuario}
                      </td>

                      {/* UN */}
                      <td className="py-3 px-4 text-gray-700 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                          {item.un}
                        </span>
                      </td>

                      {/* Mês */}
                      <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Documentos */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-serif font-bold text-gray-900">
                        {item.documentos > 0 ? (
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {item.documentos.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">0</span>
                        )}
                      </td>

                      {/* Respostas */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs font-semibold text-purple-700">
                        {item.respostas > 0 ? item.respostas.toLocaleString('pt-BR') : '0'}
                      </td>

                      {/* Média */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs text-gray-500">
                        {media}
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
                Total docs no filtro: <strong className="text-brand-navy">{somaDocumentos.toLocaleString('pt-BR')}</strong>
              </span>
              <span>
                Total respostas: <strong className="text-purple-700">{somaRespostas.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
