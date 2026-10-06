import React, { useMemo, useState } from 'react';
import {
  ContribuicaoBFRegistro,
  emailContribuicoesData
} from '../../data/email-contribuicoes.data';
import { normalizarUN, normalizarMes } from '../../utils/padronizacao';
import {
  Mail,
  TrendingUp,
  ExternalLink,
  Calendar,
  Building,
  Users,
  Search,
  Download,
  BarChart3,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  Clock,
  BookOpen
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

const EDICAO_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Ed. 1': { bg: 'bg-blue-50', text: 'text-brand-blue', border: 'border-blue-200' },
  'Ed. 2': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Ed. 3': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Ed. 4': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Ed. 5': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' }
};

interface EmailContribuicoesViewProps {
  selectedMonth: string;
  selectedUn: string;
}

export default function EmailContribuicoesView({ selectedMonth, selectedUn }: EmailContribuicoesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [edicaoFilter, setEdicaoFilter] = useState<string>('todas');

  // Base normalizada com padronização de UN e Mês
  const normalizedData = useMemo(() => {
    return emailContribuicoesData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      un: normalizarUN(d.un)
    }));
  }, []);

  // Ordenação cronológica por mês
  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedData;
    }
    return sortedData.filter((d) => d.mes === selectedMonth);
  }, [sortedData, selectedMonth]);

  // Filtro de UN (do seletor superior da página) - aplicado sobre o período já filtrado por mês
  const filteredData = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return monthFilteredData;
    return monthFilteredData.filter((d) => d.un === selectedUn);
  }, [monthFilteredData, selectedUn]);

  // Filtros combinados da tabela (busca + edição; mês e UN já vêm de filteredData)
  const displayRecords = useMemo(() => {
    return filteredData.filter((d) => {
      if (edicaoFilter !== 'todas' && d.edicao !== edicaoFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.tema.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.autor1.toLowerCase().includes(term) ||
          d.autor2.toLowerCase().includes(term) ||
          d.edicao.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [filteredData, edicaoFilter, searchTerm]);

  // Agrupamento por Edição para a visualização - gerado a partir da própria base,
  // então uma edição nova (Ed. 6 em diante) aparece sozinha assim que entrar nos dados
  const edicoesDisponiveis = useMemo(() => {
    const vistas = new Map<string, string>(); // edicao -> mes (para ordenar cronologicamente)
    normalizedData.forEach((d) => {
      if (d.edicao && !vistas.has(d.edicao)) {
        vistas.set(d.edicao, d.mes);
      }
    });
    return Array.from(vistas.entries())
      .sort((a, b) => (MONTH_ORDER[a[1]] || 99) - (MONTH_ORDER[b[1]] || 99))
      .map(([edicao]) => edicao);
  }, [normalizedData]);

  // Métricas por Edição (respeitando o filtro de UN; taxa de abertura é por edição, não muda por UN)
  const statsPorEdicao = useMemo(() => {
    const base = selectedUn === 'Todas as UNs' ? normalizedData : normalizedData.filter((d) => d.un === selectedUn);
    return edicoesDisponiveis.map((ed) => {
      const itens = base.filter((d) => d.edicao === ed);
      const taxaValida = itens.find((i) => i.taxa_abertura !== null)?.taxa_abertura ?? null;
      const totalViews = itens.reduce((acc, i) => acc + (i.views_no_site || 0), 0);
      const mesEdicao = itens[0]?.mes || '';

      return {
        edicao: ed,
        mes: mesEdicao,
        totalArtigos: itens.length,
        taxaAbertura: taxaValida,
        totalViews: totalViews > 0 ? totalViews : null
      };
    });
  }, [normalizedData, selectedUn, edicoesDisponiveis]);

  // Totais Gerais
  const totalArtigosFiltrados = displayRecords.length;
  const taxasMensuradas = statsPorEdicao
    .filter((s) => s.taxaAbertura !== null)
    .map((s) => s.taxaAbertura as number);
  const taxaMediaGeral =
    taxasMensuradas.length > 0
      ? (taxasMensuradas.reduce((a, b) => a + b, 0) / taxasMensuradas.length).toFixed(2)
      : '—';

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Edição': d.edicao,
      'Tema / Artigo': d.tema,
      'UN': d.un,
      'Autor 1': d.autor1,
      'Autor 2': d.autor2 || '—',
      'Taxa de Abertura (%)': d.taxa_abertura !== null ? `${d.taxa_abertura}%` : '—',
      'Views no Site': d.views_no_site !== null ? d.views_no_site : '—',
      'Link': d.link || '—'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jornal B&F');
    XLSX.writeFile(wb, `Contribuicoes_Jornal_BF_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS E TAXAS MÉDIAS DE ABERTURA)               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Artigos / Contribuições */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Contribuições no Período
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalArtigosFiltrados} {totalArtigosFiltrados === 1 ? 'artigo' : 'artigos'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {selectedMonth === 'Todos os meses' ? 'Ed. 1 a Ed. 5 (5 edições)' : `Mês de ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Taxa de Abertura Média Geral */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Taxa Média de Abertura
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {taxaMediaGeral}%
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Edições 1 a 4 mensuradas
            </div>
          </div>
        </div>

        {/* Edição com Maior Abertura */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Pico de Engajamento
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              36,33%
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Edição 2 (Março/2026)
            </div>
          </div>
        </div>

        {/* Status da Edição 5 */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0 border border-sky-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Última Edição (Ed. 5)
            </div>
            <div className="text-xl sm:text-2xl font-serif font-bold text-gray-900 mt-0.5">
              5 artigos
            </div>
            <div className="text-[11px] text-sky-700 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
              Taxa em consolidação
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO DA TAXA DE ABERTURA POR EDIÇÃO (ED 1 A ED 5)   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução da Taxa de Abertura</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Percentual de abertura do e-mail marketing corporativo para as edições de 2026
            </p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            Meta benchmark: ~25-30%
          </span>
        </div>

        {/* Grid de Barras Comparativas por Edição */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {statsPorEdicao.map((item) => {
            const hasTaxa = item.taxaAbertura !== null;
            const taxa = item.taxaAbertura || 0;
            // Altura relativa em base a 40% max
            const heightPct = hasTaxa ? Math.round((taxa / 45) * 100) : 0;
            const badge = EDICAO_BADGES[item.edicao] || {
              bg: 'bg-gray-100',
              text: 'text-gray-700',
              border: 'border-gray-200'
            };

            return (
              <div
                key={item.edicao}
                className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-4 flex flex-col justify-between text-center transition-all hover:border-gray-300"
              >
                <div>
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {item.edicao}
                  </span>
                  <div className="text-xs text-gray-500 mt-1 font-medium">
                    {item.mes}
                  </div>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-4 flex flex-col items-center justify-end h-32">
                  <span className="text-sm font-serif font-bold text-gray-900 mb-2">
                    {hasTaxa ? `${taxa}%` : '—'}
                  </span>
                  <div className="w-12 bg-gray-200 rounded-t-xl h-24 flex items-end overflow-hidden">
                    {hasTaxa ? (
                      <div
                        className="w-full bg-gradient-to-t from-brand-navy to-brand-blue rounded-t-xl transition-all duration-700"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                    ) : (
                      <div className="w-full h-3 bg-gray-300 border-t-2 border-dashed border-gray-400"></div>
                    )}
                  </div>
                </div>

                {/* Subtítulo do Card */}
                <div className="pt-2 border-t border-gray-200/60 text-[11px] text-gray-500">
                  <div>{item.totalArtigos} artigos</div>
                  {item.totalViews !== null ? (
                    <div className="text-emerald-700 font-semibold">{item.totalViews} views</div>
                  ) : (
                    <div className="text-gray-400 italic">Views: —</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA AGRUPADA POR EDIÇÃO                               */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Mail size={18} className="text-brand-blue" />
                <span>Contribuições Publicadas</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} {displayRecords.length === 1 ? 'artigo' : 'artigos'})
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Artigos jurídicos, análises de mercado e autores do escritório em cada edição
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Edição */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Edição:</span>
                <select
                  value={edicaoFilter}
                  onChange={(e) => setEdicaoFilter(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todas">Todas as edições</option>
                  {statsPorEdicao.map((item) => (
                    <option key={item.edicao} value={item.edicao}>
                      {item.edicao} ({item.mes})
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tema, autor, UN..."
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

        {/* Tabela de Dados com Rolagem Interna */}
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin" style={{ height: '560px' }}>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200/80">
              <tr className="h-[40px] text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-24">Edição</th>
                <th className="py-2.5 px-3.5 w-24">Mês</th>
                <th className="py-2.5 px-3.5 min-w-[260px]">Tema do Artigo</th>
                <th className="py-2.5 px-3.5 w-44">UN / Área</th>
                <th className="py-2.5 px-3.5 w-44">Autor(es)</th>
                <th className="py-2.5 px-3.5 text-center w-28">Taxa Abertura</th>
                <th className="py-2.5 px-3.5 text-center w-28">Views Site</th>
                <th className="py-2.5 px-3.5 text-center w-28">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Nenhum artigo encontrado para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const badge = EDICAO_BADGES[item.edicao] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-200'
                  };
                  const hasLink = item.link && (item.link.startsWith('http://') || item.link.startsWith('https://'));

                  return (
                    <tr
                      key={`${item.tema}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors h-[52px]"
                    >
                      {/* Edição */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {item.edicao}
                        </span>
                      </td>

                      {/* Mês */}
                      <td className="py-2 px-3.5 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        {item.mes}
                      </td>

                      {/* Tema do Artigo */}
                      <td className="py-2 px-3.5 font-medium text-gray-900 leading-snug">
                        {item.tema}
                      </td>

                      {/* UN */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.un}
                        </span>
                      </td>

                      {/* Autores */}
                      <td className="py-2 px-3.5 text-gray-700 text-xs">
                        <div className="font-semibold text-gray-900">{item.autor1}</div>
                        {item.autor2 && (
                          <div className="text-[11px] text-gray-500 mt-0.5">+ {item.autor2}</div>
                        )}
                      </td>

                      {/* Taxa de Abertura */}
                      <td className="py-2 px-3.5 text-center whitespace-nowrap font-serif font-bold text-gray-900">
                        {item.taxa_abertura !== null ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-100">
                            {item.taxa_abertura}%
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Views no Site */}
                      <td className="py-2 px-3.5 text-center whitespace-nowrap font-mono text-xs">
                        {item.views_no_site !== null ? (
                          <span className="font-bold text-gray-800">
                            {item.views_no_site}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Link */}
                      <td className="py-2 px-3.5 text-center whitespace-nowrap">
                        {hasLink ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline font-semibold"
                            title="Acessar publicação no site institucional"
                          >
                            <span>Artigo</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
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
              Total exibido: <strong>{displayRecords.length} contribuições</strong> no período de{' '}
              <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Edições cobertas: <strong>Ed. 1 a Ed. 5</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
