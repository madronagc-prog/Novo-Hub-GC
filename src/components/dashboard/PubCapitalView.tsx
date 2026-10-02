import React, { useMemo, useState } from 'react';
import {
  CapitalAbertoRegistro,
  pubCapitalAbertoData
} from '../../data/pub-capital.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Building,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  AlertCircle,
  HelpCircle,
  ExternalLink
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

export function getStatusBadge(rawStatus: string | undefined | null) {
  if (!rawStatus || !rawStatus.trim()) {
    return {
      label: 'Não iniciado / A definir',
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      border: 'border-gray-200',
      dot: 'bg-gray-400',
      category: 'nao-iniciado'
    };
  }

  const s = rawStatus.toLowerCase().trim();

  if (s.includes('publicado')) {
    return {
      label: rawStatus,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      category: 'publicado'
    };
  }

  if (s.includes('aprovação')) {
    return {
      label: rawStatus,
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      category: 'em-aprovacao'
    };
  }

  if (s.includes('marcado') || s.includes('entrevista')) {
    return {
      label: rawStatus,
      bg: 'bg-blue-50',
      text: 'text-brand-blue',
      border: 'border-blue-200',
      dot: 'bg-[#00b2ff]',
      category: 'agendado'
    };
  }

  if (s.includes('avaliação') || s.includes('enviado')) {
    return {
      label: rawStatus,
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      category: 'em-avaliacao'
    };
  }

  return {
    label: rawStatus,
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    category: 'em-andamento'
  };
}

interface PubCapitalViewProps {
  selectedMonth: string;
}

export default function PubCapitalView({ selectedMonth }: PubCapitalViewProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'tabela'>('timeline');

  // Base normalizada
  const normalizedData = useMemo(() => {
    return pubCapitalAbertoData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica (Julho a Dezembro)
  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Filtro de mês (do topo)
  const displayRecords = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedData;
    }
    return sortedData.filter((d) => d.mes === selectedMonth);
  }, [sortedData, selectedMonth]);

  // Totais do Resumo
  const totalEdicoes = displayRecords.length;
  const totalPublicadas = displayRecords.filter(
    (d) => getStatusBadge(d.status).category === 'publicado'
  ).length;
  const totalEmAndamento = displayRecords.filter((d) => {
    const cat = getStatusBadge(d.status).category;
    return cat === 'em-aprovacao' || cat === 'agendado' || cat === 'em-avaliacao' || cat === 'em-andamento';
  }).length;
  const totalNaoIniciado = displayRecords.filter(
    (d) => getStatusBadge(d.status).category === 'nao-iniciado'
  ).length;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Área(s)': d.areas,
      'Tema da Matéria': d.tema || 'A definir',
      'Status': d.status || 'Não iniciado',
      'Visualizações no Site CA': d.views_site_ca !== null ? d.views_site_ca : 'Dados a carregar'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Capital Aberto');
    XLSX.writeFile(wb, `Capital_Aberto_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (CRONOGRAMA E STATUS DAS EDIÇÕES)                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Edições Planejadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Edições no Período
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalEdicoes} {totalEdicoes === 1 ? 'edição' : 'edições'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {selectedMonth === 'Todos os meses' ? 'Julho a Dezembro de 2026' : `Mês de ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Publicadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Artigos Publicados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {totalPublicadas}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {totalEdicoes > 0 ? ((totalPublicadas / totalEdicoes) * 100).toFixed(0) : 0}% concluído
            </div>
          </div>
        </div>

        {/* Em Produção / Avaliação */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Em Produção / Pauta
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalEmAndamento}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Em aprovação ou entrevista
            </div>
          </div>
        </div>

        {/* Views no Portal Capital Aberto */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Eye size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Audiência Portal CA
            </div>
            <div className="text-lg font-serif font-semibold text-gray-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Dados a carregar</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Métricas aguardando portal
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. LINHA DO TEMPO VISUAL (JULHO A DEZEMBRO)                          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-brand-blue" />
              <span>Cronograma Editorial na Capital Aberto</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhamento mensal de temas, áreas participantes e evolução das publicações
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Linha do Tempo
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'tabela'
                  ? 'bg-white text-brand-navy shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tabela
            </button>
          </div>
        </div>

        {displayRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Nenhum registro encontrado para o mês selecionado ({selectedMonth}).</p>
          </div>
        ) : viewMode === 'timeline' ? (
          /* Cards de Linha do Tempo Horizontal / Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRecords.map((item, idx) => {
              const badge = getStatusBadge(item.status);
              const isPublished = badge.category === 'publicado';

              return (
                <div
                  key={`${item.mes}-${idx}`}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isPublished
                      ? 'border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20 shadow-xs'
                      : item.status
                      ? 'border-gray-200 bg-white hover:border-gray-300'
                      : 'border-dashed border-gray-300 bg-gray-50/60'
                  }`}
                >
                  <div>
                    {/* Header do Card de Mês */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-navy bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        {item.mes}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        <span className="truncate max-w-[150px]">{badge.label}</span>
                      </span>
                    </div>

                    {/* Área(s) */}
                    <div className="mb-2.5">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Área(s) Participante(s)
                      </div>
                      <div className="text-xs font-bold text-gray-900 mt-0.5 line-clamp-2" title={item.areas}>
                        {item.areas}
                      </div>
                    </div>

                    {/* Tema */}
                    <div className="mb-3">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Tema / Artigo
                      </div>
                      <div className="text-xs text-gray-700 mt-0.5 leading-relaxed font-medium">
                        {item.tema ? (
                          <span className="text-gray-900">"{item.tema}"</span>
                        ) : (
                          <span className="text-gray-400 italic">Tema a definir com a área</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé: Views Site CA */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Views no Site CA:</span>
                    <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {item.views_site_ca !== null ? item.views_site_ca : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Tabela Estruturada */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-28">Mês</th>
                  <th className="py-3 px-4 w-52">Área(s)</th>
                  <th className="py-3 px-4">Tema da Matéria</th>
                  <th className="py-3 px-4 text-center w-48">Status</th>
                  <th className="py-3 px-4 text-center w-36">Views Site CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayRecords.map((item, idx) => {
                  const badge = getStatusBadge(item.status);
                  return (
                    <tr key={`${item.mes}-${idx}`} className="hover:bg-blue-50/20 transition-colors">
                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Áreas */}
                      <td className="py-3.5 px-4 font-semibold text-gray-800 text-xs">
                        {item.areas}
                      </td>

                      {/* Tema */}
                      <td className="py-3.5 px-4 text-gray-900 font-medium">
                        {item.tema ? (
                          <span>"{item.tema}"</span>
                        ) : (
                          <span className="text-gray-400 italic">A definir</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Views Site CA */}
                      <td className="py-3.5 px-4 text-center text-xs text-gray-400 whitespace-nowrap">
                        {item.views_site_ca !== null ? (
                          <span className="font-mono font-bold text-gray-800">
                            {item.views_site_ca.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            <Clock size={11} />
                            Dados a carregar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé Informativo e Ação de Exportar */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-brand-blue" />
            <span>
              Parceria editorial mensal na revista/portal <strong>Capital Aberto</strong> (Julho a Dezembro/2026).
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer self-start sm:self-auto"
            title="Exportar dados para Excel"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
