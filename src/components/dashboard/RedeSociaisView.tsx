import React, { useMemo, useState } from 'react';
import {
  RedesSociaisRegistro,
  redeSociaisData
} from '../../data/rede-sociais.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Share2,
  TrendingUp,
  Globe,
  Lock,
  Search,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  Eye,
  Users,
  Activity,
  BarChart3,
  LineChart,
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

const MESES_TODOS = [
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

interface RedeSociaisViewProps {
  selectedMonth: string;
}

export default function RedeSociaisView({ selectedMonth }: RedeSociaisViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Base normalizada
  const normalizedData = useMemo(() => {
    return redeSociaisData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica (Janeiro a Dezembro)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      return orderA - orderB;
    });
  }, [normalizedData]);

  // Registros apurados com dados reais (Janeiro a Agosto)
  const apuradosData = useMemo(() => {
    return sortedChronologically.filter((d) => d.linkedin_seguidores !== null);
  }, [sortedChronologically]);

  // Registro para exibição nos cards de destaque
  // Se houver um mês selecionado que tenha dados, usa ele. Caso contrário ou "Todos os meses", usa Agosto (mais recente apurado).
  const registroDestaque = useMemo(() => {
    if (selectedMonth && selectedMonth !== 'Todos os meses') {
      const item = sortedChronologically.find((d) => d.mes === selectedMonth);
      if (item) return item;
    }
    // Padrão: Agosto (mais recente apurado)
    return sortedChronologically.find((d) => d.mes === 'Agosto') || apuradosData[apuradosData.length - 1];
  }, [selectedMonth, sortedChronologically, apuradosData]);

  // Filtro de mês para a tabela
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

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Seguidores LinkedIn': d.linkedin_seguidores ?? 'Dados a carregar',
      'Crescimento LinkedIn (%)': d.linkedin_crescimento !== null ? `${d.linkedin_crescimento}%` : 'Dados a carregar',
      'Seguidores Instagram': d.insta_seguidores ?? 'Dados a carregar',
      'Crescimento Instagram (%)': d.insta_crescimento !== null ? `${d.insta_crescimento}%` : 'Dados a carregar',
      'Views no Site': d.site_views ?? 'Dados a carregar',
      'Usuários Únicos do Site': d.site_users ?? 'Dados a carregar',
      'Views na Intranet': d.intra_views ?? 'Dados a carregar',
      'Views Exclusivos na Intranet': d.intra_views_exclusivos ?? 'Dados a carregar'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Redes Sociais e Canais');
    XLSX.writeFile(wb, `Redes_Sociais_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  // Coordenadas para Gráfico de Redes Sociais (Janeiro a Agosto)
  const minLinkedin = 51000;
  const maxLinkedin = 54000;
  const minInsta = 3800;
  const maxInsta = 4400;

  const maxSiteViews = Math.max(...apuradosData.map((d) => d.site_views || 0), 1);
  const maxIntraViews = Math.max(...apuradosData.map((d) => d.intra_views || 0), 1);

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (NÚMEROS MAIS RECENTES / AGOSTO)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seguidores no LinkedIn */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Share2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Seguidores no LinkedIn
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {registroDestaque?.linkedin_seguidores !== null
                ? registroDestaque?.linkedin_seguidores?.toLocaleString('pt-BR')
                : 'Dados a carregar'}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              {registroDestaque?.linkedin_crescimento !== null ? (
                <>
                  <span>+{registroDestaque?.linkedin_crescimento}% no mês</span>
                  <ArrowUpRight size={14} className="text-emerald-500" />
                </>
              ) : (
                <span className="text-gray-400">Em apuração</span>
              )}
            </div>
          </div>
        </div>

        {/* Seguidores no Instagram */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Seguidores no Instagram
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-rose-800 mt-0.5">
              {registroDestaque?.insta_seguidores !== null
                ? registroDestaque?.insta_seguidores?.toLocaleString('pt-BR')
                : 'Dados a carregar'}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
              {registroDestaque?.insta_crescimento !== null ? (
                <>
                  <span>+{registroDestaque?.insta_crescimento}% no mês</span>
                  <ArrowUpRight size={14} className="text-rose-500" />
                </>
              ) : (
                <span className="text-gray-400">Em apuração</span>
              )}
            </div>
          </div>
        </div>

        {/* Views do Site Institucional */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Globe size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Views do Site
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {registroDestaque?.site_views !== null
                ? registroDestaque?.site_views?.toLocaleString('pt-BR')
                : 'Dados a carregar'}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {registroDestaque?.site_users !== null
                ? `${registroDestaque?.site_users?.toLocaleString('pt-BR')} usuários únicos`
                : 'Em apuração'}
            </div>
          </div>
        </div>

        {/* Views da Intranet */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Lock size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Views da Intranet
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {registroDestaque?.intra_views !== null
                ? registroDestaque?.intra_views?.toLocaleString('pt-BR')
                : 'Dados a carregar'}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {registroDestaque?.intra_views_exclusivos !== null
                ? `${registroDestaque?.intra_views_exclusivos} views exclusivos`
                : 'Em apuração'}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO 1: EVOLUÇÃO DE SEGUIDORES (LINKEDIN E INSTAGRAM)          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução de Seguidores: LinkedIn vs. Instagram (Janeiro a Agosto)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Trajetória de expansão da audiência digital institucional nos canais oficiais
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span className="font-semibold text-gray-700">LinkedIn (Eixo esquerdo: 51k a 54k)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="font-semibold text-gray-700">Instagram (Eixo direito: 3.8k a 4.4k)</span>
            </div>
          </div>
        </div>

        {/* Grid de Cards Mensais das Redes Sociais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {apuradosData.map((item) => {
            const isSelected = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`p-3 rounded-2xl border text-center flex flex-col justify-between transition-all ${
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

                <div className="my-3 space-y-2.5">
                  {/* LinkedIn */}
                  <div className="bg-white p-2 rounded-xl border border-gray-200/60">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                      LinkedIn
                    </span>
                    <span className="text-xs font-serif font-bold text-brand-navy">
                      {item.linkedin_seguidores?.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[9px] text-emerald-600 block font-medium">
                      +{item.linkedin_crescimento}%
                    </span>
                  </div>

                  {/* Instagram */}
                  <div className="bg-white p-2 rounded-xl border border-gray-200/60">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                      Instagram
                    </span>
                    <span className="text-xs font-serif font-bold text-rose-800">
                      {item.insta_seguidores?.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[9px] text-rose-600 block font-medium">
                      +{item.insta_crescimento}%
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 border-t border-gray-200/60 pt-1.5">
                  Apurado
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. GRÁFICO 2: EVOLUÇÃO DE SITE E INTRANET                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Site: Views vs Users */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Globe size={17} className="text-brand-blue" />
                  <span>Site Institucional: Views vs. Usuários</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visualizações e visitantes únicos mensais (Janeiro a Agosto)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {apuradosData.map((item) => {
                const barWidth = ((item.site_views || 0) / maxSiteViews) * 100;
                const usersWidth = ((item.site_users || 0) / maxSiteViews) * 100;

                return (
                  <div
                    key={item.mes}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-gray-900 w-20">
                        {item.mes}
                      </span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-purple-900">
                          {item.site_views?.toLocaleString('pt-BR')} views
                        </span>
                        <span className="text-[11px] text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.site_users?.toLocaleString('pt-BR')} usuários
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel Intranet: Views vs Views Exclusivos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Lock size={17} className="text-brand-blue" />
                  <span>Intranet Madrona: Views vs. Views Exclusivos</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Engajamento da comunidade interna do escritório
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {apuradosData.map((item) => {
                const barWidth = ((item.intra_views || 0) / maxIntraViews) * 100;

                return (
                  <div
                    key={item.mes}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-gray-900 w-20">
                        {item.mes}
                      </span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-amber-800">
                          {item.intra_views?.toLocaleString('pt-BR')} views
                        </span>
                        <span className="text-[11px] text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.intra_views_exclusivos} exclusivos
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className="bg-amber-600 h-full rounded-full transition-all duration-500"
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
      {/* 4. TABELA COMPLETA COM OS 12 MESES                                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Busca e Exportação */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Share2 size={18} className="text-brand-blue" />
                <span>Base Histórica Completa de Redes Sociais e Portais</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  (12 meses • 2026)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Valores de Setembro a Dezembro assinalados como "Dados a carregar" até a conclusão de cada período
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
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-40 sm:w-52"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa de redes sociais para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/70 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5 w-24">Mês</th>
                <th className="py-3 px-3 text-center">Seguidores LinkedIn</th>
                <th className="py-3 px-3 text-center">Cresc. LinkedIn</th>
                <th className="py-3 px-3 text-center">Seguidores Instagram</th>
                <th className="py-3 px-3 text-center">Cresc. Instagram</th>
                <th className="py-3 px-3 text-center">Views Site</th>
                <th className="py-3 px-3 text-center">Users Site</th>
                <th className="py-3 px-3 text-center">Views Intranet</th>
                <th className="py-3 px-3 text-center">Exclusivos Intranet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.map((item, idx) => {
                const hasData = item.linkedin_seguidores !== null;

                return (
                  <tr
                    key={item.mes}
                    className={`hover:bg-blue-50/20 transition-colors ${
                      !hasData ? 'bg-gray-50/30' : ''
                    }`}
                  >
                    {/* Numeração */}
                    <td className="py-3 px-3.5 text-center text-gray-400 text-xs">
                      {idx + 1}
                    </td>

                    {/* Mês */}
                    <td className="py-3 px-3.5 font-semibold text-gray-900 whitespace-nowrap">
                      {item.mes}
                    </td>

                    {/* Seguidores LinkedIn */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-serif font-bold text-brand-navy">
                      {item.linkedin_seguidores !== null ? (
                        item.linkedin_seguidores.toLocaleString('pt-BR')
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Crescimento LinkedIn */}
                    <td className="py-3 px-3 text-center whitespace-nowrap text-emerald-700 font-semibold">
                      {item.linkedin_crescimento !== null ? (
                        `+${item.linkedin_crescimento}%`
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Seguidores Instagram */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-serif font-bold text-rose-800">
                      {item.insta_seguidores !== null ? (
                        item.insta_seguidores.toLocaleString('pt-BR')
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Crescimento Instagram */}
                    <td className="py-3 px-3 text-center whitespace-nowrap text-rose-600 font-semibold">
                      {item.insta_crescimento !== null ? (
                        `+${item.insta_crescimento}%`
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Views Site */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-purple-900 font-medium">
                      {item.site_views !== null ? (
                        item.site_views.toLocaleString('pt-BR')
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Users Site */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-gray-700">
                      {item.site_users !== null ? (
                        item.site_users.toLocaleString('pt-BR')
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Views Intranet */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-amber-900 font-medium">
                      {item.intra_views !== null ? (
                        item.intra_views.toLocaleString('pt-BR')
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>

                    {/* Exclusivos Intranet */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-gray-700">
                      {item.intra_views_exclusivos !== null ? (
                        item.intra_views_exclusivos.toLocaleString('pt-BR')
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Dados a carregar</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
          <span>
            Exibindo <strong>{displayRecords.length} meses</strong> no painel de redes e portais.
          </span>
          <div className="flex items-center gap-3">
            <span>
              Mês mais recente: <strong className="text-brand-navy">Agosto (53.312 no LinkedIn)</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
