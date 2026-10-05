import React, { useMemo, useState } from 'react';
import {
  MailingRegistro,
  emailMailingData
} from '../../data/email-mailing.data';
import { normalizarUN } from '../../utils/padronizacao';
import {
  Mail,
  TrendingUp,
  Users,
  Search,
  Download,
  Award,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MESES_COLUNAS: { key: keyof Omit<MailingRegistro, 'area'>; label: string }[] = [
  { key: 'janeiro', label: 'Janeiro' },
  { key: 'fevereiro', label: 'Fevereiro' },
  { key: 'marco', label: 'Março' },
  { key: 'abril', label: 'Abril' },
  { key: 'maio', label: 'Maio' },
  { key: 'junho', label: 'Junho' },
  { key: 'julho', label: 'Julho' },
  { key: 'agosto', label: 'Agosto' },
  { key: 'setembro', label: 'Setembro' },
  { key: 'outubro', label: 'Outubro' },
  { key: 'novembro', label: 'Novembro' },
  { key: 'dezembro', label: 'Dezembro' }
];

const MES_PROP_MAP: Record<string, keyof Omit<MailingRegistro, 'area'>> = {
  'Janeiro': 'janeiro',
  'Fevereiro': 'fevereiro',
  'Março': 'marco',
  'Abril': 'abril',
  'Maio': 'maio',
  'Junho': 'junho',
  'Julho': 'julho',
  'Agosto': 'agosto',
  'Setembro': 'setembro',
  'Outubro': 'outubro',
  'Novembro': 'novembro',
  'Dezembro': 'dezembro'
};

interface EmailMailingViewProps {
  selectedMonth: string;
}

export default function EmailMailingView({ selectedMonth }: EmailMailingViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Identificar registro de "Todos" (Mailing Geral desduplicado)
  const registroTodos = useMemo(() => {
    return emailMailingData.find((d) => d.area === 'Todos') || null;
  }, []);

  // Registros setoriais (excluindo a linha agregadora "Todos")
  const registrosSetoriais = useMemo(() => {
    return emailMailingData.filter((d) => d.area !== 'Todos');
  }, []);

  // Mês de referência atual (se selecionado, ou 'Agosto' como padrão do mês mais recente)
  const mesAtivoKey: keyof Omit<MailingRegistro, 'area'> = useMemo(() => {
    if (selectedMonth && selectedMonth !== 'Todos os meses' && MES_PROP_MAP[selectedMonth]) {
      return MES_PROP_MAP[selectedMonth];
    }
    return 'agosto'; // Mês mais recente apurado
  }, [selectedMonth]);

  const mesAtivoLabel = useMemo(() => {
    if (selectedMonth && selectedMonth !== 'Todos os meses') {
      return selectedMonth;
    }
    return 'Agosto (mais recente)';
  }, [selectedMonth]);

  // Totais principais
  const totalInscritosAtivo = registroTodos ? registroTodos[mesAtivoKey] : null;
  const totalJan = registroTodos?.janeiro ?? 18538;
  const totalAgo = registroTodos?.agosto ?? 20389;

  // Variação absoluta e percentual Jan -> Ago
  const variacaoAbsolutaJanAgo = totalAgo - totalJan;
  const variacaoPctJanAgo = totalJan > 0 ? ((variacaoAbsolutaJanAgo / totalJan) * 100).toFixed(2) : '0';

  // Evolução Mensal da linha "Todos" (Janeiro a Agosto)
  const evolucaoGeral = useMemo(() => {
    const mesesApurados = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto'] as const;
    const labelsMap: Record<string, string> = {
      janeiro: 'Jan',
      fevereiro: 'Fev',
      marco: 'Mar',
      abril: 'Abr',
      maio: 'Mai',
      junho: 'Jun',
      julho: 'Jul',
      agosto: 'Ago'
    };

    if (!registroTodos) return [];

    return mesesApurados.map((mKey, idx) => {
      const valor = (registroTodos[mKey] as number) || 0;
      const valorAnterior = idx > 0 ? (registroTodos[mesesApurados[idx - 1]] as number) || valor : valor;
      const diff = valor - valorAnterior;
      const diffPct = valorAnterior > 0 ? ((diff / valorAnterior) * 100).toFixed(1) : '0';

      return {
        key: mKey,
        label: labelsMap[mKey],
        mesCompleto: MESES_COLUNAS.find((c) => c.key === mKey)?.label || '',
        valor,
        diff,
        diffPct
      };
    });
  }, [registroTodos]);

  const minEvolucao = Math.min(...evolucaoGeral.map((e) => e.valor), 18000);
  const maxEvolucao = Math.max(...evolucaoGeral.map((e) => e.valor), 21000);

  // Lista de inscritos por área ordenada de forma decrescente para o mês ativo (padrão: Agosto)
  const rankingAreas = useMemo(() => {
    return [...registrosSetoriais]
      .map((d) => {
        const inscritos = d[mesAtivoKey];
        return {
          area: d.area,
          inscritos: inscritos,
          areaFormatada: normalizarUN(d.area)
        };
      })
      .sort((a, b) => {
        const valA = a.inscritos ?? -1;
        const valB = b.inscritos ?? -1;
        return valB - valA;
      });
  }, [registrosSetoriais, mesAtivoKey]);

  const maiorArea = rankingAreas[0] || null;
  const maxInscritosArea = maiorArea?.inscritos || 1;

  // Filtragem da tabela geral
  const displayTableData = useMemo(() => {
    return emailMailingData.filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        d.area.toLowerCase().includes(term) ||
        normalizarUN(d.area).toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = emailMailingData.map((d, index) => ({
      '#': index + 1,
      'Segmento / Área': d.area,
      'Janeiro': d.janeiro ?? 'Dados a carregar',
      'Fevereiro': d.fevereiro ?? 'Dados a carregar',
      'Março': d.marco ?? 'Dados a carregar',
      'Abril': d.abril ?? 'Dados a carregar',
      'Maio': d.maio ?? 'Dados a carregar',
      'Junho': d.junho ?? 'Dados a carregar',
      'Julho': d.julho ?? 'Dados a carregar',
      'Agosto': d.agosto ?? 'Dados a carregar',
      'Setembro': d.setembro ?? 'Dados a carregar',
      'Outubro': d.outubro ?? 'Dados a carregar',
      'Novembro': d.novembro ?? 'Dados a carregar',
      'Dezembro': d.dezembro ?? 'Dados a carregar'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mailing Geral');
    XLSX.writeFile(wb, `Mailing_Madrona_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAL DESDUPLICADO E VARIAÇÃO JAN A AGO)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Geral de Inscritos (Métrica Principal: Linha "Todos") */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Geral de Inscritos
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalInscritosAtivo !== null ? totalInscritosAtivo.toLocaleString('pt-BR') : 'Dados a carregar'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Base desduplicada ({mesAtivoLabel})
            </div>
          </div>
        </div>

        {/* Crescimento Jan -> Ago */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Crescimento no Ano (Jan a Ago)
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span>+{variacaoPctJanAgo}%</span>
              <ArrowUpRight size={20} className="text-emerald-500" />
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              +{variacaoAbsolutaJanAgo.toLocaleString('pt-BR')} novos contatos na base
            </div>
          </div>
        </div>

        {/* Maior Base Setorial */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Maior Segmento / UN
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-purple-900 mt-0.5 truncate max-w-[190px]" title={maiorArea?.area}>
              {maiorArea?.area || '—'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {maiorArea?.inscritos ? `${maiorArea.inscritos.toLocaleString('pt-BR')} inscritos` : '—'}
            </div>
          </div>
        </div>

        {/* Segmentos Ativos Mapeados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Listas Setoriais
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {registrosSetoriais.length} listas
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Segmentação especializada
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (JANEIRO A AGOSTO) - LINHA "TODOS"     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução do Mailing Geral</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Total de inscritos únicos desduplicados no mailing corporativo (linha "Todos")
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl font-semibold">
              Salto de {totalJan.toLocaleString('pt-BR')} para {totalAgo.toLocaleString('pt-BR')} contatos
            </span>
          </div>
        </div>

        {/* Grid de Barras Mensais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {evolucaoGeral.map((item) => {
            // Normalizar escala visual de 18.000 a 21.000
            const range = maxEvolucao - minEvolucao || 1;
            const heightPct = Math.max(25, Math.round(((item.valor - minEvolucao) / range) * 100));
            const isSelected = selectedMonth === item.mesCompleto || (selectedMonth === 'Todos os meses' && item.key === 'agosto');

            return (
              <div
                key={item.key}
                className={`rounded-2xl border p-3 flex flex-col justify-between text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.label}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {item.mesCompleto}
                  </div>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-3 flex flex-col items-center justify-end h-28">
                  <span className="text-xs font-serif font-bold text-gray-900 mb-1.5">
                    {item.valor.toLocaleString('pt-BR')}
                  </span>
                  <div className="w-10 bg-gray-200 rounded-t-lg h-20 flex items-end overflow-hidden">
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

                {/* Variação Mês a Mês */}
                <div className="pt-2 border-t border-gray-200/60 text-[10px]">
                  {item.diff > 0 ? (
                    <span className="text-emerald-700 font-semibold">
                      +{item.diff.toLocaleString('pt-BR')} (+{item.diffPct}%)
                    </span>
                  ) : item.diff === 0 ? (
                    <span className="text-gray-400 font-medium">—</span>
                  ) : (
                    <span className="text-rose-600 font-semibold">
                      {item.diff.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING DE INSCRITOS POR ÁREA EM AGOSTO (ORDEM DECRESCENTE)        */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-brand-blue" />
              <span>Inscritos por Área em {mesAtivoLabel}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Distribuição setorial do mailing com percentual relativo sobre a maior base
            </p>
          </div>

          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl font-semibold self-start sm:self-auto">
            {rankingAreas.length} segmentos
          </span>
        </div>

        {/* Ranking com Rolagem Interna (5 linhas completas) */}
        <div
          className="overflow-y-auto pr-1.5 scrollbar-thin"
          style={{ height: '328px' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rankingAreas.map((item, index) => {
              const hasData = item.inscritos !== null;
              const valor = item.inscritos || 0;
              const barWidth = hasData && maxInscritosArea > 0 ? (valor / maxInscritosArea) * 100 : 0;

              return (
                <div
                  key={item.area}
                  className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors h-[56px] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-bold text-gray-400 w-5">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-gray-900 truncate">
                        {item.area}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasData ? (
                        <span className="font-serif font-bold text-gray-900 text-sm">
                          {valor.toLocaleString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          Dados a carregar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-blue to-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM TODOS OS MESES (JANEIRO A DEZEMBRO)           */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Mail size={18} className="text-brand-blue" />
                <span>Histórico do Mailing por Segmento</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  (23 listas monitoradas)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Valores de Setembro a Dezembro assinalados como "Dados a carregar" até a apuração dos respectivos períodos
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Área */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar área ou UN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa do mailing para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados com Rolagem Interna (5 linhas completas) */}
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin" style={{ height: '238px' }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-gray-50/95 border-b border-gray-200/80">
              <tr className="h-[38px] text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 min-w-[200px] sticky left-0 bg-gray-50 z-30 shadow-r">
                  Segmento / Área
                </th>
                {MESES_COLUNAS.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2.5 px-2.5 text-center whitespace-nowrap ${
                      col.key === mesAtivoKey ? 'bg-blue-100/60 text-brand-blue font-bold' : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayTableData.map((item) => {
                const isTotalGeral = item.area === 'Todos';

                return (
                  <tr
                    key={item.area}
                    className={`transition-colors h-[40px] ${
                      isTotalGeral
                        ? 'bg-blue-50/70 font-bold border-y-2 border-brand-blue/30 text-brand-navy'
                        : 'hover:bg-blue-50/20'
                    }`}
                  >
                    {/* Nome da Área */}
                    <td
                      className={`py-2.5 px-3.5 whitespace-nowrap sticky left-0 z-10 shadow-r ${
                        isTotalGeral ? 'bg-blue-50 font-bold text-brand-navy text-sm' : 'bg-white font-medium text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isTotalGeral ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                            <span>{item.area} (Mailing Geral)</span>
                          </>
                        ) : (
                          <span>{item.area}</span>
                        )}
                      </div>
                    </td>

                    {/* 12 Meses */}
                    {MESES_COLUNAS.map((col) => {
                      const valor = item[col.key];
                      const isAtivo = col.key === mesAtivoKey;

                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-2.5 text-center whitespace-nowrap ${
                            isAtivo ? 'bg-blue-50/40 font-semibold' : ''
                          }`}
                        >
                          {valor !== null ? (
                            <span className={isTotalGeral ? 'font-serif font-bold text-sm text-brand-navy' : 'font-mono text-gray-700'}>
                              {valor.toLocaleString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded italic">
                              Dados a carregar
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
          <span>
            Exibindo <strong>{displayTableData.length} registros</strong> (incluindo o totalizador geral desduplicado).
          </span>
          <div className="flex items-center gap-3">
            <span>
              Total em Agosto: <strong className="text-brand-navy">{totalAgo.toLocaleString('pt-BR')} contatos</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
