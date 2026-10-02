import React, { useMemo, useState } from 'react';
import {
  PostPatrocinadoRegistro,
  redePostsPatrocinadosData
} from '../../data/rede-posts-patrocinados.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Share2,
  MousePointerClick,
  Eye,
  Percent,
  TrendingUp,
  CheckCircle2,
  Clock,
  Video,
  AlertCircle,
  Calendar,
  Layers,
  Search,
  Download,
  Sparkles,
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

function getStatusBadge(rawStatus: string | undefined | null) {
  if (!rawStatus || !rawStatus.trim()) {
    return {
      label: 'Planejado / A definir',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400'
    };
  }

  const s = rawStatus.toLowerCase().trim();
  if (s.includes('realizado')) {
    return {
      label: 'Realizado com Sucesso',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    };
  }

  if (s.includes('produção') || s.includes('producao')) {
    return {
      label: rawStatus,
      bg: 'bg-blue-50',
      text: 'text-brand-blue',
      border: 'border-blue-200',
      dot: 'bg-[#00b2ff]'
    };
  }

  if (s.includes('não foi executado') || s.includes('nao foi executado') || s.includes('outubro')) {
    return {
      label: rawStatus,
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    };
  }

  return {
    label: rawStatus,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400'
  };
}

interface RedePostsPatrocinadosViewProps {
  selectedMonth: string;
}

