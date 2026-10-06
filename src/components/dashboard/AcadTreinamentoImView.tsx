import React, { useMemo, useState } from 'react';
import {
  TreinamentoIMRegistro,
  acadTreinamentoIMData
} from '../../data/acad-treinamento-im.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  TrendingUp,
  Download,
  Search,
  CheckCircle2,
  Clock,
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

const MESES_TREINAMENTO = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

interface AcadTreinamentoImViewProps {
  selectedMonth: string;
  selectedUn: string;
}

// Observação: a base de Treinamento iM não tem campo de UN (é uma contagem
// geral de participantes/convidados). selectedUn é recebido para manter o
// padrão das demais sub-abas, mas não é aplicado como filtro aqui.
export default function AcadTreinamentoImView({ selectedMonth }: AcadTreinamentoImViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada com padronização de mês
  const normalizedData = useMemo(() => {
    return acadTreinamentoIMData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica (Janeiro a Setembro)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtro de busca textual na tabela
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return d.mes.toLowerCase().includes(term);
    });
  }, [monthFilteredData, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalSessoes = monthFilteredData.length;

  const totalParticipantes = useMemo(() => {
    return monthFilteredData.reduce((acc, d) => {
      if (d.participantes === null) return acc;
      return acc + d.participantes;
    }, 0);
  }, [monthFilteredData]);

  const totalConvidados = useMemo(() => {
    return monthFilteredData.reduce((acc, d) => acc + d.convidados, 0);
  }, [monthFilteredData]);

  // Taxa de Adesão Média (apenas para registros onde participantes não é nulo e convidados > 0)
  const taxaAdesaoGeral = useMemo(() => {
    const registrosValidos = monthFilteredData.filter((d) => d.participantes !== null && d.convidados > 0);
    const somaPart = registrosValidos.reduce((acc, d) => acc + (d.participantes || 0), 0);
    const somaConv = registrosValidos.reduce((acc, d) => acc + d.convidados, 0);
    if (somaConv === 0) return 0;
    return (somaPart / somaConv) * 100;
  }, [monthFilteredData]);

  // Evolução Mensal Agregada (Janeiro a Setembro) - soma múltiplos treinamentos no mesmo mês
  const evolucaoMensal = useMemo(() => {
    return MESES_TREINAMENTO.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const sessoesCount = itensDoMes.length;

      const hasNull = itensDoMes.some((d) => d.participantes === null);
      const totalPart = itensDoMes.reduce((acc, d) => acc + (d.participantes || 0), 0);
      const totalConv = itensDoMes.reduce((acc, d) => acc + d.convidados, 0);

      return {
        mes: m,
        sessoesCount,
        participantes: hasNull && totalPart === 0 ? null : totalPart,
        convidados: totalConv,
        isPendente: hasNull && totalPart === 0
      };
    });
  }, [normalizedData]);

  const maxConvidados = Math.max(...evolucaoMensal.map((e) => e.convidados), 1);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Sessão': `Treinamento iM #${index + 1}`,
      'Participantes Presentes': d.participantes !== null ? d.participantes : 'Sem dados',
      'Convidados Convocados': d.convidados,
      'Taxa de Adesão (%)':
        d.participantes !== null && d.convidados > 0
          ? `${((d.participantes / d.convidados) * 100).toFixed(1)}%`
          : d.participantes === null
          ? 'Sem dados'
          : '—'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Treinamentos iM');
    XLSX.writeFile(wb, `Treinamentos_iM_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Participantes */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <UserCheck size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Participantes
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalParticipantes} colaboradores
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Presentes nas capacitações do iM
            </div>
          </div>
        </div>

        {/* Total de Convidados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Convidados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalConvidados} convocações
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Colaboradores convidados aos workshops
            </div>
          </div>
        </div>

        {/* Sessões Realizadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Sessões Realizadas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {totalSessoes} {totalSessoes === 1 ? 'sessão' : 'sessões'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Turmas e workshops ministrados
            </div>
          </div>
        </div>

        {/* Taxa de Adesão Média */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Taxa de Adesão Média
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {taxaAdesaoGeral.toFixed(1).replace('.', ',')}%
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Participantes / convidados apurados
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (PARTICIPANTES VS CONVIDADOS)          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Participantes vs. Convidados</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Valores consolidados por mês somando todas as sessões e turmas realizadas
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="font-semibold text-gray-700">Participantes Presentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="font-semibold text-gray-700">Convidados Convocados</span>
            </div>
          </div>
        </div>

        {/* Grid de Barras Mensais (em linhas de 6 meses) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2">
          {evolucaoMensal.map((item) => {
            const isSelected = selectedMonth === item.mes;
            const heightConvPct = Math.max(15, Math.round((item.convidados / maxConvidados) * 100));
            const heightPartPct = item.participantes !== null
              ? Math.max(10, Math.round((item.participantes / maxConvidados) * 100))
              : 0;

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

                {/* Colunas Duplas do Gráfico */}
                <div className="my-2 flex items-end justify-center gap-1.5 h-28 pb-1">
                  {/* Coluna Convidados */}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono font-semibold text-blue-700 mb-0.5">
                      {item.convidados}
                    </span>
                    <div className="w-4 bg-gray-200 rounded-t-sm h-20 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-blue-500 rounded-t-sm transition-all duration-700"
                        style={{ height: `${heightConvPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Coluna Participantes */}
                  <div className="flex flex-col items-center">
                    {item.participantes !== null ? (
                      <>
                        <span className="text-[9px] font-mono font-bold text-emerald-800 mb-0.5">
                          {item.participantes}
                        </span>
                        <div className="w-4 bg-gray-200 rounded-t-sm h-20 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-emerald-600 rounded-t-sm transition-all duration-700"
                            style={{ height: `${heightPartPct}%` }}
                          ></div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-end h-20">
                        <span className="text-[8px] text-gray-400 italic bg-gray-100 px-1 py-0.5 rounded border border-gray-200/70">
                          Sem dados
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtítulo: Sessões no mês */}
                <div className="pt-1.5 border-t border-gray-200/60 text-[10px] text-gray-500 font-semibold">
                  {item.sessoesCount} {item.sessoesCount === 1 ? 'sessão' : 'sessões'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA SESSÃO INDIVIDUAL (13 REGISTROS)         */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap size={18} className="text-brand-blue" />
                <span>Sessões de Treinamento iM</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {normalizedData.length} sessões)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Relação sessão por sessão sem agregação, demonstrando cada turma de capacitação
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Mês */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar mês..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa de treinamentos iM para Excel"
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
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4 w-32">Mês</th>
                <th className="py-2.5 px-4 min-w-[200px]">Identificação da Sessão</th>
                <th className="py-2.5 px-4 text-center w-40 font-bold text-emerald-800">Participantes Presentes</th>
                <th className="py-2.5 px-4 text-center w-40 font-bold text-blue-900">Convidados Convocados</th>
                <th className="py-2.5 px-4 text-center w-36">Taxa de Adesão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhuma sessão encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const hasData = item.participantes !== null;
                  const taxaAdesao = hasData && item.convidados > 0
                    ? ((item.participantes! / item.convidados) * 100).toFixed(1)
                    : null;

                  return (
                    <tr
                      key={`${item.mes}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors h-[44px]"
                    >
                      {/* Numeração */}
                      <td className="py-2.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Mês */}
                      <td className="py-2.5 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold">
                          {item.mes}
                        </span>
                      </td>

                      {/* Sessão */}
                      <td className="py-2.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                          <span>Treinamento e Capacitação iM (Turma {idx + 1})</span>
                        </span>
                      </td>

                      {/* Participantes */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {hasData ? (
                          <span className="font-serif font-bold text-emerald-700 text-sm bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                            {item.participantes} {item.participantes === 1 ? 'participante' : 'participantes'}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-800 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Sem dados
                          </span>
                        )}
                      </td>

                      {/* Convidados */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span className="font-serif font-bold text-blue-900 text-sm bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {item.convidados} {item.convidados === 1 ? 'convidado' : 'convidados'}
                        </span>
                      </td>

                      {/* Taxa de Adesão */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {taxaAdesao !== null ? (
                          <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded font-mono">
                            {taxaAdesao}%
                          </span>
                        ) : hasData && item.convidados === 0 ? (
                          <span className="text-xs text-gray-400 font-medium">100% (espontâneo)</span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
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
              Exibindo <strong>{displayRecords.length} sessões individuais</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Total presentes apurados: <strong className="text-emerald-700">{totalParticipantes}</strong>
              </span>
              <span>
                Total convocados: <strong className="text-blue-900">{totalConvidados}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
