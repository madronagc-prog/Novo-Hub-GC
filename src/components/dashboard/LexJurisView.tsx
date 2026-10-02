import React, { useMemo, useState } from 'react';
import {
  LexJurisRegistro,
  lexJurisData
} from '../../data/lex-juris.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Scale,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Download,
  Filter,
  BarChart3,
  Calendar,
  AlertCircle,
  FileText,
  HelpCircle,
  Sparkles,
  Link as LinkIcon
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

function getStatusBadge(rawStatus: string | undefined | null) {
  if (!rawStatus || !rawStatus.trim()) {
    return {
      label: 'Em pauta / A definir',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200',
      dot: 'bg-gray-400'
    };
  }

  const s = rawStatus.toLowerCase().trim();
  if (s.includes('publicado')) {
    return {
      label: 'Texto publicado',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    };
  }

  if (s.includes('análise')) {
    return {
      label: 'Em análise',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    };
  }

  if (s.includes('sem resposta')) {
    return {
      label: 'Sem resposta do advogado',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    };
  }

  return {
    label: rawStatus,
    bg: 'bg-blue-50',
    text: 'text-brand-blue',
    border: 'border-blue-200',
    dot: 'bg-[#00b2ff]'
  };
}

// Helper para extrair URLs de textos com múltiplas linhas ou rótulos
function renderLinksUteis(linksUteisStr: string) {
  if (!linksUteisStr || !linksUteisStr.trim()) {
    return <span className="text-gray-300">—</span>;
  }

  // Regex para encontrar URLs https?://...
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = linksUteisStr.match(urlRegex);

  if (!matches || matches.length === 0) {
    return <span className="text-xs text-gray-500">{linksUteisStr}</span>;
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      {matches.map((url, idx) => {
        let label = `Fonte ${idx + 1}`;
        if (url.includes('stj.jus.br')) label = 'Processo STJ';
        else if (url.includes('brasilparticipativo')) label = 'Consulta Pública';
        else if (url.includes('diariooficial.prefeitura')) label = 'DOM São Paulo';
        else if (url.includes('cetesb.sp.gov.br')) label = 'Resolução CETESB';
        else if (url.includes('gov.br/cgu')) label = 'Relatório CGU';
        else if (url.includes('in.gov.br')) label = 'Diário Oficial (DOU)';
        else if (url.includes('fazenda.pt-br') || url.includes('gov.br/fazenda')) label = 'Nota Técnica';

        return (
          <a
            key={`${url}-${idx}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand-blue hover:underline font-medium"
            title={url}
          >
            <LinkIcon size={10} className="flex-shrink-0" />
            <span className="truncate max-w-[130px]">{label}</span>
          </a>
        );
      })}
    </div>
  );
}

interface LexJurisViewProps {
  selectedMonth: string;
}

export default function LexJurisView({ selectedMonth }: LexJurisViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');

  // Base normalizada com padronização de mês e UNs
  const normalizedData = useMemo(() => {
    return lexJurisData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un1: normalizarUN(d.un1),
      un2: normalizarUN(d.un2)
    }));
  }, []);

  // Ordenação cronológica por mês (Abril a Julho)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.tema.localeCompare(b.tema);
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtros combinados da tabela (busca + status + tipo)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedTipo !== 'todos' && d.lex_ou_juris.toLowerCase() !== selectedTipo.toLowerCase()) return false;

      const badge = getStatusBadge(d.status);
      if (selectedStatus !== 'todos') {
        if (selectedStatus === 'publicado' && badge.label !== 'Texto publicado') return false;
        if (selectedStatus === 'analise' && badge.label !== 'Em análise') return false;
        if (selectedStatus === 'sem-resposta' && badge.label !== 'Sem resposta do advogado') return false;
        if (selectedStatus === 'pendente' && badge.label !== 'Em pauta / A definir') return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.tema.toLowerCase().includes(term) ||
          d.responsavel_analise.toLowerCase().includes(term) ||
          d.proposto_por.toLowerCase().includes(term) ||
          d.un1.toLowerCase().includes(term) ||
          d.un2.toLowerCase().includes(term) ||
          d.atividade.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedTipo, selectedStatus, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalPautas = monthFilteredData.length;

  const totalLex = useMemo(
    () => monthFilteredData.filter((d) => d.lex_ou_juris.toLowerCase() === 'lex').length,
    [monthFilteredData]
  );
  const totalJuris = useMemo(
    () => monthFilteredData.filter((d) => d.lex_ou_juris.toLowerCase() === 'juris').length,
    [monthFilteredData]
  );

  const totalPublicados = useMemo(
    () => monthFilteredData.filter((d) => getStatusBadge(d.status).label === 'Texto publicado').length,
    [monthFilteredData]
  );
  const totalEmAnalise = useMemo(
    () => monthFilteredData.filter((d) => getStatusBadge(d.status).label === 'Em análise').length,
    [monthFilteredData]
  );
  const totalSemResposta = useMemo(
    () => monthFilteredData.filter((d) => getStatusBadge(d.status).label === 'Sem resposta do advogado').length,
    [monthFilteredData]
  );
  const totalOutros = totalPautas - totalPublicados - totalEmAnalise - totalSemResposta;

  const taxaConversao = totalPautas > 0 ? (totalPublicados / totalPautas) * 100 : 0;
  const pctLex = totalPautas > 0 ? (totalLex / totalPautas) * 100 : 0;
  const pctJuris = totalPautas > 0 ? (totalJuris / totalPautas) * 100 : 0;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Tipo (Lex / Juris)': d.lex_ou_juris,
      'Tema': d.tema,
      'Atividade': d.atividade,
      'Status': getStatusBadge(d.status).label,
      'Responsável pela Análise': d.responsavel_analise.replace(/\n/g, ', '),
      'Proposto por': d.proposto_por,
      'UN 1': d.un1,
      'UN 2': d.un2 || '—',
      'Link Final': d.link || '—',
      'Links Úteis': d.links_uteis || '—'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lex & Juris');
    XLSX.writeFile(wb, `Lex_Juris_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS, LEX X JURIS E STATUS)                    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Pautas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Scale size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Pautas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalPautas} {totalPautas === 1 ? 'pauta' : 'pautas'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {totalLex} Lex / {totalJuris} Juris
            </div>
          </div>
        </div>

        {/* Textos Publicados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Textos Publicados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalPublicados}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Taxa de conversão: {taxaConversao.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Em Análise ou Pauta */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Em Análise / Pauta
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalEmAnalise + totalOutros}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {totalEmAnalise} em análise ativa
            </div>
          </div>
        </div>

        {/* Sem Resposta */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Sem Retorno
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-800 mt-0.5">
              {totalSemResposta}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              Aguardando retorno do advogado
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE PROPORÇÃO LEX VS. JURIS                                */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Proporção de Pautas: Lex vs. Juris</span>
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span className="font-semibold text-gray-700">Lex ({totalLex})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <span className="font-semibold text-gray-700">Juris ({totalJuris})</span>
            </div>
          </div>
        </div>

        {totalPautas === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            Nenhuma pauta registrada no mês selecionado ({selectedMonth}).
          </div>
        ) : (
          <div className="space-y-4">
            {/* Barra Proporcional */}
            <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden flex shadow-inner">
              <div
                className="bg-brand-blue h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
                style={{ width: `${pctLex}%` }}
                title={`Lex: ${totalLex} pautas (${pctLex.toFixed(1)}%)`}
              >
                {pctLex >= 15 ? `${pctLex.toFixed(0)}% Lex` : ''}
              </div>
              <div
                className="bg-purple-600 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-700"
                style={{ width: `${pctJuris}%` }}
                title={`Juris: ${totalJuris} pautas (${pctJuris.toFixed(1)}%)`}
              >
                {pctJuris >= 10 ? `${pctJuris.toFixed(0)}% Juris` : ''}
              </div>
            </div>

            {/* Cards Comparativos dos Dois Tipos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-navy uppercase tracking-wider block">
                    Lex (Legislação e Regulação)
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Portarias, resoluções CMN/BCB, decretos, consultas públicas
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif font-bold text-brand-blue">
                    {totalLex} {totalLex === 1 ? 'pauta' : 'pautas'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    {pctLex.toFixed(1)}% do total
                  </div>
                </div>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                    Juris (Jurisprudência e Tribunais)
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5 block">
                    Decisões do STJ, STF e tribunais superiores
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif font-bold text-purple-700">
                    {totalJuris} {totalJuris === 1 ? 'pauta' : 'pautas'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    {pctJuris.toFixed(1)}% do total
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA REGISTRO DE LEX & JURIS                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-brand-blue" />
                <span>Pautas Lex & Juris</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {totalPautas} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Acompanhamento de pautas jurídicas, análise de viabilidade e publicações
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Tipo:</span>
                <select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="lex">Lex</option>
                  <option value="juris">Juris</option>
                </select>
              </div>

              {/* Filtro por Status */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todos">Todos os status</option>
                  <option value="publicado">Texto publicado</option>
                  <option value="analise">Em análise</option>
                  <option value="sem-resposta">Sem resposta do advogado</option>
                  <option value="pendente">Em pauta / A definir</option>
                </select>
              </div>

              {/* Busca por Tema */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tema, advogado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base filtrada para Excel"
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
                <th className="py-3 px-3.5 w-20">Mês</th>
                <th className="py-3 px-3.5 w-20">Tipo</th>
                <th className="py-3 px-3.5 min-w-[260px]">Tema da Pauta</th>
                <th className="py-3 px-3.5 w-32">Status</th>
                <th className="py-3 px-3.5 w-44">Responsável Análise</th>
                <th className="py-3 px-3.5 w-36">UN(s)</th>
                <th className="py-3 px-3.5 w-36">Proposto por</th>
                <th className="py-3 px-3.5 text-center w-24">Link Final</th>
                <th className="py-3 px-3.5 w-36">Links Úteis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhuma pauta encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const badge = getStatusBadge(item.status);
                  const isLex = item.lex_ou_juris.toLowerCase() === 'lex';
                  const hasLink = item.link && (item.link.startsWith('http://') || item.link.startsWith('https://'));

                  return (
                    <tr
                      key={`${item.tema}-${item.mes}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Mês */}
                      <td className="py-3.5 px-3.5 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Tipo: Lex ou Juris */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${
                            isLex
                              ? 'bg-blue-50 text-brand-blue border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {item.lex_ou_juris}
                        </span>
                      </td>

                      {/* Tema */}
                      <td className="py-3.5 px-3.5 font-medium text-gray-900 leading-snug">
                        {item.tema}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Responsável pela Análise */}
                      <td className="py-3.5 px-3.5 text-gray-700 text-xs leading-relaxed">
                        {item.responsavel_analise.split('\n').map((nome, nIdx) => (
                          <div key={nIdx} className="font-semibold text-gray-800">
                            {nome}
                          </div>
                        ))}
                      </td>

                      {/* UNs */}
                      <td className="py-3.5 px-3.5 text-xs">
                        <div className="space-y-1">
                          {item.un1 && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                              {item.un1}
                            </span>
                          )}
                          {item.un2 && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                              {item.un2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Proposto por */}
                      <td className="py-3.5 px-3.5 text-gray-600 text-xs">
                        {item.proposto_por}
                      </td>

                      {/* Link Final */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        {hasLink ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline font-semibold"
                            title="Acessar artigo publicado"
                          >
                            <span>Artigo</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Links Úteis */}
                      <td className="py-3.5 px-3.5">
                        {renderLinksUteis(item.links_uteis)}
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
              Exibindo <strong>{displayRecords.length} pautas</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-3">
              <span>
                Publicadas no período: <strong className="text-emerald-700">{totalPublicados}</strong> ({taxaConversao.toFixed(0)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