export default function RedePostsPatrocinadosViewProps({ selectedMonth }: RedePostsPatrocinadosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada
  const normalizedData = useMemo(() => {
    return redePostsPatrocinadosData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Junho a Dezembro)
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

  // Filtro de busca textual
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        d.mes.toLowerCase().includes(term) ||
        d.areas.toLowerCase().includes(term) ||
        d.status.toLowerCase().includes(term) ||
        d.tema.toLowerCase().includes(term) ||
        d.objetivo.toLowerCase().includes(term)
      );
    });
  }, [monthFilteredData, searchTerm]);

  // Registro destacado com métricas completas (Junho)
  const campanhaDestaque = useMemo(() => {
    return normalizedData.find((d) => d.impressoes !== null && d.impressoes > 0) || null;
  }, [normalizedData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Área(s)': d.areas,
      'Status': getStatusBadge(d.status).label,
      'Objetivo': d.objetivo || '—',
      'Tema': d.tema || '—',
      'Impressões': d.impressoes !== null ? d.impressoes : 'Planejado / Sem métricas',
      'Cliques': d.cliques !== null ? d.cliques : 'Planejado / Sem métricas',
      'CTR': d.ctr || 'Planejado / Sem métricas'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Posts Patrocinados LinkedIn');
    XLSX.writeFile(wb, `Posts_Patrocinados_LinkedIn_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE DESTAQUE: MÉTRICAS DA CAMPANHA REALIZADA (JUNHO)         */}
      {/* ==================================================================== */}
      {campanhaDestaque && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm border border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Campanha Patrocinada Realizada • {campanhaDestaque.mes}
              </span>
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <span>{campanhaDestaque.tema}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-sans font-medium">
                  {campanhaDestaque.status}
                </span>
              </h3>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Área patrocinada: <strong>{campanhaDestaque.areas}</strong> | Objetivo: <strong>{campanhaDestaque.objetivo}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs bg-white/10 text-white px-3 py-1 rounded-xl border border-white/15">
                Métricas Consolidadas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Impressões */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-200 font-medium">Impressões (Alcance)</span>
                <Eye size={18} className="text-blue-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                {campanhaDestaque.impressoes?.toLocaleString('pt-BR')}
              </div>
              <span className="text-[11px] text-blue-200/70 mt-0.5 block">
                Exibições totais no feed
              </span>
            </div>

            {/* Cliques */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-200 font-medium">Cliques no Link / Anúncio</span>
                <MousePointerClick size={18} className="text-emerald-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-400 mt-1">
                {campanhaDestaque.cliques?.toLocaleString('pt-BR')}
              </div>
              <span className="text-[11px] text-blue-200/70 mt-0.5 block">
                Interações qualificadas
              </span>
            </div>

            {/* CTR */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-200 font-medium">Taxa de Cliques (CTR)</span>
                <Percent size={18} className="text-amber-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-300 mt-1">
                {campanhaDestaque.ctr}
              </div>
              <span className="text-[11px] text-blue-200/70 mt-0.5 block">
                Excelente taxa no LinkedIn B2B
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. LINHA DO TEMPO CRONOLÓGICA (JUNHO A DEZEMBRO)                     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-brand-blue" />
              <span>Cronograma de Campanhas Patrocinadas</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Planejamento editorial e execução de mídia paga de Junho a Dezembro de 2026
            </p>
          </div>

          <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
            {sortedChronologically.length} meses planejados
          </span>
        </div>

        {/* Timeline Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedChronologically.map((item) => {
            const badge = getStatusBadge(item.status);
            const isExecuted = item.impressoes !== null;
            const isSelected = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/40 shadow-xs'
                    : isExecuted
                    ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                    : 'border-gray-200/80 bg-gray-50/50 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-200/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                      {item.mes}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      <span className="truncate max-w-[150px]">{badge.label}</span>
                    </span>
                  </div>

                  {/* Área e Tema */}
                  <div className="space-y-1.5 my-2">
                    <div className="text-xs text-gray-500">
                      Área: <strong className="text-gray-900">{item.areas}</strong>
                    </div>

                    {item.tema ? (
                      <div className="text-xs font-semibold text-gray-800 leading-snug">
                        "{item.tema}"
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">
                        Tema em definição pela prática
                      </div>
                    )}

                    {item.objetivo && (
                      <div className="text-[11px] text-gray-500">
                        Objetivo: <span className="font-medium text-brand-blue">{item.objetivo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Métricas ou Status Textual */}
                <div className="mt-3 pt-2.5 border-t border-gray-200/60 text-xs">
                  {isExecuted ? (
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div className="bg-white p-1 rounded border border-gray-200/60">
                        <span className="block text-[10px] text-gray-400 font-sans">Impr.</span>
                        <span className="font-bold text-gray-800 text-[11px]">
                          {(item.impressoes! / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <div className="bg-white p-1 rounded border border-gray-200/60">
                        <span className="block text-[10px] text-gray-400 font-sans">Cliques</span>
                        <span className="font-bold text-emerald-700 text-[11px]">
                          {item.cliques}
                        </span>
                      </div>
                      <div className="bg-white p-1 rounded border border-gray-200/60">
                        <span className="block text-[10px] text-gray-400 font-sans">CTR</span>
                        <span className="font-bold text-amber-700 text-[11px]">
                          {item.ctr}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-[11px] italic bg-white p-2 rounded-xl border border-gray-200/60 text-center">
                      {item.status ? item.status : 'Aguardando início da produção'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA MÊS E SEUS DADOS                        */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Share2 size={18} className="text-brand-blue" />
                <span>Posts Patrocinados no LinkedIn</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {sortedChronologically.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Alinhamento de campanhas pagas com áreas setoriais do escritório
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Texto */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar mês, área, tema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar cronograma de posts patrocinados para Excel"
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
                <th className="py-3 px-4 min-w-[200px]">Área(s) Beneficiada(s)</th>
                <th className="py-3 px-4 min-w-[240px]">Status da Ação</th>
                <th className="py-3 px-4 w-32">Objetivo</th>
                <th className="py-3 px-4 min-w-[220px]">Tema da Campanha</th>
                <th className="py-3 px-4 text-center w-28 font-bold">Impressões</th>
                <th className="py-3 px-4 text-center w-28">Cliques</th>
                <th className="py-3 px-4 text-center w-24">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const badge = getStatusBadge(item.status);
                  const isExecuted = item.impressoes !== null;

                  return (
                    <tr
                      key={`${item.mes}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Numeração */}
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold">
                          {item.mes}
                        </span>
                      </td>

                      {/* Áreas */}
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {item.areas}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Objetivo */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {item.objetivo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100 font-medium">
                            {item.objetivo}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Tema */}
                      <td className="py-3.5 px-4 text-gray-800 text-xs leading-snug">
                        {item.tema || <span className="text-gray-300 italic">A definir</span>}
                      </td>

                      {/* Impressões */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isExecuted ? (
                          <span className="font-serif font-bold text-gray-900 text-sm">
                            {item.impressoes?.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Planejado</span>
                        )}
                      </td>

                      {/* Cliques */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isExecuted ? (
                          <span className="font-serif font-bold text-emerald-700 text-sm">
                            {item.cliques?.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Planejado</span>
                        )}
                      </td>

                      {/* CTR */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isExecuted ? (
                          <span className="font-serif font-bold text-amber-700 text-sm">
                            {item.ctr}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">—</span>
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
              Exibindo <strong>{displayRecords.length} ações planejadas/executadas</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-3">
              <span>
                Execução pioneira: <strong className="text-brand-navy">Junho (117k impressões)</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
