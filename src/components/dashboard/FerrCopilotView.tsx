import React, { useMemo, useState } from 'react';
import {
  CopilotRegistro,
  ferrCopilotData
} from '../../data/ferr-copilot.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Cpu,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Download,
  Award,
  Sparkles,
  BarChart3,
  Shield,
  Activity,
  Zap,
  Globe,
  Briefcase
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

const MESES_COPILOT = ['Abril', 'Maio', 'Junho', 'Julho', 'Agosto'];

interface FerrCopilotViewProps {
  selectedMonth: string;
}

export default function FerrCopilotView({ selectedMonth }: FerrCopilotViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'prompts' | 'dias' | 'nome'>('prompts');

  // Base normalizada com padronização de mês
  const normalizedData = useMemo(() => {
    return ferrCopilotData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Abril a Agosto)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtro de busca por nome
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (!searchTerm.trim()) return true;
      return d.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [monthFilteredData, searchTerm]);

  // Totais do Resumo (considerando o período filtrado)
  const somaPromptsTodosApps = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.prompts_todos_apps, 0),
    [monthFilteredData]
  );

  const somaPromptsWork = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.prompts_work, 0),
    [monthFilteredData]
  );

  const somaPromptsWeb = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.prompts_web, 0),
    [monthFilteredData]
  );

  const somaDiasAtividade = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.dias_atividade, 0),
    [monthFilteredData]
  );

  // Usuários únicos ativos (com pelo menos 1 prompt no período filtrado)
  const usuariosAtivosSet = useMemo(() => {
    const set = new Set<string>();
    monthFilteredData.forEach((d) => {
      if (d.prompts_todos_apps > 0) {
        set.add(d.nome);
      }
    });
    return set;
  }, [monthFilteredData]);

  const totalUsuariosAtivos = usuariosAtivosSet.size;

  // Evolução Mensal (Abril a Agosto) - Base consolidada global
  const evolucaoMensal = useMemo(() => {
    return MESES_COPILOT.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const totalPrompts = itensDoMes.reduce((acc, d) => acc + d.prompts_todos_apps, 0);
      const totalWork = itensDoMes.reduce((acc, d) => acc + d.prompts_work, 0);
      const totalWeb = itensDoMes.reduce((acc, d) => acc + d.prompts_web, 0);
      const totalDias = itensDoMes.reduce((acc, d) => acc + d.dias_atividade, 0);
      const ativosCount = new Set(itensDoMes.filter((d) => d.prompts_todos_apps > 0).map((d) => d.nome)).size;

      return {
        mes: m,
        totalPrompts,
        totalWork,
        totalWeb,
        totalDias,
        ativosCount
      };
    });
  }, [normalizedData]);

  // Ranking Top 10 Usuários no Período Selecionado
  const topUsuarios = useMemo(() => {
    const map: Record<string, { prompts: number; work: number; web: number; dias: number }> = {};

    monthFilteredData.forEach((d) => {
      if (!map[d.nome]) {
        map[d.nome] = { prompts: 0, work: 0, web: 0, dias: 0 };
      }
      map[d.nome].prompts += d.prompts_todos_apps;
      map[d.nome].work += d.prompts_work;
      map[d.nome].web += d.prompts_web;
      map[d.nome].dias += d.dias_atividade;
    });

    return Object.entries(map)
      .map(([nome, stats]) => ({
        nome,
        prompts: stats.prompts,
        work: stats.work,
        web: stats.web,
        dias: stats.dias
      }))
      .filter((u) => u.prompts > 0)
      .sort((a, b) => b.prompts - a.prompts)
      .slice(0, 10);
  }, [monthFilteredData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Colaborador': d.nome,
      'Mês': d.mes,
      'Prompts (Todos os Apps)': d.prompts_todos_apps,
      'Prompts (Work)': d.prompts_work,
      'Prompts (Web)': d.prompts_web,
      'Dias de Atividade': d.dias_atividade
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Uso Copilot');
    XLSX.writeFile(wb, `Uso_Copilot_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  const maxEvolucaoPrompts = Math.max(...evolucaoMensal.map((e) => e.totalPrompts), 1);
  const maxTopPrompts = topUsuarios[0]?.prompts || 1;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Prompts */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Zap size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Prompts
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {somaPromptsTodosApps.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {somaPromptsWork.toLocaleString('pt-BR')} work / {somaPromptsWeb.toLocaleString('pt-BR')} web
            </div>
          </div>
        </div>

        {/* Usuários Ativos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Usuários Únicos Ativos
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalUsuariosAtivos} colaboradores
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Com ≥ 1 prompt no período
            </div>
          </div>
        </div>

        {/* Dias de Atividade */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Dias de Atividade
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {somaDiasAtividade.toLocaleString('pt-BR')} dias
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Engajamento somado dos usuários
            </div>
          </div>
        </div>

        {/* Média de Prompts / Dia Ativo */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Média de Intensidade
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {somaDiasAtividade > 0 ? (somaPromptsTodosApps / somaDiasAtividade).toFixed(1) : '0'}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              prompts por dia ativo de uso
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (ABRIL A AGOSTO)                       */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução de Interações</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Volume total somado de interações no Microsoft Copilot entre todos os colaboradores
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-blue-50 text-brand-blue border border-blue-100 px-2.5 py-1 rounded-full font-semibold">
              Consolidado de IA Corporativa
            </span>
          </div>
        </div>

        {/* Cards das 5 Barras Mensais */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.round((item.totalPrompts / maxEvolucaoPrompts) * 100);
            const isCurrentMonth = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-4 flex flex-col justify-between text-center transition-all ${
                  isCurrentMonth
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.mes}
                  </span>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {item.ativosCount} usuários ativos
                  </div>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-4 flex flex-col items-center justify-end h-32">
                  <span className="text-sm font-serif font-bold text-gray-900 mb-2">
                    {item.totalPrompts.toLocaleString('pt-BR')}
                  </span>
                  <div className="w-12 bg-gray-200 rounded-t-xl h-24 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ${
                        isCurrentMonth
                          ? 'bg-brand-navy'
                          : 'bg-gradient-to-t from-brand-navy to-brand-blue'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Subtítulo do Card */}
                <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-500">
                  <div>Work: <strong>{item.totalWork.toLocaleString('pt-BR')}</strong></div>
                  <div>Web: <strong>{item.totalWeb.toLocaleString('pt-BR')}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING TOP 10 USUÁRIOS POR PROMPTS                               */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Award size={18} className="text-brand-blue" />
              <span>Top 10 Usuários por Volume de Interações</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Colaboradores com maior adoção de Inteligência Artificial generativa no período de{' '}
              <strong>{selectedMonth}</strong>
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl font-semibold self-start sm:self-auto">
            Campeões de Adoção
          </span>
        </div>

        {topUsuarios.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            Nenhum prompt registrado para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {topUsuarios.map((u, idx) => {
              const barWidth = (u.prompts / maxTopPrompts) * 100;
              const isTop3 = idx < 3;

              return (
                <div
                  key={u.nome}
                  className="bg-gray-50/70 hover:bg-gray-100/70 p-3.5 rounded-xl border border-gray-200/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-white shadow-2xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                        {u.nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] text-gray-500 hidden sm:inline">
                        {u.dias} dias ativos
                      </span>
                      <span className="font-bold text-gray-900 text-sm">
                        {u.prompts.toLocaleString('pt-BR')} interações
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200/80 rounded-full h-2.5 overflow-hidden">
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
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM CADA REGISTRO DE USO                          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Cpu size={18} className="text-brand-blue" />
                <span>Uso do Copilot</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {monthFilteredData.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-600" />
                <span>Uso interno estritamente restrito à gestão de conhecimento & diretoria</span>
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
                title="Exportar dados para Excel"
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
                <th className="py-3 px-4 min-w-[200px]">Colaborador</th>
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4 text-center w-36">Prompts (Total)</th>
                <th className="py-3 px-4 text-center w-32">Prompts (Work)</th>
                <th className="py-3 px-4 text-center w-32">Prompts (Web)</th>
                <th className="py-3 px-4 text-center w-36">Dias de Atividade</th>
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
                  const isZerado = item.prompts_todos_apps === 0;

                  return (
                    <tr
                      key={`${item.nome}-${item.mes}-${idx}`}
                      className={`hover:bg-blue-50/20 transition-colors ${
                        isZerado ? 'opacity-50 bg-gray-50/20' : ''
                      }`}
                    >
                      {/* Numeração */}
                      <td className="py-3 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Nome */}
                      <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.nome}
                      </td>

                      {/* Mês */}
                      <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Prompts Todos os Apps */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-serif font-bold text-gray-900">
                        {item.prompts_todos_apps > 0 ? (
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {item.prompts_todos_apps.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-sans font-normal">0</span>
                        )}
                      </td>

                      {/* Prompts Work */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs">
                        {item.prompts_work > 0 ? (
                          item.prompts_work.toLocaleString('pt-BR')
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>

                      {/* Prompts Web */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs">
                        {item.prompts_web > 0 ? (
                          item.prompts_web.toLocaleString('pt-BR')
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>

                      {/* Dias de Atividade */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-xs text-gray-700">
                        {item.dias_atividade > 0 ? (
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                            {item.dias_atividade} {item.dias_atividade === 1 ? 'dia' : 'dias'}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
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
              Exibindo <strong>{displayRecords.length} registros</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Total de prompts filtrados: <strong className="text-brand-navy">{somaPromptsTodosApps.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
