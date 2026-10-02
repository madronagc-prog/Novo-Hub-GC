import React, { useMemo, useState } from 'react';
import {
  NewsLinkedinRegistro,
  redeNewsLinkedinData
} from '../../data/rede-news-linkedin.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Share2,
  Heart,
  Eye,
  UserPlus,
  Search,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  BookOpen,
  ArrowUpRight
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

interface RedeNewsLinkedinViewProps {
  selectedMonth: string;
}

export default function RedeNewsLinkedinView({ selectedMonth }: RedeNewsLinkedinViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada com padronização de mês
  const normalizedData = useMemo(() => {
    return redeNewsLinkedinData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Agosto)
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

  // Filtro de busca por texto (mês ou área participante)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        d.mes.toLowerCase().includes(term) ||
        d.areas_participantes.toLowerCase().includes(term)
      );
    });
  }, [monthFilteredData, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalCurtidas = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.curtidas, 0),
    [monthFilteredData]
  );

  const totalViews = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.views, 0),
    [monthFilteredData]
  );

  const totalNovosAssinantes = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.novos_assinantes, 0),
    [monthFilteredData]
  );

  const mediaViewsPorEdicao = useMemo(() => {
    if (monthFilteredData.length === 0) return 0;
    return Math.round(totalViews / monthFilteredData.length);
  }, [monthFilteredData, totalViews]);

  // Dados para o Gráfico de Evolução (Janeiro a Agosto consolidado)
  const maxViews = Math.max(...sortedChronologically.map((d) => d.views), 1);
  const maxAssinantes = Math.max(...sortedChronologically.map((d) => d.novos_assinantes), 1);
  const maxCurtidas = Math.max(...sortedChronologically.map((d) => d.curtidas), 1);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Áreas Participantes': d.areas_participantes,
      'Curtidas': d.curtidas,
      'Visualizações (Views)': d.views,
      'Novos Assinantes': d.novos_assinantes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'News LinkedIn');
    XLSX.writeFile(wb, `News_LinkedIn_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Visualizações (Views) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Eye size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Visualizações da Newsletter
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalViews.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Média de {mediaViewsPorEdicao.toLocaleString('pt-BR')} views/edição
            </div>
          </div>
        </div>

        {/* Novos Assinantes */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <UserPlus size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Novos Assinantes
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              +{totalNovosAssinantes.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Crescimento de audiência orgânica
            </div>
          </div>
        </div>

        {/* Total de Curtidas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
            <Heart size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Curtidas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-800 mt-0.5">
              {totalCurtidas.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              Engajamento direto nas edições
            </div>
          </div>
        </div>

        {/* Edições Publicadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Edições no Período
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {monthFilteredData.length} {monthFilteredData.length === 1 ? 'edição' : 'edições'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Circulação regular no LinkedIn
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (COMPARAÇÃO VIEWS, ASSINANTES E CURTIDAS) */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução Mensal da Newsletter no LinkedIn</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhamento comparativo de visualizações, novos inscritos e curtidas
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span className="font-semibold text-gray-700">Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-gray-700">Assinantes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="font-semibold text-gray-700">Curtidas</span>
            </div>
          </div>
        </div>

        {/* Grid de Cards Mensais das 8 Edições */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {sortedChronologically.map((item) => {
            const heightPct = Math.round((item.views / maxViews) * 100);
            const isSelected = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-3 flex flex-col justify-between text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.mes}
                  </span>
                </div>

                {/* Coluna / Barra do Gráfico (Baseada em Views) */}
                <div className="my-3 flex flex-col items-center justify-end h-28">
                  <span className="text-xs font-serif font-bold text-gray-900 mb-1.5">
                    {item.views.toLocaleString('pt-BR')}
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

                {/* Métricas Secundárias */}
                <div className="pt-2 border-t border-gray-200/60 text-[10px] space-y-1">
                  <div className="text-emerald-700 font-semibold">
                    +{item.novos_assinantes} assin.
                  </div>
                  <div className="text-rose-600 font-medium">
                    {item.curtidas} curtidas
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA DE EDIÇÕES COM ÁREAS PARTICIPANTES                          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Share2 size={18} className="text-brand-blue" />
                <span>Edições da Newsletter</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {sortedChronologically.length} edições)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Áreas do escritório destacadas em cada edição e o desempenho de alcance
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Busca por Texto */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar mês ou área..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar dados da newsletter para Excel"
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
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-28">Mês</th>
                <th className="py-3.5 px-4 min-w-[340px]">Áreas Participantes da Edição</th>
                <th className="py-3.5 px-4 text-center w-32 font-bold text-gray-900">Views</th>
                <th className="py-3.5 px-4 text-center w-36 font-semibold text-emerald-800">Novos Assinantes</th>
                <th className="py-3.5 px-4 text-center w-28 font-semibold text-rose-700">Curtidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhuma edição encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  // Separar as áreas participantes para criar tags limpas
                  const areasList = item.areas_participantes
                    .split(/,\s*|\s+e\s+/)
                    .map((a) => a.trim())
                    .filter(Boolean);

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

                      {/* Áreas Participantes */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {areasList.map((area, aIdx) => (
                            <span
                              key={aIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-gray-900 text-base">
                        <span className="text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {item.views.toLocaleString('pt-BR')}
                        </span>
                      </td>

                      {/* Novos Assinantes */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-emerald-800 text-sm">
                        <span className="bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          +{item.novos_assinantes}
                        </span>
                      </td>

                      {/* Curtidas */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-rose-700 text-sm">
                        <span className="bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                          {item.curtidas}
                        </span>
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
              Exibindo <strong>{displayRecords.length} edições</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Views totais: <strong className="text-brand-navy">{totalViews.toLocaleString('pt-BR')}</strong>
              </span>
              <span>
                Novos assinantes: <strong className="text-emerald-700">+{totalNovosAssinantes.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
